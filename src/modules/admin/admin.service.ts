import {
  AdminRepository,
  AppointmentRepository,
  ClinicRepository,
  DoctorRepository,
  HospitalRepository,
  PatientRepository,
  TokenRepository,
  UserRepository,
} from '@models/index';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { addMonths } from 'date-fns';
import * as bcrypt from 'bcrypt';
import {
  ActiveAccountDto,
  ActiveHospitalDto,
  CreateDoctorByAdminDto,
} from './dto/create-admin.dto';
import { AuthGuard } from '@common/guards';
import {
  DEFAULT_LIST_LIMIT,
  SENSITIVE_SELECT,
  stripSensitive,
} from '@common/constants';
@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly patientRepo: PatientRepository,
    private readonly clinicRepo: ClinicRepository,
    private readonly hospitalRepo: HospitalRepository,
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: TokenRepository,
    private readonly appointmentRepo: AppointmentRepository,
  ) {}
  async dashBoard() {
    const now = new Date();
    // الـ 5 عدّادات دي مستقلة عن بعض → بتتنفذ بالتوازي بدل ما تستنى بعض
    const [totalDoctor, activeDoctors, expiredSubscriptions, totalPatients, totalClinics] =
      await Promise.all([
        this.doctorRepo.count(),
        this.doctorRepo.count({ isPaid: true, paidExpired: { $gte: now } }),
        this.doctorRepo.count({ paidExpired: { $lt: now } }),
        this.patientRepo.count(),
        this.clinicRepo.count(),
      ]);
    return {
      totalDoctor,
      activeDoctors,
      expiredSubscriptions,
      totalPatients,
      totalClinics,
    };
  }
  async updateAdmin(user: any, update: Record<string, any>) {
    const updatedAdmin = await this.adminRepo.update({ _id: user._id }, update, {
      returnDocument: 'after',
      select: SENSITIVE_SELECT,
    });
    if (!updatedAdmin) {
      throw new NotFoundException('admin not found');
    }
    AuthGuard.invalidate(user._id);
    return updatedAdmin.toObject();
  }
  async getAdmin(user: any) {
    const admin = await this.adminRepo.getOne({ _id: user._id });
    if (!admin) {
      throw new NotFoundException('admin not found');
    }
    return stripSensitive(admin.toObject());
  }
  async getDoctors() {
    const doctors = await this.doctorRepo.getAll(
      {},
      {},
      { select: SENSITIVE_SELECT, sort: { createdAt: -1 }, limit: DEFAULT_LIST_LIMIT },
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
      { populate: { path: 'clinicId' }, select: SENSITIVE_SELECT },
    );
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    return doctor;
  }
  async getClinics() {
    const clinics = await this.clinicRepo.getAll({}, {}, { sort: { createdAt: -1 }, limit: DEFAULT_LIST_LIMIT });
    if (!clinics || clinics.length === 0) {
      return [];
    }
    return clinics;
  }
  async getClinic(user: any, id: string) {
    const clinic = await this.clinicRepo.getOne(
      { _id: id },
      {},
      { populate: { path: 'doctorId', select: SENSITIVE_SELECT } },
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
    const updated = await this.doctorRepo.update(
      { _id: id },
      {
        isPaid: true,
        paidExpired: addMonths(startDate, activeAccountDto.monthNumber),
      },
      {
        returnDocument: 'after',
        populate: { path: 'clinicId' },
        select: SENSITIVE_SELECT,
      },
    );
    AuthGuard.invalidate(id);
    return updated;
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
    const updated = await this.hospitalRepo.update(
      { _id: id },
      {
        isPaid: true,
        paidExpired: addMonths(startDate, activeHospitalDto.monthNumber),
      },
      {
        returnDocument: 'after',
        select: SENSITIVE_SELECT,
      },
    );
    AuthGuard.invalidate(id);
    return updated;
  }
  async deleteDoctor(id: string) {
    const doctor = await this.doctorRepo.deleteOne({ _id: id });
    if (doctor.deletedCount === 0) {
      throw new NotFoundException('doctor not found');
    }
    await this.clinicRepo.deleteOne({ doctorId: id });
    await this.tokenRepo.deleteMany({ userId: id });
    AuthGuard.invalidate(id);
    return doctor;
  }
  async deletePatient(id: string) {
    const patient = await this.patientRepo.deleteOne({ _id: id });
    if (patient.deletedCount === 0) {
      throw new NotFoundException('patient not found');
    }
    await this.tokenRepo.deleteMany({ userId: id });
    AuthGuard.invalidate(id);
    return patient;
  }
  async deleteHospital(id: string) {
    const hospital = await this.hospitalRepo.deleteOne({ _id: id });
    if (hospital.deletedCount === 0) {
      throw new NotFoundException('hospital not found');
    }
    await this.tokenRepo.deleteMany({ userId: id });
    AuthGuard.invalidate(id);
    return hospital;
  }
  async getPatients() {
    const patients = await this.patientRepo.getAll(
      {},
      {},
      { select: SENSITIVE_SELECT, sort: { createdAt: -1 }, limit: DEFAULT_LIST_LIMIT },
    );
    if (!patients || patients.length === 0) {
      return [];
    }
    return patients;
  }
  async getHospitals() {
    const hospitals = await this.hospitalRepo.getAll(
      {},
      {},
      { select: SENSITIVE_SELECT, sort: { createdAt: -1 }, limit: DEFAULT_LIST_LIMIT },
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
      { select: SENSITIVE_SELECT },
    );
    if (!hospital) {
      throw new NotFoundException('hospital not found');
    }
    return hospital;
  }

  /** POST /admin/doctors — إنشاء دكتور يدويًا من الأدمن (الفرونت كان بيستدعيه من غير route في الباك) */
  async createDoctor(dto: CreateDoctorByAdminDto) {
    const exists = await this.userRepo.getOne({ nationalId: dto.nationalId });
    if (exists) {
      throw new ConflictException('doctor already exist');
    }
    const paid = dto.subscriptionStatus === 'paid';
    const created = await this.doctorRepo.create({
      nationalId: dto.nationalId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      password: await bcrypt.hash(dto.password, 10),
      isPaid: paid,
      paidExpired: paid ? addMonths(new Date(), dto.monthNumber ?? 1) : new Date(),
      otp: '',
      otpExpired: new Date(),
    } as any);
    return stripSensitive(created.toObject());
  }
}
