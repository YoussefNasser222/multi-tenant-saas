import { UpdatedPatientDto, UpdatePatientByDoctorDto } from '@modules/auth/dto/update-auth.dto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/** بنبني object فيه الحقول اللي اتبعتت بس (partial update) بدل ما نكتب فوق حقول تانية بقيم قديمة/undefined. */
function pickDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out as Partial<T>;
}

@Injectable()
export class PatientFactoryService {
  /** المريض بيعدّل نفسه (الاسم / التليفون / الإيميل / الباسورد) */
  async update(_user: any, dto: UpdatedPatientDto) {
    return pickDefined({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      // كان بيتتجاهل بصمت (الفرونت بيبعته والباك مكانش بيحفظه)
      phoneNumber: dto.phoneNumber,
      password: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
    });
  }

  /** الدكتور بيعدّل بيانات مريض: الاسم والتليفون بس */
  async updatePatientById(_id: string, dto: UpdatePatientByDoctorDto) {
    return pickDefined({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
    });
  }
}
