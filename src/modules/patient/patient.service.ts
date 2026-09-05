import { AppointmentRepository, PatientRepository, Role } from '@models/index';
import { Patient } from '@modules/auth/entities/auth.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly appointmentRepo: AppointmentRepository,
  ) {}

  async getProfile(user: any) {
    const patient = await this.patientRepo.getOne({ _id: user._id });
    if (!patient) throw new NotFoundException('patient not found');
    const { password, otp, otpExpired, ...other } = patient.toObject();
    return other;
  }

  async getPatientByNationalId(id: string) {
    const patientExist = await this.patientRepo.getOne(
      {
        nationalId: id,
        role: Role.Patient,
      },
      { firstName: 1, lastName: 1, _id: 1 },
    );
    if (!patientExist) throw new NotFoundException('patient not found');
    return patientExist;
  }

  async getMyPatients(user: any) {
    const appointments = await this.appointmentRepo.getAll(
      { doctorId: user._id },
      {},
      { populate: { path: 'patientId', select: '-password -otp -otpExpired' } },
    );
    if (!appointments || appointments.length === 0) return [];
    const uniquePatientsMap = new Map();
    for (const appt of appointments) {
      const patient = appt.patientId as any;
      uniquePatientsMap.set(patient._id.toString(), patient);
    }
    return Array.from(uniquePatientsMap.values());
  }

  /* مرضى النظام غير المسجلين عند هذا الدكتور */
  async getNonClinicPatients(user: any, search?: string) {
    /* جمع patientId المسجلين عند الدكتور */
    const appointments = await this.appointmentRepo.getAll(
      { doctorId: user._id },
      { patientId: 1 },
    );
    const myPatientIds = appointments.map((a) =>
      (a.patientId as any).toString(),
    );

    /* بناء فلتر البحث */
    const filter: any = {
      role: Role.Patient,
      _id: { $nin: myPatientIds },
    };
    if (search?.trim()) {
      filter.$or = [
        { firstName: { $regex: search.trim(), $options: 'i' } },
        { lastName: { $regex: search.trim(), $options: 'i' } },
        { nationalId: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const patients = await this.patientRepo.getAll(filter, {
      firstName: 1,
      lastName: 1,
      nationalId: 1,
      phoneNumber: 1,
      isFamily: 1,
      _id: 1,
    });
    return patients;
  }

  async getPatientById(user: any, id: string) {
    const appointmentExist = await this.appointmentRepo.getOne({
      doctorId: user._id,
      patientId: id,
    });
    if (!appointmentExist) {
      throw new ForbiddenException(
        'You are not authorized to access this patient',
      );
    }
    const patient = await this.patientRepo.getOne(
      { _id: id },
      { password: 0, otp: 0, otpExpired: 0 },
    );
    if (!patient) throw new NotFoundException('patient not found');
    return patient;
  }

  async updateMe(patient: Patient, user: any) {
    const updatedPatient = await this.patientRepo.update(
      { _id: user._id },
      patient,
      { returnDocument: 'after', select: '-password' },
    );
    if (!updatedPatient) throw new NotFoundException('patient not found');
    return updatedPatient;
  }

  async updatePatientById(patient: Patient, user: any, id: string) {
    const appointmentExist = await this.appointmentRepo.getOne({
      doctorId: user._id,
      patientId: id,
    });
    if (!appointmentExist) throw new ForbiddenException();
    return await this.patientRepo.update({ _id: id }, patient, {
      returnDocument: 'after',
      select: '-password -otp -otpExpired',
    });
  }
}
