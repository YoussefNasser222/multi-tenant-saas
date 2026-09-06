import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Auth, Paid, User } from '@common/decorators';
import { NotificationFactoryService } from './factory';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationFactoryService: NotificationFactoryService,
  ) {}

  @Post()
  @Paid(['Doctor'])
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @User() user: any,
  ) {
    const notification = this.notificationFactoryService.create(
      createNotificationDto,
      user,
    );
    const createdNotification = await this.notificationService.create(
      notification,
      user,
    );
    return {
      message: 'notification created successfully',
      success: true,
      data: { createdNotification },
    };
  }
  @Put(':id')
  @Paid(['Doctor'])
  async update(
    @Body() dto: UpdateNotificationDto,
    @Param('id') id: string,
    @User() user: any,
  ) {
    const notification = await this.notificationFactoryService.update(
      dto,
      id,
      user,
    );
    const updatedNotification = await this.notificationService.update(
      notification,
      id,
    );
    return {
      message: 'notification updated successfully',
      success: true,
      data: { updatedNotification },
    };
  }
  @Get('patient')
  @Auth(['Patient'])
  async getAllPatientNotification(@User() user: any) {
    const notification =
      await this.notificationService.getAllPatientNotification(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { notification, notifications: notification },
    };
  }
  @Get()
  @Paid(['Doctor'])
  async getAllNotificationForDoctor(@User() user: any) {
    const notifications =
      await this.notificationService.getAllNotificationForDoctor(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { notifications },
    };
  }
  @Get('patient/:id')
  @Auth(['Patient'])
  async getPatientNotificationById(@Param('id') id: string, @User() user: any) {
    const notification =
      await this.notificationService.getPatientNotificationById(id, user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { notification },
    };
  }
  @Get(':id')
  @Paid(['Doctor'])
  async getNotificationById(@Param('id') id: string, @User() user: any) {
    const notification = await this.notificationService.getNotificationById(
      id,
      user,
    );
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { notification },
    };
  }
  @Delete('patient')
  @Auth(['Patient'])
  async deleteAllPatientNotifications(@User() user: any) {
    await this.notificationService.deleteAllPatientNotifications(user);
    return {
      message: 'notifications deleted successfully',
      success: true,
    };
  }
  @Delete('patient/:id')
  @Auth(['Patient'])
  async deletePatientNotification(@Param('id') id: string, @User() user: any) {
    await this.notificationService.deletePatientNotification(id, user);
    return {
      message: 'notification deleted successfully',
      success: true,
    };
  }
  
  @Delete()
  @Paid(['Doctor'])
  async deleteAllNotifications(@User() user: any) {
    const deletedNotification =
      await this.notificationService.deleteAllNotifications(user);
    if (deletedNotification.deletedCount == 0) {
      throw new NotFoundException('notification is Empty');
    }
    return {
      message: 'notifications deleted successfully',
      success: true,
    };
  }
  @Delete(':id')
  @Paid(['Doctor'])
  async deleteNotification(@Param('id') id: string, @User() user: any) {
    await this.notificationService.deleteNotification(id, user);
    return {
      message: 'notification deleted successfully',
      success: true,
    };
  }
}
