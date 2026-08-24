import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmergencyCaseService } from './emergency-case.service';
import { CreateEmergencyCaseDto } from './dto/create-emergency-case.dto';
import { UpdateEmergencyCaseDto } from './dto/update-emergency-case.dto';
import { Paid, Public, User } from '@common/decorators';
import { EmergencyCaseFactory } from './factory';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('emergency-case')
export class EmergencyCaseController {
  constructor(
    private readonly emergencyCaseService: EmergencyCaseService,
    private readonly emergencyFactory: EmergencyCaseFactory,
  ) {}

  @Post()
  @Public()
  async create(@Body() createEmergencyCaseDto: CreateEmergencyCaseDto) {
    const emergency = this.emergencyFactory.create(createEmergencyCaseDto);
    const createdEmergency = await this.emergencyCaseService.create(emergency);
    return {
      message: 'emergency-case created successfully',
      success: true,
      data: { createdEmergency },
    };
  }
  @Put('report/:caseCode')
  @Public()
  @UseInterceptors(FileInterceptor('image'))
  async uploadReport(
    @UploadedFile() file: Express.Multer.File,
    @Param('caseCode') caseCode: string,
  ) {
    if (!file) throw new BadRequestException('file is required');
    const result = await this.emergencyCaseService.uploadReport(file, caseCode);
    return {
      message: 'report uploaded successfully',
      success: true,
      data: { result },
    };
  }
  @Get(':id')
  @Paid(['Hospital'])
  async getReportById(@User() user: any, @Param('id') id: string) {
    const emergency = await this.emergencyCaseService.getOne(user, id);
    return {
      message: 'date retrieved successfully',
      success: true,
      data: { emergency },
    };
  }
  @Get()
  @Paid(['Hospital'])
  async getAll() {
    const emergencies = await this.emergencyCaseService.getAll();
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { emergencies },
    };
  }

  @Patch(':id/claim')
  @Paid(['Hospital'])
  async claim(@Param('id') id: string, @User() user: any) {
    const emergency = await this.emergencyCaseService.claim(id, user);
    return {
      message: 'case claimed successfully',
      success: true,
      data: { emergency },
    };
  }
  @Patch(':id/resolve')
  @Paid(['Hospital'])
  async resolve(@Param('id') id: string, @User() user: any) {
    const emergency = await this.emergencyCaseService.resolve(id, user);
    return {
      message: 'case resolved successfully',
      success: true,
      data: { emergency },
    };
  }
  @Get('track/:caseCode')
  @Public()
  async trackByCaseCode(@Param('caseCode') caseCode: string) {
    const emergency = await this.emergencyCaseService.trackByCaseCode(caseCode);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { emergency },
    };
  }

  @Delete('track/:caseCode')
  @Public()
  async cancelByCaseCode(@Param('caseCode') caseCode: string) {
    await this.emergencyCaseService.cancelByCaseCode(caseCode);
    return { message: 'case cancelled successfully', success: true };
  }
}
