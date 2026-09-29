import { AppointmentRepository, PatientRepository, Role } from '@models/index';
import { DEFAULT_LIST_LIMIT, SENSITIVE_SELECT, stripSensitive } from '@common/constants';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// عشان نمنع Regex Injection / ReDoS لما نستخدم قيمة المستخدم جوه $regex
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly appointmentRepo: AppointmentRepository,
  ) {}

  async getProfile(user: any) {
    const patient = await this.patientRepo.getOne({ _id: user._id });
    if (!patient) throw new NotFoundException('patient not found');
    return stripSensitive(patient.toObject());
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
    // distinct بدل ما نحمّل كل المواعيد بس عشان نطلّع المرضى المتكررين
    const patientIds = await this.appointmentRepo.distinct('patientId', {
      doctorId: user._id,
    });
    if (!patientIds || patientIds.length === 0) return [];
    return this.patientRepo.getAll({ _id: { $in: patientIds } }, SENSITIVE_SELECT, {
      limit: DEFAULT_LIST_LIMIT,
    });
  }

  /* مرضى النظام غير المسجلين عند هذا الدكتور */
  async getNonClinicPatients(user: any, search?: string) {
    /* جمع patientId المسجلين عند الدكتور */
    const myPatientIds = (
      await this.appointmentRepo.distinct('patientId', { doctorId: user._id })
    ).map((id) => id.toString());

    /* بناء فلتر البحث */
    const filter: any = {
      role: Role.Patient,
      _id: { $nin: myPatientIds },
    };
    if (search?.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { firstName: { $regex: safeSearch, $options: 'i' } },
        { lastName: { $regex: safeSearch, $options: 'i' } },
        { nationalId: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const patients = await this.patientRepo.getAll(
      filter,
      {
        firstName: 1,
        lastName: 1,
        nationalId: 1,
        phoneNumber: 1,
        isFamily: 1,
        _id: 1,
      },
      { limit: DEFAULT_LIST_LIMIT },
    );
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
      SENSITIVE_SELECT,
    );
    if (!patient) throw new NotFoundException('patient not found');
    return patient;
  }

  async updateMe(patient: Record<string, any>, user: any) {
    const updatedPatient = await this.patientRepo.update(
      { _id: user._id },
      patient,
      { returnDocument: 'after', select: SENSITIVE_SELECT },
    );
    if (!updatedPatient) throw new NotFoundException('patient not found');
    return updatedPatient;
  }

  async updatePatientById(patient: Record<string, any>, user: any, id: string) {
    const appointmentExist = await this.appointmentRepo.getOne({
      doctorId: user._id,
      patientId: id,
    });
    if (!appointmentExist) throw new ForbiddenException();
    const updated = await this.patientRepo.update({ _id: id }, patient, {
      returnDocument: 'after',
      select: SENSITIVE_SELECT,
    });
    if (!updated) throw new NotFoundException('patient not found');
    return updated;
  }
}