import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsEgyptianPhone } from '@common/validator';

/**
 * قبل كده كان بيوسّع CreateAdminDto (مفيهوش أي validators) فمع الـ whitelist
 * كل الحقول كانت بتتشال ومكانش فيه أي تعديل بيتحفظ.
 */
export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  userName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEgyptianPhone()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(128)
  password?: string;
}
