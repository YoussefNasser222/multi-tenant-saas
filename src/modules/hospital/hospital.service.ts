import { HospitalRepository } from '@models/index';
import { Hospital } from '@modules/auth/entities/auth.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class HospitalService {
  constructor(private readonly hospitalRepo: HospitalRepository) {}

  async update(user: any, hospital: Hospital) {
    const updatedHospital = await this.hospitalRepo.update(
      { _id: user._id },
      hospital,
      { returnDocument: 'after' },
    );
    if(!updatedHospital){
      throw new NotFoundException('hospital not found')
    }
    const { password, otp, otpExpired, ...other } = updatedHospital.toObject();
    return other;
  }
  
  async findOne(user: any) {
    const hospital = await this.hospitalRepo.getOne({ _id: user._id });
    if (!hospital) {
      throw new NotFoundException('hospital not found');
    }
    const { password, otp, otpExpired, ...other } = hospital.toObject();
    return other;
  }
}
