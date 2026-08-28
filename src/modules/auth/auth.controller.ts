import { Paid, User } from '@common/decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateAdminDto, CreateDoctorDto, CreatePatientDto, LoginDto, ResetPasswordDto } from './dto/create-auth.dto';
import { AuthFactoryService } from './factory';
import { CreateHospitalDto } from './dto/create-hospital.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly authFactoryService: AuthFactoryService
  ) { }
  @Post('register/admin')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.authFactoryService.createAdmin(createAdminDto);
    const createdAdmin = await this.authService.createAdmin(admin);
    return {
      message: "admin created successfully",
      success: true,
      data: { createdAdmin }
    };
  }
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
  async createDoctor(@Body() createDoctorDto: CreateDoctorDto): Promise<{ message: string; success: boolean; data: { createdDoctor: { phoneNumber: string; firstName: string; lastName: string; clinicId: import("mongoose").Types.ObjectId; _id: import("mongoose").Types.ObjectId; email: string; role: import("../../models").Role; nationalId: string; __v: number; }; }; }> {
    const doctor = await this.authFactoryService.createDoctor(createDoctorDto)
    const createdDoctor = await this.authService.createDoctor(doctor);
    return {
      message: "doctor created successfully",
      success: true,
      data: { createdDoctor }
    }
  }
  @Post('register/patient')
  @Paid(['Doctor'])
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createPatient(@Body() createPatientDto: CreatePatientDto , @User() user : any ) {
    const patient = await this.authFactoryService.createPatient(createPatientDto , user)
    const createdPatient = await this.authService.createPatient(patient);
    return {
      message: "patient created successfully",
      success: true,
      data: { createdPatient }
    }
  }
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async login(@Body() loginDto : LoginDto){
 const result = await this.authService.login(loginDto)
 return {
  message :  "user login successfully",
  success : true,
  data : result
 }
  }
  @Post('refresh-token')
  async refreshToken(@Body("refreshToken") refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      message: "token refreshed successfully",
      success: true,
      data: { result }
    }
  }
  @Post('send-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async sendOtp(@Body('email') email: string) {
    await this.authService.sendOtp(email);
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
