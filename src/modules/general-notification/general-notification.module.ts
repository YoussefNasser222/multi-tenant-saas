import { Module } from '@nestjs/common';
import { GeneralNotificationService } from './general-notification.service';
import { GeneralNotificationController } from './general-notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GeneralNotification,
  GeneralNotificationRepository,
  GeneralNotificationSchema,
} from '@models/index';
import { UserMongoModule } from '@shared/user-mongo.module';
import { GeneralNotificationFactory } from './factory';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneralNotification.name, schema: GeneralNotificationSchema },
    ]),
    UserMongoModule,
  ],
  controllers: [GeneralNotificationController],
  providers: [
    GeneralNotificationService,
    GeneralNotificationRepository,
    GeneralNotificationFactory,
    JwtService,
  ],
  exports: [
    GeneralNotificationService,
    GeneralNotificationRepository,
    GeneralNotificationFactory,
    JwtService,
  ],
})
export class GeneralNotificationModule {}
