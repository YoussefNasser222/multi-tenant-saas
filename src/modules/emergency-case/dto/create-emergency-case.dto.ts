import { IsEgyptianPhone } from '@common/validator';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmergencyCaseDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
