import { IsEgyptianPhone } from '@common/validator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmergencyCaseDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;
  @IsOptional()
  @IsString()
  notes?: string;
}
