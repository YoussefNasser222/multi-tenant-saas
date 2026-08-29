import { Auth, User } from '@common/decorators';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminFactoryService } from './factory';
import { IsNumber } from 'class-validator';
import { ActiveAccountDto as ActiveAccountDto, ActiveHospitalDto } from './dto/create-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '@common/upload';

@Controller('admin')
@Auth(['Admin'])
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminFactoryService: AdminFactoryService,
    private readonly uploadService: UploadService,
  ) {}
  @Get('dash-board')
  async getDashboard() {
    const result = await this.adminService.dashBoard();
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { result },
    };
  }
  @Put()
  async updateAdmin(@Body() updateAdminDto: UpdateAdminDto, @User() user: any) {
    const admin = await this.adminFactoryService.update(user, updateAdminDto);
    const updatedAdmin = await this.adminService.updateAdmin(user, admin);
    return {
      message: 'admin updated successfully',
      success: 'true',
      data: { updatedAdmin },
    };
  }
  @Get('profile')
  async getProfile(@User() user: any) {
    const admin = await this.adminService.getAdmin(user);
    return {
      message: 'admin retrieved successfully',
      success: 'true',
      data: { admin },
    };
  }
  @Get('doctors')
  async getDoctors() {
    const doctors = await this.adminService.getDoctors();
    return {
      message: 'doctors retrieved successfully',
      success: 'true',
      data: { doctors },
    };
  }
  @Get('doctors/:id')
  async getDoctor(@User() user: any, @Param('id') id: string) {
    const doctor = await this.adminService.getDoctor(user, id);
    return {
      message: 'doctor retrieved successfully',
      success: 'true',
      data: { doctor },
    };
  }
  @Get('clinics')
  async getClinics() {
    const clinics = await this.adminService.getClinics();
    return {
      message: 'clinics retrieved successfully',
      success: 'true',
      data: { clinics },
    };
  }
  @Get('clinics/:id')
  async getClinic(@User() user: any, @Param('id') id: string) {
    const clinic = await this.adminService.getClinic(user, id);
    return {
      message: 'clinic retrieved successfully',
      success: 'true',
      data: { clinic },
    };
  }
  @Patch('doctors/:id/active')
  async activeDoctor(
    @Param('id') id: string,
    @Body() activeAccountDto: ActiveAccountDto,
  ) {
    const doctor = await this.adminService.activeDoctor(id, activeAccountDto);
    return {
      message: 'doctor activated successfully',
      success: 'true',
      data: { doctor },
    };
  }
  @Patch('hospital/:id/active')
  async activeHospital(@Param('id') id: string, @Body() dto: ActiveHospitalDto) {
    const hospital = await this.adminService.activeHospital(id, dto);
    return {
      message: 'hospital activated successfully',
      success: 'true',
      data: { hospital },
    };
  }
  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    await this.adminService.deleteDoctor(id);
    return {
      message: 'doctor deleted successfully',
      success: 'true',
    };
  }
  @Delete('patients/:id')
  async deletePatient(@Param('id') id: string) {
    await this.adminService.deletePatient(id);
    return {
      message: 'patient deleted successfully',
      success: 'true',
    };
  }
  @Delete('hospital/:id')
  async deleteHospital(@Param('id') id: string) {
    await this.adminService.deleteHospital(id);
    return {
      message: 'hospital deleted successfully',
      success: 'true',
    };
  }
  @Get('hospital/:id')
  async getHospitalById(@Param('id') id: string) {
    const hospital = await this.adminService.getHospitalById(id);
    return {
      message: 'hospital retrieved successfully',
      success: 'true',
      data: { hospital },
    };
  }
  @Get('hospital')
  async getHospitals() {
    const hospitals = await this.adminService.getHospitals();
    return {
      message: 'hospital retrieved successfully',
      success: 'true',
      data: { hospitals},
    };
  }
}
