import { generateOtp, generateOtpExpire, sendMail } from '@common/helpers';
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
  Injectable,
  NotFoundException,
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
    const { password, isPaid, paidExpired, otp, otpExpired, ...other } =
      newDoctor.toObject();
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
    const { password, otp, otpExpired, ...other } = newPatient.toObject();
    return other;
  }
  async login(loginDto: LoginDto) {
    const user = await this.userRepo.getOne({ nationalId: loginDto.nationalId });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('invalid credential');
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
    if (!refreshToken) {
      throw new BadRequestException('refresh token is required');
    }
    const token = await this.tokenRepo.getOne({ refreshToken });
    if (!token) {
      throw new UnauthorizedException('session expired, please login again');
    }
    const user = await this.userRepo.getOne({ _id: token.userId });
    if (!user) {
      throw new NotFoundException('user not found');
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
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      throw new BadRequestException('too many attempts, try again later');
    }
    const otp = generateOtp();
    const otpExpired = generateOtpExpire();
    await sendMail({
      to: email,
      subject: 'Reset Password',
      html: `<h1>Your OTP is ${otp}</h1>`,
    });
    await this.userRepo.update(
      { email },
      { otp, otpExpired, otpAttempts: 0, otpLockedUntil: null },
    );
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepo.getOne({ email: resetPasswordDto.email });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      throw new BadRequestException('too many attempts, try again later');
    }
    if (user.otp !== resetPasswordDto.otp) {
      const attempts = (user.otpAttempts || 0) + 1;
      const update: any = { otpAttempts: attempts };
      if (attempts >= MAX_OTP_ATTEMPTS) {
        update.otpLockedUntil = new Date(Date.now() + OTP_LOCK_DURATION_MS);
      }
      await this.userRepo.update({ email: resetPasswordDto.email }, update);
      throw new BadRequestException('invalid otp');
    }
    if (user.otpExpired < new Date()) {
      throw new BadRequestException('otp expired');
    }
    const hashPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    // كانت otp/otpExpired بتتغير على الـ object المحلي بس من غير ما تتحفظ فعليًا في الداتابيز
    // (يعني الـ OTP كان يفضل صالح وقابل لإعادة الاستخدام لحد ما ينتهي لوحده) - اتصلحت هنا
    await this.userRepo.update(
      { email: resetPasswordDto.email },
      { password: hashPassword, otp: '', otpAttempts: 0, otpLockedUntil: null },
    );
  }
  async createHospital(hospital: Hospital) {
    const hospitalExist = await this.hospitalRepo.getOne({
      nationalId : hospital.nationalId
    });
    if (hospitalExist) {
      throw new ConflictException('hospital already exists');
    }
    const hospitalData = await this.hospitalRepo.create(hospital);
    const {password , otp , otpExpired , isPaid , ...other} = hospitalData.toObject() 
    return other;
  }
}