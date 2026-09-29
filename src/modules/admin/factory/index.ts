import { Injectable } from '@nestjs/common';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminFactoryService {
  /** Partial update (الحقول اللي اتبعتت بس) */
  async update(_user: any, dto: UpdateAdminDto) {
    const update: Record<string, any> = {};
    if (dto.firstName) update.firstName = dto.firstName;
    if (dto.lastName) update.lastName = dto.lastName;
    if (dto.userName) update.userName = dto.userName;
    if (dto.email) update.email = dto.email;
    if (dto.phoneNumber) update.phoneNumber = dto.phoneNumber;
    if (dto.password) update.password = await bcrypt.hash(dto.password, 10);
    return update;
  }
}
