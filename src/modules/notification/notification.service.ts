import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { AppointmentRepository, NotificationRepository } from '@models/index';

@Injectable()
export class NotificationService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}
  async create(notification: Notification, user: any) {
    return await this.notificationRepo.create(notification);
  }
  async update(notification: Notification, id: string) {
    return await this.notificationRepo.update({ _id: id }, notification, {
      returnDocument: 'after',
    });
  }
  async getNotificationById(id: string, user: any) {
    const notification = await this.notificationRepo.getOne({
      _id: id,
      doctorId: user._id,
    });
    if (!notification) {
      throw new NotFoundException('notification not found');
    }
    return notification;
  }
  async getAllNotificationForDoctor(user: any) {
    const notifications = await this.notificationRepo.getAll({
      doctorId: user._id,
    });
    if (!notifications || notifications.length == 0) {
      return [];
    }
    return notifications;
  }
  async deleteNotification(id: string, user: any) {
    const notification = await this.notificationRepo.getOne({
      _id: id,
      doctorId: user._id,
    });
    if (!notification) {
      throw new NotFoundException('notification not found');
    }
    return await this.notificationRepo.deleteOne({ _id: id });
  }
  async deleteAllNotifications(user: any) {
    return await this.notificationRepo.deleteMany({ doctorId: user._id });
  }
  async getPatientNotificationById(id: string, user: any) {
    const notification = await this.notificationRepo.getOne(
      {
        _id: id,
        patientId: user._id,
      },
      {},
      { populate: { path: 'doctorId', select: 'firstName lastName' } },
    );
    if (!notification) {
      throw new NotFoundException('notification not found');
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  }
  async getAllPatientNotification(user: any) {
    const pId = user._id;
    const notifications = await this.notificationRepo.getAll(
      {
        $or: [
          { patientId: pId },
          { patientId: pId ? pId.toString() : '' },
        ],
      },
      {},
      { populate: { path: 'doctorId', select: 'firstName lastName' } },
    );
    if (!notifications || notifications.length == 0) {
      return [];
    }
    return notifications;
  }
  async deletePatientNotification(id: string, user: any) {
    const notification = await this.notificationRepo.getOne({
      _id: id,
      patientId: user._id,
    });
    if (!notification) {
      throw new NotFoundException('notification not found');
    }
    return await this.notificationRepo.deleteOne({ _id: id });
  }
  async deleteAllPatientNotifications(user: any) {
    const notifications = await this.notificationRepo.deleteMany({
      patientId: user._id,
    });
    if (notifications.deletedCount == 0) {
      throw new NotFoundException('notification is Empty');
    }
    return notifications;
  }
}
