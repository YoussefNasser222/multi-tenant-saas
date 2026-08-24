import {
  AppointmentRepository,
  AppointmentStatus,
  DoctorRepository,
} from '@models/index';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Appointment } from './entities/appointment.entity';
import { log } from 'console';
import { UploadService } from '@common/upload';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly uploadService: UploadService,
  ) {}

  async createAppointment(appointment: Appointment) {
    if (appointment.startTime && appointment.endTime) {
      const appointmentExist = await this.appointmentRepo.getOne({
        doctorId: appointment.doctorId,
        startTime: { $lt: appointment.endTime },
        endTime: { $gt: appointment.startTime },
        status: { $ne: AppointmentStatus.CANCELLED },
      });
      if (appointmentExist) {
        throw new ConflictException('Appointment already exists');
      }
    }
    return await this.appointmentRepo.create(appointment);
  }

  async deleteAppointment(user: any, id: string) {
    const appointment = await this.appointmentRepo.deleteOne({
      _id: id,
      patientId: user._id,
    });
    if (appointment.deletedCount === 0) {
      throw new NotFoundException('appointment not found');
    }
  }

  async getAppointments(user: any) {
    const appointments = await this.appointmentRepo.getAll(
      {
        doctorId: user._id,
      },
      {},
      {
        populate: [
          { path: 'patientId', select: '-password -otp -otpExpired' },
          { path: 'clinicId' },
        ],
      },
    );
    if (!appointments || appointments.length === 0) {
      throw new NotFoundException('appointments not found');
    }
    return appointments;
  }

  async getAppointment(user: any, id: string) {
    const appointment = await this.appointmentRepo.getOne(
      {
        _id: id,
        doctorId: user._id,
      },
      {},
      {
        populate: [
          {
            path: 'patientId',
            select: '-password -otp -otpExpired',
          },
          { path: 'clinicId' },
        ],
      },
    );
    if (!appointment) {
      throw new NotFoundException('appointment not found');
    }
    return appointment;
  }

  async updateAppointment(user: any, id: string, updateAppointmentDto: any) {
    const appointment = await this.appointmentRepo.update(
      { _id: id, doctorId: user._id },
      { status: updateAppointmentDto.status },
    );
    if (!appointment) {
      throw new NotFoundException('appointment not found');
    }
    return appointment;
  }
  async getMyAllAppointmentsByPatient(user: any) {
    return (
      (await this.appointmentRepo.getAll(
        { patientId: user._id },
        {},
        {
          populate: [
            { path: 'doctorId', select: 'firstName lastName image' },
            { path: 'clinicId' },
          ],
        },
      )) || []
    );
  }
  async uploadImage(file: Express.Multer.File, id: string, user: any) {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const appointment = await this.appointmentRepo.getOne({
      _id: id,
      patientId: user._id,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      ![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(
        appointment.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot upload image for cancelled or completed appointment',
      );
    }

    const uploaded = await this.uploadService.uploadFileToCloud(
      file,
      `Multi-Tenant/appointment/${user._id}`,
    );

    const updatedAppointment = await this.appointmentRepo.update(
      { _id: id },
      {
        image: {
          public_id: uploaded.public_id,
          secure_url: uploaded.secure_url,
        },
      },
      { returnDocument: 'after' },
    );
    if (appointment.image?.public_id) {
      await this.uploadService.deleteFileFromCloud(appointment.image.public_id);
    }
    return updatedAppointment;
  }
}
