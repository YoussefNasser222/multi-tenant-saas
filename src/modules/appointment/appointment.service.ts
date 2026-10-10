import {
  AppointmentRepository,
  AppointmentStatus,
  ClinicRepository,
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
import { DEFAULT_LIST_LIMIT, SENSITIVE_SELECT } from '@common/constants';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly clinicRepo: ClinicRepository,
    private readonly uploadService: UploadService,
  ) {}

  async createAppointment(appointment: Appointment) {
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
          { path: 'patientId', select: SENSITIVE_SELECT },
          { path: 'clinicId' },
        ],
        sort: { date: -1 },
        limit: DEFAULT_LIST_LIMIT,
      },
    );
    // كان بيرمي 404 لو مفيش مواعيد؛ ده بيكسر صفحة الدكتور الجديد (0 مواعيد) لأن الفرونت
    // بيلجأ لـ /appointment/patient (403 لأنه مش Patient) → الصفحة كانت بتفشل بالكامل.
    // "مفيش نتايج" مش خطأ، فالـ endpoint بيرجّع array فاضية زي أي list endpoint تاني.
    return appointments || [];
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
            select: SENSITIVE_SELECT,
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
    const existing = await this.appointmentRepo.getOne({
      _id: id,
      doctorId: user._id,
    });
    if (!existing) {
      throw new NotFoundException('appointment not found');
    }

    const updateData: any = { status: updateAppointmentDto.status };

    // إذا تم تأكيد حجز كان في قائمة الانتظار ولم يكن لديه رقم دور، احجز له رقم دور متتابع
    if (
      updateAppointmentDto.status === AppointmentStatus.CONFIRMED &&
      !existing.queueNumber
    ) {
      const dateKey = new Date(existing.date).toISOString().slice(0, 10);
      const inc = await this.clinicRepo.update(
        {
          _id: existing.clinicId,
          dailyCounters: { $elemMatch: { date: dateKey } },
        } as any,
        { $inc: { 'dailyCounters.$.count': 1 } } as any,
        { returnDocument: 'after' },
      );
      if (inc) {
        const counter = inc.dailyCounters?.find((d: any) => d.date === dateKey);
        updateData.queueNumber = counter?.count ?? 1;
      } else {
        await this.clinicRepo.update(
          { _id: existing.clinicId, 'dailyCounters.date': { $ne: dateKey } } as any,
          { $push: { dailyCounters: { date: dateKey, count: 1 } } } as any,
          { returnDocument: 'after' },
        );
        updateData.queueNumber = 1;
      }
    }

    const appointment = await this.appointmentRepo.update(
      { _id: id, doctorId: user._id },
      updateData,
      { returnDocument: 'after' },
    );
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
          sort: { createdAt: -1 },
        },
      )) || []
    );
  }

  /**
   * الحصول على قائمة الانتظار لعيادة الدكتور في يوم معين
   */
  async getWaitlistForDate(user: any, date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const waitlist = await this.appointmentRepo.getAll(
      {
        doctorId: user._id,
        date: { $gte: dayStart, $lte: dayEnd },
        status: AppointmentStatus.WAITLISTED,
      },
      {},
      {
        populate: [{ path: 'patientId', select: SENSITIVE_SELECT }],
        sort: { waitlistPosition: 1 },
      },
    );
    return waitlist || [];
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
