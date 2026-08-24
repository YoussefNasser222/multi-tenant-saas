import { Auth, Paid, User } from '@common/decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateGeneralNotificationDto } from './dto/create-general-notification.dto';
import { GeneralNotificationFactory } from './factory';
import { GeneralNotificationService } from './general-notification.service';

@Controller('general-notification')
export class GeneralNotificationController {
  constructor(private readonly generalNotificationService: GeneralNotificationService,
   
    private readonly generalNotificationFactory : GeneralNotificationFactory
  ) {}
  @Post('doctor')
  @Paid(['Doctor'])
async createByDoctor(@Body() dto : CreateGeneralNotificationDto , @User() user : any){
  const generalNotification = this.generalNotificationFactory.createByDoctor(dto , user)
  const created = await this.generalNotificationService.create(generalNotification)
  return {
    message : "general-notification created successfully",
    success : true,
    data : {created}
  }
}
  @Post('admin')
  @Auth(['Admin'])
async createByAdmin(@Body() dto : CreateGeneralNotificationDto , @User() user : any){
  const generalNotification = this.generalNotificationFactory.createByAdmin(dto , user)
  const created = await this.generalNotificationService.create(generalNotification)
  return {
    message : "general-notification created successfully",
    success : true,
    data : {created}
  }
}


@Get()
@Auth(['Admin', 'Doctor', 'Patient', 'Hospital'])
async getMyNotifications(@User() user: any) {
  const notifications = await this.generalNotificationService.getForCurrentUser(user);
  return { message: 'data retrieved successfully', success: true, data: { notifications } };
}
 
}
