import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationRepository } from '@models/index';
import { UpdateNotificationDto } from '../dto/update-notification.dto';

@Injectable()
export class NotificationFactoryService {
  constructor(private readonly notificationRepo: NotificationRepository) {}
  create(dto: CreateNotificationDto, user: any) {
    const notification = new Notification();
    notification.doctorId = user._id;
    notification.patientId = Types.ObjectId.isValid(dto.patientId as any)
      ? new Types.ObjectId(dto.patientId as any)
      : dto.patientId;
    notification.message = dto.message;
    notification.title = dto.title;
    notification.isRead = false;
    return notification;
  }
  async update(dto: UpdateNotificationDto, id: string, user: any) {
    const old = await this.notificationRepo.getOne({
      _id: id,
      doctorId: user._id,
    });
    if (!old) {
      throw new NotFoundException('notification not found');
    }
    const notification = new Notification();
    notification.doctorId = old.doctorId;
    notification.patientId = old.patientId;
    notification.message = dto.message || old.message;
    notification.title = dto.title || old.title;
    notification.isRead = false;
    return notification;
  }
}
