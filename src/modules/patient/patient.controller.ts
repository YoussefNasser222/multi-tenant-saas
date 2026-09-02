import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Auth, Paid, User } from '@common/decorators';
import { UpdatedPatientDto } from '@modules/auth/dto/update-auth.dto';
import { PatientFactoryService } from './factory';

@Controller('patient')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientFactoryService: PatientFactoryService,
  ) {}

  @Get()
  @Auth(['Patient'])
  async getProfile(@User() user: any) {
    const patient = await this.patientService.getProfile(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { patient },
    };
  }

  @Put(':id')
  @Paid(['Doctor'])
  async updatePatientById(
    @User() user: any,
    @Body() updatePatientDto: UpdatedPatientDto,
    @Param('id') id: string,
  ) {
    const patient = await this.patientFactoryService.updatePatientById(id, updatePatientDto)
    const updatedPatient = await this.patientService.updatePatientById(patient, user, id);
    return {
      message: 'patient updated successfully',
      success: true,
      data: { updatedPatient },
    };
  }

  @Put()
  @Auth(['Patient'])
  async updateMe(
    @User() user: any,
    @Body() updatePatientDto: UpdatedPatientDto,
  ) {
    const patient = await this.patientFactoryService.update(user, updatePatientDto);
    const updatedPatient = await this.patientService.updateMe(patient, user);
    return {
      message: 'patient updated successfully',
      success: true,
      data: { updatedPatient },
    };
  }

  @Get('lookup/:id')
  @Paid(['Doctor'])
  async getPatientByNationalId(@Param('id') id: string) {
    const patient = await this.patientService.getPatientByNationalId(id);
    return {
      message: 'patient already exist',
      success: true,
      data: { patient },
    };
  }

  @Get('my-patients')
  @Paid(['Doctor'])
  async getMyPatients(@User() user: any) {
    const patients = await this.patientService.getMyPatients(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { patients },
    };
  }

  /* مرضى النظام غير المسجلين عند هذا الدكتور */
  @Get('non-clinic-patients')
  @Paid(['Doctor'])
  async getNonClinicPatients(
    @User() user: any,
    @Query('search') search?: string,
  ) {
    const patients = await this.patientService.getNonClinicPatients(user, search);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { patients },
    };
  }

  @Get('my-patient/:id')
  @Paid(['Doctor'])
  async getMyPatientById(@User() user: any, @Param('id') id: string) {
    const result = await this.patientService.getPatientById(user, id);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { result },
    };
  }
}
