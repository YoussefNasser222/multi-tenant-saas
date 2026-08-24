import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { MedicalRecord } from '../entities/medical-record.entity';
import { AppointmentRepository, RecordVisibility } from '@models/index';

@Injectable()
export class MedicalRecordFactoryService {
  constructor(private readonly appointmentRepo: AppointmentRepository) {}
  async createMedicalRecord(dto: CreateMedicalRecordDto, user: any) {
    const appointment = await this.appointmentRepo.getOne({
      _id: dto.appointmentId,
      doctorId: user._id,
    });
    if (!appointment) {
      throw new NotFoundException('appointment not found');
    }
    const medicalRecord = new MedicalRecord();
    medicalRecord.appointmentId = dto.appointmentId;
    medicalRecord.doctorId = user._id;
    medicalRecord.patientId = appointment.patientId;
    medicalRecord.diagnosis = dto.diagnosis || '';
    medicalRecord.medications = dto.medications || [];
    medicalRecord.notes = dto.notes || '';
    medicalRecord.prescriptionImageUrl = dto.prescriptionImageUrl || '';
    medicalRecord.visibility = dto.visibility || RecordVisibility.PRIVATE;
    medicalRecord.prescriptionImageUrl = dto.prescriptionImageUrl || '';
    return medicalRecord;
  }
}
