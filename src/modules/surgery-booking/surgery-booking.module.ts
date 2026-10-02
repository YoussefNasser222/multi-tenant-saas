import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  notificationSchema,
  NotificationRepository,
  SurgeryBooking,
  surgeryBookingSchema,
  SurgeryBookingRepository,
} from '@models/index';
import { UploadModule } from '@common/upload';
import { UserMongoModule } from '@shared/user-mongo.module';
import { SurgeryBookingController } from './surgery-booking.controller';
import { SurgeryBookingService } from './surgery-booking.service';

@Module({
  imports: [
    UserMongoModule, // DoctorRepository, HospitalRepository, PatientRepository
    UploadModule,
    MongooseModule.forFeature([
      { name: SurgeryBooking.name, schema: surgeryBookingSchema },
      { name: Notification.name, schema: notificationSchema },
    ]),
  ],
  controllers: [SurgeryBookingController],
  providers: [
    SurgeryBookingService,
    SurgeryBookingRepository,
    NotificationRepository,
    JwtService,
  ],
})
export class SurgeryBookingModule {}
