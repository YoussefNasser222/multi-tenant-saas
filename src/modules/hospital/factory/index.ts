import { UpdateHospitalDto } from '@modules/auth/dto/update-hospital.dto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HospitalFactoryService {
  /**
   * Partial update: بنرجّع الحقول اللي اتبعتت بس.
   * قبل كده كان بيرجّع hospital كامل فيه password/otp/isPaid مأخوذين من كاش الـ AuthGuard
   * (ممكن يكونوا قديمين لحد 30 ثانية) فكان ممكن يرجّع باسورد قديم بعد reset مثلًا.
   * ومكانش ممكن الـ nationalId أو الاشتراك يتغيّروا من هنا، وده لسه ثابت.
   */
  async updateHospital(dto: UpdateHospitalDto, _user: any) {
    const update: Record<string, any> = {};
    if (dto.email) update.email = dto.email;
    if (dto.hospitalName) update.hospitalName = dto.hospitalName;
    if (dto.phoneNumber) update.phoneNumber = dto.phoneNumber;
    if (dto.governorate) update.governorate = dto.governorate;
    if (dto.city) update.city = dto.city;
    if (dto.address) update.address = dto.address;
    if (dto.password) update.password = await bcrypt.hash(dto.password, 10);
    return update;
  }
}
