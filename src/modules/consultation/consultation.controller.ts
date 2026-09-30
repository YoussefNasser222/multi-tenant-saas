import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Auth, Paid, User } from '@common/decorators';
import { imageUploadOptions } from '@common/upload';
import { ParseObjectIdPipe } from '@common/pipes';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { AddConsultationReplyDto } from './dto/add-consultation-reply.dto';

@Controller('consultation')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @Auth(['Patient'])
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateConsultationDto,
    @User() user: any,
  ) {
    const consultation = await this.consultationService.create(
      file,
      dto.question,
      user,
    );
    return {
      message: 'تم إرسال استشارتك بنجاح',
      success: true,
      data: { consultation },
    };
  }

  @Get('mine')
  @Auth(['Patient'])
  async getMyConsultations(@User() user: any) {
    const consultations = await this.consultationService.getMyConsultations(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { consultations },
    };
  }

  @Get('all')
  @Paid(['Doctor'])
  async getAllConsultations() {
    const consultations = await this.consultationService.getAllConsultations();
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { consultations },
    };
  }

  @Get(':id')
  @Auth(['Patient', 'Doctor'])
  async getOne(@Param('id', ParseObjectIdPipe) id: string, @User() user: any) {
    const consultation = await this.consultationService.getOne(
      id,
      user,
      user.role === 'Doctor',
    );
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { consultation },
    };
  }

  @Post(':id/reply')
  @Paid(['Doctor'])
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async addDoctorReply(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddConsultationReplyDto,
    @User() user: any,
  ) {
    const consultation = await this.consultationService.addDoctorReply(
      id,
      user,
      dto.text,
    );
    return {
      message: 'تم إضافة الرد بنجاح',
      success: true,
      data: { consultation },
    };
  }
}
