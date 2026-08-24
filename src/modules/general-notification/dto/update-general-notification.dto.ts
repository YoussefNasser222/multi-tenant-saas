import { PartialType } from '@nestjs/mapped-types';
import { CreateGeneralNotificationDto } from './create-general-notification.dto';

export class UpdateGeneralNotificationDto extends PartialType(CreateGeneralNotificationDto) {}
