import { Body, Controller, Get, Put } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { Paid, User } from '@common/decorators';
import { UpdateHospitalDto } from '@modules/auth/dto/update-hospital.dto';
import { HospitalFactoryService } from './factory';

@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService,
    private readonly hospitalFactoryService : HospitalFactoryService
  ) {}
  @Put()
  @Paid(['Hospital'])
  async update(@Body() dto: UpdateHospitalDto , @User() user: any){
    const hospital = await this.hospitalFactoryService.updateHospital(dto , user)
    const updatedHospital = await this.hospitalService.update(user , hospital)
    return {
      message :  "hospital updated successfully",
      success : true,
      data : {updatedHospital}
    }
  }
  @Get()
  @Paid(['Hospital']) 
  async get(@User() user: any){
    const hospital = await this.hospitalService.findOne(user);
    return {
      message :  "hospital fetched successfully",
      success : true,
      data : {hospital}
    }
  }
}
