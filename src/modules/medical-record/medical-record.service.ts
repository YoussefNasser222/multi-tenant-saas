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
  async uploadPatientDocument(file: Express.Multer.File | undefined, body: any, user: any) {
    if (!file && !body.patientNotes?.trim()) {
      throw new BadRequestException('يجب إرفاق ملف أو كتابة ملاحظات');
    }

    if (body.targetDoctorId) {
      const appt = await this.appointmentRepo.getOne({
        patientId: user._id,
        doctorId: body.targetDoctorId,
      });
      if (!appt) {
        throw new BadRequestException('لا يمكنك إرسال مستند لطبيب لم تقم بحجز موعد لديه مسبقاً');
      }
    }

    let fileUrl: string | undefined;
    let publicId: string | undefined;
    let fileName: string | undefined;
    let aiAnalysis = '';

    if (file) {
      const uploaded = await this.uploadService.uploadFileToCloud(
        file,
        `Multi-Tenant/patient-documents/${user._id}`,
      );
      fileUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
      fileName = file.originalname;

      try {
        if (file.mimetype.startsWith('image/')) {
          const extracted = await this.prescriptionExtractorService.extractFromImage(
            file.buffer,
            file.mimetype,
          );
          if (extracted) {
            aiAnalysis = `تشخيص مبدئي: ${extracted.diagnosis}\nأدوية: ${extracted.medications?.map(m => m.name).join(', ') ?? 'لا يوجد'}\nملاحظات: ${extracted.notes}`;
          }
        }
      } catch (err) {
        // AI fail ignore
      }
    }

    return this.patientDocumentRepo.create({
      patientId: user._id,
      fileUrl,
      publicId,
      fileName,
      targetDoctorId: body.targetDoctorId || undefined,
      patientNotes: body.patientNotes || undefined,
      familyMemberName: body.familyMemberName || undefined,
      aiAnalysis: aiAnalysis || undefined,
    });
  }

  async updatePatientDocument(id: string, file: Express.Multer.File | undefined, body: any, user: any) {
    const doc = await this.patientDocumentRepo.getOne({
      _id: id,
      patientId: user._id,
    });
    if (!doc) {
      throw new NotFoundException('المستند غير موجود أو ليس لديك صلاحية تعديله');
    }

    if (body.targetDoctorId && body.targetDoctorId !== doc.targetDoctorId?.toString()) {
      const appt = await this.appointmentRepo.getOne({
        patientId: user._id,
        doctorId: body.targetDoctorId,
      });
      if (!appt) {
        throw new BadRequestException('لا يمكنك ربط المستند بطبيب لم تقم بحجز موعد لديه مسبقاً');
      }
    }

    const updateData: any = {};
    if (body.patientNotes !== undefined) updateData.patientNotes = body.patientNotes;
    if (body.familyMemberName !== undefined) updateData.familyMemberName = body.familyMemberName;
    if (body.targetDoctorId !== undefined) updateData.targetDoctorId = body.targetDoctorId || null;

    if (file) {
      if (doc.publicId) {
        try {
          await this.uploadService.deleteFileFromCloud(doc.publicId);
        } catch {}
      }
      const uploaded = await this.uploadService.uploadFileToCloud(
        file,
        `Multi-Tenant/patient-documents/${user._id}`,
      );
      updateData.fileUrl = uploaded.secure_url;
      updateData.publicId = uploaded.public_id;
      updateData.fileName = file.originalname;

      try {
        if (file.mimetype.startsWith('image/')) {
          const extracted = await this.prescriptionExtractorService.extractFromImage(
            file.buffer,
            file.mimetype,
          );
          if (extracted) {
            updateData.aiAnalysis = `تشخيص مبدئي: ${extracted.diagnosis}\nأدوية: ${extracted.medications?.map(m => m.name).join(', ') ?? 'لا يوجد'}\nملاحظات: ${extracted.notes}`;
          }
        }
      } catch {}
    }

    return this.patientDocumentRepo.update(
      { _id: id, patientId: user._id },
      updateData,
    );
  }

  async deletePatientDocument(id: string, user: any) {
    const doc = await this.patientDocumentRepo.getOne({
      _id: id,
      patientId: user._id,
    });
    if (!doc) {
      throw new NotFoundException('المستند غير موجود');
    }

    if (doc.publicId) {
      try {
        await this.uploadService.deleteFileFromCloud(doc.publicId);
      } catch {}
    }

    return this.patientDocumentRepo.deleteOne({
      _id: id,
      patientId: user._id,
    });
  }

  async getMyDocuments(user: any) {
    return this.patientDocumentRepo.getAll(
      { patientId: user._id },
      {},
      {
        sort: { createdAt: -1 },
        populate: { path: 'targetDoctorId', select: 'firstName lastName' },
      },
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
      {
        patientId,
        $or: [
          { targetDoctorId: doctorUser._id },
          { targetDoctorId: { $exists: false } },
          { targetDoctorId: null },
        ],
      },
      {},
      { sort: { createdAt: -1 } },
    );
  }
}
