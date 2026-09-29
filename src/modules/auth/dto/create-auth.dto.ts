import { IsEgyptianNationalId, IsEgyptianPhone, IsAtLeastFourWords } from '@common/validator';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';


export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianNationalId()
  nationalId: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(128)
  password: string;
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @IsString()
  @IsNotEmpty()
  lastName: string;
  @IsEmail()
  email: string;
  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @IsEgyptianNationalId()
  nationalId: string;

  @IsOptional()
  @IsString()
  @IsAtLeastFourWords({ message: 'الاسم يجب أن يتكون من 4 كلمات على الأقل' })
  fullName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEgyptianPhone()
  phoneNumber: string;

  @IsEmail()
  email: string;
}

// اللوجن بيتحقق من الشكل بس (string + طول معقول): ده كفاية لمنع NoSQL injection،
// ومش بنطبّق خوارزمية الرقم القومي هنا عشان حسابات قديمة (زي الأدمن) متتقفلش.
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nationalId: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(128)
  newPassword: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// عشان نقفل ثغرة NoSQL Injection في /auth/refresh-token
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken: string;
}

// عشان نقفل ثغرة NoSQL Injection في /auth/send-otp
export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}