import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateDoctorDto, CreatePatientDto } from '../dto/create-auth.dto';
import { Doctor, Hospital, Patient } from '../entities/auth.entity';
import { CreateHospitalDto } from '../dto/create-hospital.dto';
import { CreateFamilyPatientDto } from '../dto/create-family.dto';

@Injectable()
export class AuthFactoryService {
  async createDoctor(createDoctorDto: CreateDoctorDto) {
    const doctor = new Doctor();
    doctor.nationalId = createDoctorDto.nationalId;
    doctor.password = await bcrypt.hash(createDoctorDto.password, 10);
    doctor.email = createDoctorDto.email;
    doctor.firstName = createDoctorDto.firstName;
    doctor.lastName = createDoctorDto.lastName;
    doctor.phoneNumber = createDoctorDto.phoneNumber;
    doctor.isPaid = false;
    doctor.paidExpired = new Date();
    doctor.otp = '';
    doctor.otpExpired = new Date();
    return doctor;
  }

  /* مريض فردي — user اختياري (طبيب أو تسجيل عام) */
  async createPatient(createPatientDto: CreatePatientDto, user?: any) {
    const patient = new Patient();
    patient.nationalId = createPatientDto.nationalId;
    patient.password = await bcrypt.hash(createPatientDto.password, 10);
    patient.email = createPatientDto.email;
    patient.firstName = createPatientDto.firstName;
    patient.lastName = createPatientDto.lastName;
    patient.phoneNumber = createPatientDto.phoneNumber;
    patient.otp = '';
    patient.otpExpired = new Date();
    patient.createdBy = user?._id;
    patient.isFamily = false;
    patient.familyMembers = [];
    return patient;
  }

  /* تسجيل أسرة — رقم قومي واحد + أفراد */
  async createFamilyPatient(dto: CreateFamilyPatientDto) {
    const patient = new Patient();
    patient.nationalId = dto.nationalId;
    patient.password = await bcrypt.hash(dto.password, 10);
    patient.email = dto.email;
    patient.firstName = dto.familyMembers[0].name.split(' ')[0] ?? 'رب';
    patient.lastName = dto.familyMembers[0].name.split(' ').slice(1).join(' ') || 'الأسرة';
    patient.phoneNumber = dto.familyMembers[0].phoneNumber;
    patient.otp = '';
    patient.otpExpired = new Date();
    patient.isFamily = true;
    patient.familyMembers = dto.familyMembers;
    return patient;
  }

  async createHospital(dto: CreateHospitalDto) {
    const hospital = new Hospital();
    hospital.nationalId = dto.nationalId;
    hospital.email = dto.email;
    hospital.password = await bcrypt.hash(dto.password, 10);
    hospital.hospitalName = dto.hospitalName;
    hospital.phoneNumber = dto.phoneNumber;
    hospital.governorate = dto.governorate;
    hospital.city = dto.city;
    hospital.address = dto.address;
    hospital.isPaid = false;
    hospital.paidExpired = new Date();
    hospital.otp = '';
    hospital.otpExpired = new Date();
    return hospital;
  }
}

