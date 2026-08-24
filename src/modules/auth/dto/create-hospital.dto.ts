import { IsEgyptianNationalId, IsEgyptianPhone } from '@common/validator';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateHospitalDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianNationalId()
  nationalId: string;
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
  @IsString()
  @IsNotEmpty()
  hospitalName: string;
  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;
  @IsString()
  @IsNotEmpty()
  address: string;
  @IsString()
  @IsNotEmpty()
  governorate: string;
  @IsString()
  @IsNotEmpty()
  city: string;
}