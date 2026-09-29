import { HospitalRepository } from '@models/index';
import { stripSensitive } from '@common/constants';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class HospitalService {
  constructor(private readonly hospitalRepo: HospitalRepository) {}

  async update(user: any, hospital: Record<string, any>) {
    const updatedHospital = await this.hospitalRepo.update(
      { _id: user._id },
      hospital,
      { returnDocument: 'after' },
    );
    if(!updatedHospital){
      throw new NotFoundException('hospital not found')
    }
    return stripSensitive(updatedHospital.toObject());
  }
  
  async findOne(user: any) {
    const hospital = await this.hospitalRepo.getOne({ _id: user._id });
    if (!hospital) {
      throw new NotFoundException('hospital not found');
    }
    return stripSensitive(hospital.toObject());
  }
}
