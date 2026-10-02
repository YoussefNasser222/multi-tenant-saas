import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Auth, Paid, User } from '@common/decorators';
import { multiImageUploadOptions } from '@common/upload';
import { ParseObjectIdPipe } from '@common/pipes';
import { AccepterRole } from '@models/index';
import { SurgeryBookingService } from './surgery-booking.service';
import { CreateSurgeryBookingDto } from './dto/create-surgery-booking.dto';

@Controller('surgery-booking')
export class SurgeryBookingController {
  constructor(private readonly bookingService: SurgeryBookingService) {}

  @Post()
  @Auth(['Patient'])
  @UseInterceptors(FilesInterceptor('reports', 5, multiImageUploadOptions))
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateSurgeryBookingDto,
    @User() user: any,
  ) {
    const booking = await this.bookingService.create(files, dto, user);
    return {
      message: 'تم إرسال طلب حجز العملية بنجاح',
      success: true,
      data: { booking },
    };
  }

  @Get('mine')
  @Auth(['Patient'])
  async getMine(@User() user: any) {
    const bookings = await this.bookingService.getMine(user);
    return { message: 'data retrieved successfully', success: true, data: { bookings } };
  }

  @Get()
  @Paid(['Doctor', 'Hospital'])
  async getAllForProviders() {
    const bookings = await this.bookingService.getAllForProviders();
    return { message: 'data retrieved successfully', success: true, data: { bookings } };
  }

  @Get(':id')
  @Auth(['Patient', 'Doctor', 'Hospital'])
  async getOne(@Param('id', ParseObjectIdPipe) id: string, @User() user: any) {
    const providerRole: AccepterRole | undefined =
      user.role === 'Doctor' ? AccepterRole.Doctor : user.role === 'Hospital' ? AccepterRole.Hospital : undefined;
    const booking = await this.bookingService.getOne(id, user, providerRole);
    return { message: 'data retrieved successfully', success: true, data: { booking } };
  }

  @Patch(':id/accept')
  @Paid(['Doctor', 'Hospital'])
  async accept(@Param('id', ParseObjectIdPipe) id: string, @User() user: any) {
    const role = user.role === 'Hospital' ? AccepterRole.Hospital : AccepterRole.Doctor;
    const booking = await this.bookingService.accept(id, role, user);
    return { message: 'تم قبول الطلب بنجاح', success: true, data: { booking } };
  }

  @Patch(':id/complete')
  @Paid(['Doctor', 'Hospital'])
  async complete(@Param('id', ParseObjectIdPipe) id: string, @User() user: any) {
    const role = user.role === 'Hospital' ? AccepterRole.Hospital : AccepterRole.Doctor;
    const booking = await this.bookingService.complete(id, role, user);
    return { message: 'تم إغلاق الطلب كمكتمل', success: true, data: { booking } };
  }

  @Patch(':id/cancel')
  @Auth(['Patient'])
  async cancel(@Param('id', ParseObjectIdPipe) id: string, @User() user: any) {
    const booking = await this.bookingService.cancel(id, user);
    return { message: 'تم إلغاء الطلب', success: true, data: { booking } };
  }
}
