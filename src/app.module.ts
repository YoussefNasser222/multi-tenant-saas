import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import devConfig from '@config/env/dev.config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UploadModule } from './common/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClinicModule } from './modules/clinic/clinic.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { EmergencyCaseModule } from './modules/emergency-case/emergency-case.module';
import { GeneralNotificationModule } from './modules/general-notification/general-notification.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PatientModule } from './modules/patient/patient.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [devConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get('DB_URL'),
        };
      },
    }),
    AuthModule,
    DoctorModule,
    AdminModule,
    AppointmentModule,
    PatientModule,
    UploadModule,
    MedicalRecordModule,
    NotificationModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ClinicModule,
    HospitalModule,
    GeneralNotificationModule,
    EmergencyCaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
