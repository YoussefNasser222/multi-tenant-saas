import {
  AppointmentRepository,
  AppointmentStatus,
  ClinicRepository,
  DoctorRepository,
  PatientRepository,
} from '@models/index';
import { Doctor, Patient } from '@modules/auth/entities/auth.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Clinic } from './entity';
import { UploadService } from '@common/upload';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepo: DoctorRepository,
    private readonly clinicRepo: ClinicRepository,
    private readonly patientRepo: PatientRepository,
    private readonly uploadService: UploadService,
    private readonly appointmentRepo :  AppointmentRepository
  ) {}

  async findOne(id: string) {
    const doctor = await this.doctorRepo.getOne(
      { _id: id },
      {},
      {
        populate: { path: 'clinicId' },
      },
    );
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    const { password, otp, otpExpired, ...other } = doctor.toObject();
    return other;
  }
  async update(doctor: Doctor, id: string | Types.ObjectId) {
    const doctorExist = await this.doctorRepo.getOne({ _id: id });
    if (!doctorExist) {
      throw new NotFoundException('Doctor not found');
    }
    const updatedDoctor = await this.doctorRepo.update({ _id: id }, doctor, {
      returnDocument: 'after',
    });
    const { password, otp, otpExpired, isPaid, paidExpired, ...other } =
      updatedDoctor?.toObject() || {};
    return other;
  }
  async createClinic(clinic: Clinic, doctor: any) {
    const clinicExist = await this.clinicRepo.getOne({ doctorId: doctor._id });
    if (clinicExist) {
      throw new ConflictException('clinic already exist');
    }
    const createdClinic = await this.clinicRepo.create(clinic);
    await this.doctorRepo.update(
      { _id: doctor._id },
      {
        clinicId: createdClinic._id,
      },
    );
    return createdClinic;
  }
  async updateClinic(clinic: Clinic, doctor: any) {
    const clinicExist = await this.clinicRepo.getOne({ doctorId: doctor._id });
    if (!clinicExist) {
      throw new NotFoundException('clinic not found');
    }
    return await this.clinicRepo.update({ doctorId: doctor._id }, clinic, {
      returnDocument: 'after',
    });
  }
  async getMyClinic(doctor: any) {
    const clinic = await this.clinicRepo.getOne(
      { doctorId: doctor._id },
      {},
      { populate: [{ path: 'doctorId', select: 'firstName lastName' }] },
    );
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    return clinic;
  }
  async updatePatient(patient: Patient, id: string) {
    const patientExist = await this.patientRepo.getOne({ _id: id });
    if (!patientExist) {
      throw new NotFoundException('patient not found');
    }
    const updatedPatient = await this.patientRepo.update({ _id: id }, patient, {
      returnDocument: 'after',
    });
    const { password, otp, otpExpired, ...other } =
      updatedPatient?.toObject() || {};
    return other;
  }
  async deleteDoctor(user: any) {
    const deletedUser = await this.doctorRepo.deleteOne({ _id: user._id });
    const deleteClinic = await this.clinicRepo.deleteOne({
      doctorId: user._id,
    });
    if (deletedUser.deletedCount === 0) {
      throw new NotFoundException('Doctor not found');
    }
    return deletedUser;
  }
  async updateProfileImage(file: Express.Multer.File, user: any) {
    const upload = await this.uploadService.uploadFileToCloud(
      file,
      `Multi-Tenant/profile-image/${user._id}`,
    );
    const updatedDoctor = await this.doctorRepo.update(
      { _id: user._id },
      {
        image: {
          public_id: upload.public_id,
          secure_url: upload.secure_url,
        },
      },
      { returnDocument: 'after' },
    );
    if (user.image) {
      await this.uploadService.deleteFileFromCloud(user.image.public_id);
    }
    return updatedDoctor;
  }
  async updateStatus(isActive: boolean, doctorId: string) {
    const updatedDoctor = await this.clinicRepo.update(
      { doctorId },
      { isActive },
      { returnDocument: 'after' },
    );
    if (!isActive) {
      await this.appointmentRepo.updateMany(
        {
          doctorId: doctorId,
          status: {
            $in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.WAITLISTED,
            ],
          },
        },
        { status: AppointmentStatus.CANCELLED },
      );
    }
    return updatedDoctor;
  }

  async blockDate(doctorId: string, dateStr: string) {
    const clinic = await this.clinicRepo.getOne({ doctorId });
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    const targetDate = new Date(dateStr);
    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const existing = (clinic.blockedDates || []).some(
      (d: Date) => new Date(new Date(d).getFullYear(), new Date(d).getMonth(), new Date(d).getDate()).getTime() === targetTime
    );
    if (existing) {
      return clinic;
    }
    return await this.clinicRepo.update(
      { doctorId },
      { $push: { blockedDates: targetDate } },
      { returnDocument: 'after' },
    );
  }

  async unblockDate(doctorId: string, dateStr: string) {
    const clinic = await this.clinicRepo.getOne({ doctorId });
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    const targetDate = new Date(dateStr);
    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const filtered = (clinic.blockedDates || []).filter(
      (d: Date) => new Date(new Date(d).getFullYear(), new Date(d).getMonth(), new Date(d).getDate()).getTime() !== targetTime
    );
    return await this.clinicRepo.update(
      { doctorId },
      { blockedDates: filtered },
      { returnDocument: 'after' },
    );
  }
}
