import { Role } from '@models/index';
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CreateDoctorDto } from '@modules/auth/dto/create-auth.dto';

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
  @Max(120)
  monthNumber: number;
}

export class ActiveHospitalDto {
  @IsNumber()
  @Min(1)
  @Max(120)
  monthNumber: number;
}

/** الأدمن بيضيف دكتور يدويًا (كان الفرونت بيستدعي POST /admin/doctors والباك مكانش فيه الـ route ده → 404) */
export class CreateDoctorByAdminDto extends CreateDoctorDto {
  /** paid = يتفعّل اشتراكه فورًا | unpaid (الافتراضي) = محتاج تفعيل بعدين */
  @IsOptional()
  @IsIn(['paid', 'unpaid'])
  subscriptionStatus?: 'paid' | 'unpaid';

  /** مدة الاشتراك بالشهور لو paid (الافتراضي شهر) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  monthNumber?: number;
}
