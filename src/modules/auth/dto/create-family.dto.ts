import { IsEgyptianNationalId, IsEgyptianPhone } from '@common/validator';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;
}

export class CreateFamilyPatientDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianNationalId()
  nationalId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers: FamilyMemberDto[];
}
