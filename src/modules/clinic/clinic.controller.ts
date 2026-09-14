import { Controller, Param, Query } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { Get } from '@nestjs/common';
import { Public } from '@common/decorators';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('clinic')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}
  @Get(':id/queue-status')
  @Public()
  @SkipThrottle()
  async getQueueStatus(@Param('id') id: string, @Query('date') date: string) {
    const result = await this.clinicService.getQueueStatus(id, date);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @Public()
  @SkipThrottle()
  async getClinicById(@Param('id') id: string) {
    const clinic = await this.clinicService.getClinicById(id);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { clinic },
    };
  }
  @Get()
  @Public()
  @SkipThrottle()
  async getClinics() {
    const clinics = await this.clinicService.getClinics();
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { clinics },
    };
  }
}
