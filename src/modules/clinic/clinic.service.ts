import { AppointmentRepository, AppointmentStatus, ClinicRepository } from '@models/index';
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
  async getQueueStatus(clinicId: string, date: string) {
    const clinic = await this.clinicRepo.getOne({ _id: clinicId });
    if (!clinic) {
      throw new NotFoundException('clinic not found');
    }
    if (!clinic.isActive) {
      return {
        isActive: false,
        isBlocked: false,
        isOpenDay: false,
        isFull: true,
        queueCount: 0,
        maxPatientsPerDay: clinic.maxPatientsPerDay || 20,
        remainingSlots: 0,
      };
    }

    const requestedDate = new Date(date);
    const reqYear = requestedDate.getFullYear();
    const reqMonth = requestedDate.getMonth();
    const reqDay = requestedDate.getDate();

    const isBlocked = (clinic.blockedDates || []).some((d: Date) => {
      const bd = new Date(d);
      return (
        bd.getFullYear() === reqYear &&
        bd.getMonth() === reqMonth &&
        bd.getDate() === reqDay
      );
    });

    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const workingDays = clinic.workingDays || [];
    const isOpenDay =
      workingDays.length === 0 ||
      workingDays.some((w) => w.day.toLowerCase() === dayName.toLowerCase());

    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const activeCount = await this.appointmentRepo.count({
      clinicId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
    });

    const maxPatients = clinic.maxPatientsPerDay || 20;
    const isFull = activeCount >= maxPatients;

    return {
      isActive: true,
      isBlocked,
      isOpenDay,
      isFull,
      queueCount: activeCount,
      maxPatientsPerDay: maxPatients,
      remainingSlots: Math.max(0, maxPatients - activeCount),
    };
  }

}
