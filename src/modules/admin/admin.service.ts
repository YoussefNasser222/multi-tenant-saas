import {
  AdminRepository,
  ClinicRepository,
  DoctorRepository,
  HospitalRepository,
  PatientRepository,
} from '@models/index';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Admin } from './entities/admin.entity';
import { addMonths } from 'date-fns';
import { ActiveAccountDto, ActiveHospitalDto } from './dto/create-admin.dto';
@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly patientRepo: PatientRepository,
    private readonly clinicRepo: ClinicRepository,
    private readonly hospitalRepo: HospitalRepository,
  ) {}
  async dashBoard() {
    const totalDoctor = await this.doctorRepo.count();
    const activeDoctors = await this.doctorRepo.count({
      isPaid: true,
      paidExpired: { $gte: new Date() },
    });
    const expiredSubscriptions = await this.doctorRepo.count({
      paidExpired: { $lt: new Date() },
    });
    const totalPatients = await this.patientRepo.count();
    const totalClinics = await this.clinicRepo.count();
    return {
      totalDoctor,
      activeDoctors,
      expiredSubscriptions,
      totalPatients,
      totalClinics,
    };
  }
  async updateAdmin(user: any, admin: Admin) {
    const adminExist = await this.adminRepo.getOne({ _id: user._id });
    if (!adminExist) {
      throw new NotFoundException('admin not found');
    }
    const updatedAdmin = await this.adminRepo.update({ _id: user._id }, admin, {
      returnDocument: 'after',
    });
    if (!updatedAdmin) {
      throw new NotFoundException('admin not found');
    }
    const { password, otp, otpExpired, ...rest } = updatedAdmin.toObject();
    return rest;
  }
  async getAdmin(user: any) {
    const admin = await this.adminRepo.getOne({ _id: user._id });
    if (!admin) {
      throw new NotFoundException('admin not found');
    }
    const { password, otp, otpExpired, ...rest } = admin.toObject();
    return rest;
  }
  async getDoctors() {
    const doctors = await this.doctorRepo.getAll(
      {},
      {},
      { select: '-password' },
    );
    if (!doctors || doctors.length === 0) {
      return [];
    }
    return doctors;
  }
  async getDoctor(user: any, id: string) {
    const doctor = await this.doctorRepo.getOne(
      { _id: id },
      {},
      { populate: { path: 'clinicId' }, select: '-password' },
    );
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    return doctor;
  }
  async getClinics() {
    const clinics = await this.clinicRepo.getAll();
    if (!clinics || clinics.length === 0) {
      return [];
    }
    return clinics;
  }
  async getClinic(user: any, id: string) {
    const clinic = await this.clinicRepo.getOne(
      { _id: id },
      {},
      { populate: { path: 'doctorId', select: '-password' } },
    );
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    return clinic;
  }
  async activeDoctor(id: string, activeAccountDto: ActiveAccountDto) {
    const doctor = await this.doctorRepo.getOne({ _id: id });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    const startDate =
      doctor.paidExpired && doctor.paidExpired > new Date()
        ? doctor.paidExpired
        : new Date();
    return await this.doctorRepo.update(
      { _id: id },
      {
        isPaid: true,
        paidExpired: addMonths(startDate, activeAccountDto.monthNumber),
      },
      {
        returnDocument: 'after',
        populate: { path: 'clinicId' },
        select: '-password',
      },
    );
  }
   async activeHospital(id: string, activeHospitalDto: ActiveHospitalDto) {
    const hospital = await this.hospitalRepo.getOne({ _id: id });
    if (!hospital) {
      throw new NotFoundException('hospital not found');
    }
    const startDate =
      hospital.paidExpired && hospital.paidExpired > new Date()
        ? hospital.paidExpired
        : new Date();
    return await this.hospitalRepo.update(
      { _id: id },
      {
        isPaid: true,
        paidExpired: addMonths(startDate, activeHospitalDto.monthNumber),
      },
      {
        returnDocument: 'after',
        select: '-password -otp -otpExpired',
      },
    );
  }
  async deleteDoctor(id: string) {
    const doctor = await this.doctorRepo.deleteOne({ _id: id });
    await this.clinicRepo.deleteOne({ doctorId: id });
    if (doctor.deletedCount === 0) {
      throw new NotFoundException('doctor not found');
    }
    return doctor;
  }
  async deletePatient(id: string) {
    const patient = await this.patientRepo.deleteOne({ _id: id });
    if (patient.deletedCount === 0) {
      throw new NotFoundException('patient not found');
    }
    return patient;
  }
  async getHospitals() {
    const hospitals = await this.hospitalRepo.getAll(
      {},
      {},
      { select: '-password -otp -otpExpired' },
    );
    if (!hospitals || hospitals.length === 0) {
      return [];
    }
    return hospitals;
  }
  async getHospitalById(id: string) {
    const hospital = await this.hospitalRepo.getOne(
      { _id: id },
      {},
      { select: '-password -otp -otpExpired' },
    );
    if (!hospital) {
      throw new NotFoundException('hospital not found');
    }
    return hospital;
  }
}
