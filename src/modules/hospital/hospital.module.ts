import { Module } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { UserMongoModule } from '@shared/user-mongo.module';
import { JwtService } from '@nestjs/jwt';
import { HospitalFactoryService } from './factory';

@Module({
  imports : [
    UserMongoModule
  ],
  controllers: [HospitalController],
  providers: [HospitalService , JwtService , HospitalFactoryService],
})
export class HospitalModule {}
