import { UpdateHospitalDto } from '@modules/auth/dto/update-hospital.dto';
import { Hospital } from '@modules/auth/entities/auth.entity';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Injectable()
export class HospitalFactoryService {
  constructor() {}
  async updateHospital(dto: UpdateHospitalDto, user: any) {
    const hospital = new Hospital();
    hospital.nationalId = user.nationalId;
    hospital.email = dto.email || user.email;
    const newPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : user.password;
    hospital.password = newPassword;
    hospital.hospitalName = dto.hospitalName || user.hospitalName;
    hospital.phoneNumber = dto.phoneNumber || user.phoneNumber;
    hospital.governorate = dto.governorate || user.governorate;
    hospital.city = dto.city || user.city;
    hospital.address = dto.address || user.address;
    hospital.isPaid = user.isPaid;
    hospital.paidExpired = user.paidExpired;
    hospital.otp = user.otp;
    hospital.otpExpired = user.otpExpired;
    return hospital;
  }
}
