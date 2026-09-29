import {
  generateOtp,
  generateOtpExpire,
  hashOtp,
  sendMail,
  verifyOtp,
} from '@common/helpers';
import { stripSensitive } from '@common/constants';
import {
  DoctorRepository,
  HospitalRepository,
  PatientRepository,
  TokenRepository,
  UserRepository,
} from '@models/index';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, ResetPasswordDto } from './dto/create-auth.dto';
import { Doctor, Hospital, Patient } from './entities/auth.entity';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 دقيقة
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // مينفعش يطلب OTP جديد قبل دقيقة
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 دقيقة
// hash وهمي بنقارن بيه لما اليوزر مش موجود عشان زمن الرد يفضل ثابت (يمنع timing attack)
const DUMMY_HASH = '$2b$10$EN1bdw/rA/3eDOfl615SF.AIKBrg6EL7/SKqtU710X/7jbldzSRtK';

@Injectable()
export class AuthService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly tokenRepo: TokenRepository,
    private readonly configService: ConfigService,
    private readonly hospitalRepo: HospitalRepository,
  ) {}

  // تجميع تكرار توليد الـ accessToken/refreshToken في مكان واحد بدل ما يتكرر في كذا method
  private generateTokens(user: { _id: any; role: any }) {
    const accessToken = this.jwtService.sign(
      {
        userId: user._id,
        role: user.role,
        type: 'access',
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1d',
      } as JwtSignOptions,
    );
    const refreshToken = this.jwtService.sign(
      {
        userId: user._id,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '7d',
      } as JwtSignOptions,
    );
    return { accessToken, refreshToken };
  }

  async createDoctor(doctor: Doctor) {
    const userExist = await this.userRepo.getOne({
      nationalId: doctor.nationalId,
    });
    if (userExist) {
      throw new ConflictException('doctor already exist');
    }
    const newDoctor = await this.doctorRepo.create(doctor);
    const { isPaid, paidExpired, ...other } = stripSensitive(
      newDoctor.toObject(),
    ) as any;
    return other;
  }
  async createPatient(patient: Patient) {
    const userExist = await this.userRepo.getOne({
      nationalId: patient.nationalId,
    });
    if (userExist) {
      throw new ConflictException('patient already exist');
    }
    const newPatient = await this.patientRepo.create(patient);
    return stripSensitive(newPatient.toObject());
  }
  async login(loginDto: LoginDto) {
    const user = await this.userRepo.getOne({ nationalId: loginDto.nationalId });

    // القفل المؤقت بعد محاولات فاشلة متكررة (محفوظ في الداتابيز → شغال على serverless كمان)
    if (user?.loginLockedUntil && user.loginLockedUntil > new Date()) {
      throw new HttpException(
        'too many attempts, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // بنقارن دايمًا (حتى لو اليوزر مش موجود) وبنرجّع نفس الرسالة في الحالتين:
    // مينفعش نكشف إن كان الرقم القومي مسجّل ولا لأ (خصوصية بيانات المرضى)
    const isMatch = await bcrypt.compare(
      loginDto.password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !isMatch) {
      if (user) {
        const attempts = (user.loginAttempts || 0) + 1;
        const update: any = { loginAttempts: attempts };
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          update.loginLockedUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
          update.loginAttempts = 0;
        }
        await this.userRepo.update({ _id: user._id }, update);
      }
      throw new UnauthorizedException('invalid credential');
    }

    if (user.loginAttempts || user.loginLockedUntil) {
      await this.userRepo.update(
        { _id: user._id },
        { loginAttempts: 0, loginLockedUntil: null },
      );
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.tokenRepo.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    return { accessToken, refreshToken };
  }
  async refreshToken(refreshToken: string) {
    // لازم يبقى string فعلًا (يمنع NoSQL injection زي { "$ne": null })
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new BadRequestException('refresh token is required');
    }
    // نتأكد من التوقيع والصلاحية قبل ما نروح الداتابيز أصلًا
    let payload: { userId: string; type?: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('session expired, please login again');
    }
    if (payload.type === 'access') {
      throw new UnauthorizedException('session expired, please login again');
    }
    const token = await this.tokenRepo.getOne({ refreshToken });
    if (!token) {
      throw new UnauthorizedException('session expired, please login again');
    }
    const user = await this.userRepo.getOne({ _id: token.userId });
    if (!user) {
      // الحساب اتحذف → الجلسة تتقفل
      await this.tokenRepo.deleteMany({ userId: token.userId });
      throw new UnauthorizedException('session expired, please login again');
    }
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

    const updated = await this.tokenRepo.update(
      { refreshToken },
      {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    );
    if (!updated) {
      throw new UnauthorizedException('session expired, please login again');
    }

    return { accessToken, refreshToken: newRefreshToken };
  }
  async logout(userId: any) {
    // بيمسح كل الجلسات (refresh tokens) بتاعة اليوزر ده
    await this.tokenRepo.deleteMany({ userId });
  }
  async sendOtp(email: string) {
    const user = await this.userRepo.getOne({ email });
    // لو الإيميل مش موجود بنرجّع نجاح عادي (من غير ما نكشف إن الحساب مش موجود)
    if (!user) {
      return;
    }
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      throw new BadRequestException('too many attempts, try again later');
    }
    // cooldown: otpExpired = وقت الإرسال + 15 دقيقة، فلو لسه فاضل أكتر من 14 دقيقة يبقى اتبعت من أقل من دقيقة
    if (
      user.otpExpired &&
      user.otpExpired.getTime() - Date.now() >
        15 * 60 * 1000 - OTP_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'please wait a minute before requesting a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const otp = generateOtp();
    const otpExpired = generateOtpExpire();
    await sendMail({
      to: email,
      subject: 'Reset Password',
      html: `<h1>Your OTP is ${otp}</h1>`,
    });
    // بنخزّن hash للـ OTP مش الرقم نفسه.
    // ومبنصفّرش عداد المحاولات هنا (كان ممكن المهاجم يطلب OTP جديد كل شوية ويكمل تخمين).
    await this.userRepo.update({ email }, { otp: hashOtp(otp), otpExpired });
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepo.getOne({ email: resetPasswordDto.email });
    // نفس الرسالة لو الحساب مش موجود أو الكود غلط
    if (!user) {
      throw new BadRequestException('invalid otp');
    }
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      throw new BadRequestException('too many attempts, try again later');
    }
    if (!verifyOtp(resetPasswordDto.otp, user.otp)) {
      const attempts = (user.otpAttempts || 0) + 1;
      const update: any = { otpAttempts: attempts };
      if (attempts >= MAX_OTP_ATTEMPTS) {
        update.otpLockedUntil = new Date(Date.now() + OTP_LOCK_DURATION_MS);
        update.otpAttempts = 0;
        // بعد القفل الكود القديم يتلغي
        update.otp = '';
      }
      await this.userRepo.update({ email: resetPasswordDto.email }, update);
      throw new BadRequestException('invalid otp');
    }
    if (!user.otpExpired || user.otpExpired < new Date()) {
      throw new BadRequestException('otp expired');
    }
    const hashPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userRepo.update(
      { email: resetPasswordDto.email },
      {
        password: hashPassword,
        otp: '',
        otpAttempts: 0,
        otpLockedUntil: null,
        loginAttempts: 0,
        loginLockedUntil: null,
      },
    );
    // تغيير الباسورد يقفل كل الجلسات القديمة
    await this.tokenRepo.deleteMany({ userId: user._id });
  }
  async createHospital(hospital: Hospital) {
    const hospitalExist = await this.hospitalRepo.getOne({
      nationalId : hospital.nationalId
    });
    if (hospitalExist) {
      throw new ConflictException('hospital already exists');
    }
    const hospitalData = await this.hospitalRepo.create(hospital);
    const { isPaid, ...other } = stripSensitive(hospitalData.toObject()) as any;
    return other;
  }
}