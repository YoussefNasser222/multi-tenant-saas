import { Auth, Public, User } from '@common/decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '@models/index';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  CreateDoctorDto,
  CreatePatientDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SendOtpDto,
} from './dto/create-auth.dto';
import { AuthFactoryService } from './factory';
import { CreateHospitalDto } from './dto/create-hospital.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly authFactoryService: AuthFactoryService
  ) { }

  @Post('register/hospital')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createHospital(@Body() createHospitalDto: CreateHospitalDto) {
    const hospital = await this.authFactoryService.createHospital(createHospitalDto)
    const createdHospital = await this.authService.createHospital(hospital);
    return {
      message: "hospital created successfully",
      success: true,
      data: { createdHospital }
    }
  }

  @Post('register/doctor')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    const doctor = await this.authFactoryService.createDoctor(createDoctorDto)
    const createdDoctor = await this.authService.createDoctor(doctor);
    return {
      message: "doctor created successfully",
      success: true,
      data: { createdDoctor }
    }
  }

  /* مريض فردي — عام أو طبيب */
  @Post('register/patient')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createPatient(@Body() createPatientDto: CreatePatientDto, @User() user?: any) {
    const patient = await this.authFactoryService.createPatient(createPatientDto, user)
    const createdPatient = await this.authService.createPatient(patient);
    return {
      message: "patient created successfully",
      success: true,
      data: { createdPatient }
    }
  }


  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto)
    return {
      message: "user login successfully",
      success: true,
      data: result
    }
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto.refreshToken);
    return {
      message: "token refreshed successfully",
      success: true,
      data: { result }
    }
  }

  // جديد: تسجيل خروج فعلي بيلغي جلسات اليوزر (refresh tokens) بدل ما يفضل التوكن صالح لحد ما ينتهي لوحده
  @Post('logout')
  @Auth([Role.Admin, Role.Doctor, Role.Patient, Role.Hospital])
  async logout(@User() user: any) {
    await this.authService.logout(user._id);
    return {
      message: "logged out successfully",
      success: true,
    }
  }

  @Post('send-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async sendOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendOtp(dto.email);
    return {
      message: "otp sent successfully",
      success: true,
    }
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: "password reset successfully",
      success: true,
    }
  }
}