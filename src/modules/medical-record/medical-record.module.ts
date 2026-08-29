import { Module } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { MedicalRecordController } from './medical-record.controller';
import { UserMongoModule } from '@shared/user-mongo.module';
import { JwtService } from '@nestjs/jwt';
import { UploadModule } from '@common/upload';
import { PrescriptionExtractorService } from './prescription-extractor.service';
import { AppointmentModule } from '@modules/appointment/appointment.module';
import { MedicalRecordFactoryService } from './factory';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MedicalRecord,
  MedicalRecordRepository,
  medicalRecordSchema,
  PatientDocument,
  PatientDocumentRepository,
  patientDocumentSchema,
} from '@models/index';

@Module({
  imports: [
    UserMongoModule,
    UploadModule,
    AppointmentModule,
    MongooseModule.forFeature([
      { name: MedicalRecord.name, schema: medicalRecordSchema },
      { name: PatientDocument.name, schema: patientDocumentSchema },
    ]),
  ],
  controllers: [MedicalRecordController],
  providers: [
    MedicalRecordService,
    JwtService,
    PrescriptionExtractorService,
    MedicalRecordFactoryService,
    MedicalRecordRepository,
    PatientDocumentRepository,
  ],
})
export class MedicalRecordModule {}

