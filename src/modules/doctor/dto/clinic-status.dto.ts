import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateClinicStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class ClinicDateDto {
  @IsString()
  @IsNotEmpty()
  date: string;
}