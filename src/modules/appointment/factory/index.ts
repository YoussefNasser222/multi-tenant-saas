import {
  AppointmentRepository,
  AppointmentStatus,
  BookingType,
  ClinicRepository,
  DoctorRepository,
  PatientRepository,
  VisitType,
} from '@models/index';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreateAppointmentDoctorDto,
  CreateAppointmentPatientDto,
} from '../dto/create-appointment.dto';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentFactoryService {
  constructor(
    private readonly doctorRepo: DoctorRepository,
    private readonly patientRepo: PatientRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly clinicRepo: ClinicRepository,
  ) {}
  async createAppointmentByPatient(
    dto: CreateAppointmentPatientDto,
    user: any,
  ) {
    const doctor = await this.doctorRepo.getOne({ _id: dto.doctorId });
    if (!doctor) throw new NotFoundException('doctor not found');

    const clinic = await this.clinicRepo.getOne({ _id: doctor.clinicId });
    if (!clinic) throw new NotFoundException('clinic not found');
    if (!clinic.isActive)
      throw new ForbiddenException(
        'this clinic is not accepting bookings right now',
      );

    const reqDate = new Date(dto.date);
    const reqTime = new Date(
      reqDate.getFullYear(),
      reqDate.getMonth(),
      reqDate.getDate(),
    ).getTime();

    const isBlocked = (clinic.blockedDates || []).some(
      (d: Date) =>
        new Date(
          new Date(d).getFullYear(),
          new Date(d).getMonth(),
          new Date(d).getDate(),
        ).getTime() === reqTime,
    );
    if (isBlocked) {
      throw new ForbiddenException('هذا اليوم مغلق للحجز');
    }

    if (clinic.workingDays && clinic.workingDays.length > 0) {
      const dayName = reqDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isOpenDay = clinic.workingDays.some(
        (w) => w.day.toLowerCase() === dayName.toLowerCase(),
      );
      if (!isOpenDay) {
        throw new ForbiddenException('العيادة لا تعمل في هذا اليوم');
      }
    }

    const appointment = new Appointment();
    appointment.clinicId = clinic._id;
    appointment.doctorId = dto.doctorId;
    appointment.patientId = user._id;
    appointment.date = dto.date;
    appointment.notes = dto.notes || '';
    appointment.contactPhone = dto.contactPhone || '';
    let patientVisitingType: VisitType;
    if (dto.visitingType) {
      patientVisitingType = dto.visitingType;
    } else {
      const prevAppt = await this.appointmentRepo.getOne({
        doctorId: dto.doctorId,
        patientId: user._id,
        status: {
          $in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED],
        },
      });
      patientVisitingType = prevAppt ? VisitType.FOLLOW_UP : VisitType.NEW;
    }
    appointment.visitingType = patientVisitingType;

    const dayStart = new Date(dto.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dto.date);
    dayEnd.setHours(23, 59, 59, 999);

    const activeCount = await this.appointmentRepo.count({
      doctorId: dto.doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
    });

    const maxLimit = clinic.maxPatientsPerDay || 20;
    if (activeCount >= maxLimit) {
      throw new ForbiddenException('هذا اليوم مكتمل، لا توجد أماكن متاحة');
    }

    appointment.queueNumber = activeCount + 1;
    appointment.status = AppointmentStatus.CONFIRMED;

    return appointment;
  }

  async createAppointmentByDoctor(
    dto: CreateAppointmentDoctorDto,
    user: any,
    patientId: string,
  ) {
    if (!user.clinicId) {
      throw new NotFoundException('clinic not found');
    }
    const patient = await this.patientRepo.getOne({ _id: patientId });
    if (!patient) {
      throw new NotFoundException('patient not found');
    }
    const clinic = await this.clinicRepo.getOne({ _id: user.clinicId });
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    if (!clinic.isActive) {
      throw new ForbiddenException(
        'this clinic is not accepting bookings right now',
      );
    }

    const reqDate = new Date(dto.date);
    const reqTime = new Date(
      reqDate.getFullYear(),
      reqDate.getMonth(),
      reqDate.getDate(),
    ).getTime();

    const isBlocked = (clinic.blockedDates || []).some(
      (d: Date) =>
        new Date(
          new Date(d).getFullYear(),
          new Date(d).getMonth(),
          new Date(d).getDate(),
        ).getTime() === reqTime,
    );
    if (isBlocked) {
      throw new ForbiddenException('هذا اليوم مغلق للحجز');
    }

    if (clinic.workingDays && clinic.workingDays.length > 0) {
      const dayName = reqDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isOpenDay = clinic.workingDays.some(
        (w) => w.day.toLowerCase() === dayName.toLowerCase(),
      );
      if (!isOpenDay) {
        throw new ForbiddenException('العيادة لا تعمل في هذا اليوم');
      }
    }

    const dayStart = new Date(dto.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dto.date);
    dayEnd.setHours(23, 59, 59, 999);

    const activeCount = await this.appointmentRepo.count({
      doctorId: user._id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
    });

    const maxLimit = clinic.maxPatientsPerDay || 20;
    if (activeCount >= maxLimit) {
      throw new ForbiddenException('هذا اليوم مكتمل، لا توجد أماكن متاحة');
    }

    const appointment = new Appointment();
    appointment.clinicId = clinic._id;
    appointment.doctorId = user._id;
    appointment.patientId = new Types.ObjectId(patientId);
    appointment.date = dto.date;
    appointment.notes = dto.notes || '';
    
    let doctorVisitingType: VisitType;
    if (dto.visitingType) {
      doctorVisitingType = dto.visitingType;
    } else {
      const prevAppt = await this.appointmentRepo.getOne({
        doctorId: user._id,
        patientId: new Types.ObjectId(patientId),
        status: {
          $in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED],
        },
      });
      doctorVisitingType = prevAppt ? VisitType.FOLLOW_UP : VisitType.NEW;
    }
    appointment.visitingType = doctorVisitingType;
    appointment.queueNumber = activeCount + 1;
    appointment.status = AppointmentStatus.CONFIRMED;

    return appointment;
  }
}
