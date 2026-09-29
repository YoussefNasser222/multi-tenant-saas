import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserMongoModule } from '@shared/user-mongo.module';
import { JwtService } from '@nestjs/jwt';
import { DoctorModule } from '../doctor/doctor.module';
import { AdminFactoryService } from './factory';
import { UploadModule } from '@common/upload';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Appointment,
  appointmentSchema,
  AppointmentRepository,
  Token,
  tokenSchema,
  TokenRepository,
} from '@models/index';

@Module({
  imports: [
    UserMongoModule,
    DoctorModule,
    UploadModule,
    // AuthModule/AppointmentModule ما استوردتهومش هنا عشان نتجنب أي circular
    // dependency، فسجّلنا نفس الـ schemas هنا وبس عشان AdminService يقدر يستخدم
    // TokenRepository (cascade logout عند حذف/تفعيل حساب) و AppointmentRepository
    // (dashboard). ده نفس pattern الموجود بالفعل في باقي الموديولز.
    MongooseModule.forFeature([
      { name: Token.name, schema: tokenSchema },
      { name: Appointment.name, schema: appointmentSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtService,
    AdminFactoryService,
    TokenRepository,
    AppointmentRepository,
  ],
})
export class AdminModule {}
