import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-auth.dto';

export class UpdatedDoctorDto extends PartialType(CreateDoctorDto) {}

/** المريض بيعدّل بياناته هو (ممكن يغيّر الباسورد بتاعه) */
export class UpdatedPatientDto extends PartialType(CreateDoctorDto) {}

/**
 * الدكتور بيعدّل بيانات مريض عنده: الاسم والتليفون بس.
 * ممنوع نهائيًا يغيّر الباسورد أو الإيميل (كان ده ثغرة استيلاء على حساب المريض).
 */
export class UpdatePatientByDoctorDto extends PartialType(
  PickType(CreateDoctorDto, ['firstName', 'lastName', 'phoneNumber'] as const),
) {}
