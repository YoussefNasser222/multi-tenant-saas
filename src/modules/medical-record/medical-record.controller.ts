import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Auth, Paid, User } from '@common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '@common/upload';
import { PrescriptionExtractorService } from './prescription-extractor.service';
import { log } from 'console';
import { MedicalRecordFactoryService } from './factory';
import { Throttle } from '@nestjs/throttler';

@Controller('medical-record')
export class MedicalRecordController {
  constructor(
    private readonly medicalRecordService: MedicalRecordService,
    private readonly medicalRecordFactoryService: MedicalRecordFactoryService,
  ) {}

  @Post('extract')
  @Paid(['Doctor'])
  @UseInterceptors(FileInterceptor('image'))
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async extractPrescription(@UploadedFile() file: Express.Multer.File , @User() user : any) {
    const { uploaded, extracted } =
      await this.medicalRecordService.extractPrescription(file , user);
    return {
      message: 'extracted successfully, please review before saving',
      success: true,
      data: {
        imageUrl: uploaded.secure_url,
        extracted,
      },
    };
  }

  @Post()
  @Paid(['Doctor'])
  async create(@Body() dto: CreateMedicalRecordDto, @User() user: any) {
    const medicalRecord =
      await this.medicalRecordFactoryService.createMedicalRecord(dto, user);
    const createdMedicalRecord =
      await this.medicalRecordService.create(medicalRecord);
    return {
      message: 'medical record created successfully',
      success: true,
      data: createdMedicalRecord,
    };
  }

  @Get(':id')
  @Paid(['Doctor'])
  async getById(@Param('id') id: string, @User() user: any) {
    const medicalRecord = await this.medicalRecordService.getById(id, user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { medicalRecord },
    };
  }

  @Get('patient/:id')
  @Paid(['Doctor'])
  async getMedicalRecord(@User() user: any, @Param('id') id: string) {
    const medicalRecords = await this.medicalRecordService.getMedicalRecord(
      user,
      id,
    );
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { medicalRecords },
    };
  }

  @Get()
  @Auth(['Patient'])
  async getMyMedicalRecord(@User() user: any) {
    const medicalRecords =
      await this.medicalRecordService.getMyMedicalRecord(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { medicalRecords },
    };
  }

  // ── Patient Document Upload / Manage ──────────────────────
  @Post('patient/upload')
  @Auth(['Patient'])
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPatientDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @User() user: any,
  ) {
    const doc = await this.medicalRecordService.uploadPatientDocument(file, body, user);
    return {
      message: 'Document saved successfully',
      success: true,
      data: { document: doc },
    };
  }

  @Put('patient/document/:id')
  @Auth(['Patient'])
  @UseInterceptors(FileInterceptor('file'))
  async updatePatientDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @User() user: any,
  ) {
    const updated = await this.medicalRecordService.updatePatientDocument(id, file, body, user);
    return {
      message: 'Document updated successfully',
      success: true,
      data: { document: updated },
    };
  }

  @Delete('patient/document/:id')
  @Auth(['Patient'])
  async deletePatientDocument(
    @Param('id') id: string,
    @User() user: any,
  ) {
    await this.medicalRecordService.deletePatientDocument(id, user);
    return {
      message: 'Document deleted successfully',
      success: true,
      data: null,
    };
  }

  @Get('patient/my-documents')
  @Auth(['Patient'])
  async getMyDocuments(@User() user: any) {
    const documents = await this.medicalRecordService.getMyDocuments(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { documents },
    };
  }

  @Get('patient/documents/:patientId')
  @Paid(['Doctor'])
  async getPatientDocuments(
    @User() user: any,
    @Param('patientId') patientId: string,
  ) {
    const documents = await this.medicalRecordService.getPatientDocuments(user, patientId);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { documents },
    };
  }
}
