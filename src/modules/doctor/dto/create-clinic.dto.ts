import { BookingType, VisitType } from '@models/index';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
  ValidateNested
} from 'class-validator';

export class WorkingDayDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  from: Date;
  @Transform(({ value }) => new Date(value))
  @IsDate()
  to: Date;
}

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @Length(11, 11)
  @IsOptional()
  phoneNumber: string;
  @IsString()
  @IsNotEmpty()
  street: string;
  @IsEmail()
  @IsOptional()
  email: string;
  @IsString()
  @IsNotEmpty()
  governorate: string;
  @IsString()
  @IsNotEmpty()
  city: string;
  @IsString()
  @IsNotEmpty()
  specialization: string;
  @IsNumber()
  @IsNotEmpty()
  consultationPrice: number;
  @IsOptional()
  @IsArray()
  @Type(() => WorkingDayDto)
  @ValidateNested({ each: true })
  workingDays?: WorkingDayDto[];
  @IsOptional()
  @IsString()
  address?: string;
  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ValidateIf((o) => o.bookingType === BookingType.TIME)
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPatientsPerDay?: number;
  @IsNumber()
  @IsOptional()
  @Min(0)
  followUpPrice?: number;
}

