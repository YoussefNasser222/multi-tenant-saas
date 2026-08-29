import { VisitType } from '@models/index';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinDate,
} from 'class-validator';
import { Types } from 'mongoose';

const today = new Date();
today.setHours(0, 0, 0, 0);
export class CreateAppointmentPatientDto {
  @IsMongoId()
  doctorId: Types.ObjectId;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(today, { message: 'Date must be in the future' })
  date: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g. 14:30)',
  })
  startTime?: string;
  @IsOptional()
  @IsEnum(VisitType)
  visitingType?: VisitType;
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class CreateAppointmentDoctorDto {
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(today, { message: 'Date must be in the future' })
  date: Date;

  @IsString()
  @IsOptional()
  notes?: string;
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g. 14:30)',
  })
  startTime?: string;
  @IsOptional()
  @IsEnum(VisitType)
  visitingType?: VisitType;
}
