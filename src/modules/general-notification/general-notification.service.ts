import { AudienceType, GeneralNotificationRepository } from '@models/index';
import { Injectable } from '@nestjs/common';
import { GeneralNotification } from './entities/general-notification.entity';

@Injectable()
export class GeneralNotificationService {
  constructor(
    private readonly generalNotificationRepo: GeneralNotificationRepository,
  ) {}
  async create(generalNotification: GeneralNotification) {
    return await this.generalNotificationRepo.create(generalNotification);
  }
async getForCurrentUser(user: any) {
  const notifications = await this.generalNotificationRepo.getAll({
    $or: [
      { audience: { $in: [AudienceType.all, user.role] } },
      { createdBy: user._id },
    ],
  });
  return notifications || [];
}
}
