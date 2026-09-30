import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Consultation,
  consultationSchema,
  ConsultationRepository,
  Notification,
  notificationSchema,
  NotificationRepository,
} from '@models/index';
import { UploadModule } from '@common/upload';
import { UserMongoModule } from '@shared/user-mongo.module';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { ConsultationAnalyzerService } from './consultation-analyzer.service';

@Module({
  imports: [
    UserMongoModule, // PatientRepository, DoctorRepository (لعمل fan-out للإشعارات)
    UploadModule,
    MongooseModule.forFeature([
      { name: Consultation.name, schema: consultationSchema },
      { name: Notification.name, schema: notificationSchema },
    ]),
  ],
  controllers: [ConsultationController],
  providers: [
    ConsultationService,
    ConsultationAnalyzerService,
    ConsultationRepository,
    NotificationRepository,
    // مطلوب لـ AuthGuard (بيتستخدم جوه @Auth/@Paid على الـ controller) — نفس
    // الـ pattern الموجود في كل موديول تاني بيستخدم الـ guards دي.
    JwtService,
  ],
})
export class ConsultationModule {}
