import { Module } from '@nestjs/common';
import { EmergencyCaseService } from './emergency-case.service';
import { EmergencyCaseController } from './emergency-case.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmergencyCase,
  EmergencyCaseRepository,
  emergencyCaseSchema,
} from '@models/index';
import { JwtService } from '@nestjs/jwt';
import { UserMongoModule } from '@shared/user-mongo.module';
import { EmergencyCaseFactory } from './factory';
import { UploadModule } from '@common/upload';
import { GeneralNotificationModule } from '@modules/general-notification/general-notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyCase.name, schema: emergencyCaseSchema },
    ]),
    UserMongoModule,
    UploadModule,
    GeneralNotificationModule
  ],
  controllers: [EmergencyCaseController],
  providers: [EmergencyCaseService, EmergencyCaseRepository, JwtService , EmergencyCaseFactory],
})
export class EmergencyCaseModule {}
