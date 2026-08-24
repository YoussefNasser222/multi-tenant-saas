import { Role } from '@models/index';
import { IsNumber, Min } from 'class-validator';

export class CreateAdminDto {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  role: Role;
}

export class ActiveAccountDto {
  @IsNumber()
  @Min(1)
  monthNumber: number;
}

export class ActiveHospitalDto {
  @IsNumber()
  @Min(1)
  monthNumber: number;
}
