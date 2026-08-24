import { Injectable } from '@nestjs/common';
import { CreateGeneralNotificationDto } from '../dto/create-general-notification.dto';
import { GeneralNotification } from '../entities/general-notification.entity';
import { AudienceType } from '@models/index';

@Injectable()
export class GeneralNotificationFactory {
  createByDoctor(dto: CreateGeneralNotificationDto, user: any) {
    const generalNotification = new GeneralNotification();
    generalNotification.title = dto.title;
    generalNotification.message = dto.message;
    generalNotification.createdBy = user._id;
    generalNotification.createdByRole = user.role;
    generalNotification.audience = AudienceType.Patient;
    return generalNotification;
  }
   createByAdmin(dto: CreateGeneralNotificationDto, user: any) {
    const generalNotification = new GeneralNotification();
    generalNotification.title = dto.title;
    generalNotification.message = dto.message;
    generalNotification.createdBy = user._id;
    generalNotification.createdByRole = user.role;
    generalNotification.audience = dto.audience || AudienceType.all;
    return generalNotification;
  }
}
