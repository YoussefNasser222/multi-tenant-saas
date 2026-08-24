import { AudienceType, Role } from '@models/index';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateGeneralNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  message: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEnum(AudienceType)
  audience: AudienceType;
}
