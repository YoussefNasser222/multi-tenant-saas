import { AppointmentRepository, AppointmentStatus,  ClinicRepository, BookingType } from '@models/index';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ClinicService {
  constructor(private readonly clinicRepo: ClinicRepository,
    private readonly appointmentRepo : AppointmentRepository
  ) {}
  async getClinics() {
    const clinics = await this.clinicRepo.getAll(
      {},
      {},
      {
        populate: {
          path: 'doctorId',
          select: 'firstName lastName image',
          match: { paidExpired: { $gt: new Date() } },
        },
      },
    );
    const paidClinics = clinics.filter((c) => c.doctorId !== null);
    if (!paidClinics || paidClinics.length == 0) return [];
    return paidClinics;
  }
  async getClinicById(id: string) {
    const clinic = await this.clinicRepo.getOne({ _id: id }, {}, {
      populate: {
        path: 'doctorId',
        select: 'firstName lastName image',
      },
    });
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    return clinic;
  }
async getAvailableSlots(clinicId: string, date: string) {
  const clinic = await this.clinicRepo.getOne({ _id: clinicId });
  if (!clinic) {
    throw new NotFoundException('clinic not found');
  }
  if (clinic.bookingType !== BookingType.TIME) {
    throw new BadRequestException('this clinic uses queue-based booking, not time slots');
  }
  if (!clinic.isActive) {
    return { availableSlots: [] };
  }

  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const workingDay = clinic.workingDays.find((d) => d.day === dayName);
  if (!workingDay) {
    return { availableSlots: [] }; 
  }

  
  const slots: string[] = [];
  const start = new Date(workingDay.from);
  const end = new Date(workingDay.to);
  let cursor = new Date(requestedDate);
  cursor.setHours(start.getHours(), start.getMinutes(), 0, 0);
  const endTime = new Date(requestedDate);
  endTime.setHours(end.getHours(), end.getMinutes(), 0, 0);

  while (cursor < endTime) {
    slots.push(cursor.toTimeString().slice(0, 5)); // "09:00"
    cursor = new Date(cursor.getTime() + clinic.slotDuration! * 60000);
  }

  // نستبعد الـ slots المحجوزة بالفعل (CONFIRMED أو PENDING)
  const dayStart = new Date(requestedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(requestedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedAppointments = await this.appointmentRepo.getAll({
    clinicId,
    startTime: { $gte: dayStart, $lte: dayEnd },
    status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
  });
  const bookedTimes = new Set(
    bookedAppointments.map((a) => a.startTime!.toTimeString().slice(0, 5)),
  );

  const availableSlots = slots.filter((s) => !bookedTimes.has(s));

  // احترام حد maxPatientsPerDay حتى لو الـ slots نظريًا أكتر
  const remainingCapacity = clinic.maxPatientsPerDay - bookedAppointments.length;
  return { availableSlots: availableSlots.slice(0, Math.max(remainingCapacity, 0)) };
}
}
