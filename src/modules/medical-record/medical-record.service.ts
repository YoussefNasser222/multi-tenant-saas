import { UploadService } from '@common/upload';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionExtractorService } from './prescription-extractor.service';
import { MedicalRecord } from './entities/medical-record.entity';
import {
  AppointmentRepository,
  AppointmentStatus,
  MedicalRecordRepository,
  PatientDocumentRepository,
  RecordVisibility,
} from '@models/index';

@Injectable()
export class MedicalRecordService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prescriptionExtractorService: PrescriptionExtractorService,
    private readonly medicalRecordRepo: MedicalRecordRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly patientDocumentRepo: PatientDocumentRepository,
  ) {}

  async extractPrescription(file: Express.Multer.File, user: any) {
    if (!file) {
      throw new NotFoundException('File is required');
    }
    const uploaded = await this.uploadService.uploadFileToCloud(
      file,
      `Multi-Tenant/prescriptions/${user._id}`,
    );
    const extracted = await this.prescriptionExtractorService.extractFromImage(
      file.buffer,
      file.mimetype,
    );
    return { uploaded, extracted };
  }

  async create(medicalRecord: MedicalRecord) {
    await this.appointmentRepo.update(
      { _id: medicalRecord.appointmentId },
      { status: AppointmentStatus.CONFIRMED },
    );
    return await this.medicalRecordRepo.create(medicalRecord);
  }

  async getMedicalRecord(user: any, id: string) {
    const appointmentExist = await this.appointmentRepo.getOne({
      patientId: id,
      doctorId: user._id,
    });
    if (!appointmentExist) {
      throw new ForbiddenException(
        'You are not authorized to access this patient',
      );
    }
    const medicalRecords = await this.medicalRecordRepo.getAll(
      {
        $or: [{ doctorId: user._id }, { visibility: RecordVisibility.SHARED }],
        patientId: id,
      },
      {},
      { populate: { path: 'patientId', select: 'firstName lastName' } },
    );
    if (!medicalRecords || medicalRecords.length == 0) return [];
    return medicalRecords;
  }

  async getById(id: string, user: any) {
    const medicalRecord = await this.medicalRecordRepo.getOne({
      _id: id,
      $or: [{ doctorId: user._id }, { visibility: RecordVisibility.SHARED }],
    });
    if (!medicalRecord) throw new NotFoundException('medical-record not found');
    const appointmentExist = await this.appointmentRepo.getOne({
      patientId: medicalRecord.patientId,
      doctorId: user._id,
    });
    if (!appointmentExist) {
      throw new ForbiddenException(
        'You are not authorized to access this patient',
      );
    }
    return medicalRecord;
  }

  async getMyMedicalRecord(user: any) {
    const medicalRecords = await this.medicalRecordRepo.getAll(
      { patientId: user._id },
      {},
      { populate: { path: 'doctorId', select: 'firstName lastName' } },
    );
    if (!medicalRecords || medicalRecords.length == 0) return [];
    return medicalRecords;
  }

  // ── Patient Document Upload ──────────────────────────────
  async uploadPatientDocument(file: Express.Multer.File, user: any) {
    if (!file) throw new BadRequestException('File is required');
    const uploaded = await this.uploadService.uploadFileToCloud(
      file,
      `Multi-Tenant/patient-documents/${user._id}`,
    );
    return this.patientDocumentRepo.create({
      patientId: user._id,
      fileUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      fileName: file.originalname,
    });
  }

  async getMyDocuments(user: any) {
    return this.patientDocumentRepo.getAll(
      { patientId: user._id },
      {},
      { sort: { createdAt: -1 } },
    );
  }

  async getPatientDocuments(doctorUser: any, patientId: string) {
    const appt = await this.appointmentRepo.getOne({
      patientId,
      doctorId: doctorUser._id,
    });
    if (!appt) {
      throw new ForbiddenException("Not authorized to view this patient's documents");
    }
    return this.patientDocumentRepo.getAll(
      { patientId },
      {},
      { sort: { createdAt: -1 } },
    );
  }
}
