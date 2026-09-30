import { UploadService } from '@common/upload';
import { DEFAULT_LIST_LIMIT } from '@common/constants';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConsultationRepository,
  ConsultationSenderType,
  DoctorRepository,
  Notification,
  NotificationRepository,
} from '@models/index';
import { ConsultationAnalyzerService } from './consultation-analyzer.service';

@Injectable()
export class ConsultationService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly analyzerService: ConsultationAnalyzerService,
    private readonly consultationRepo: ConsultationRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  /** المريض بيبدأ استشارة جديدة: صورة (إجبارية) + سؤال (اختياري). */
  async create(
    file: Express.Multer.File,
    question: string | undefined,
    patientUser: any,
  ) {
    if (!file) {
      throw new BadRequestException('يجب إرفاق صورة التقرير أو الأشعة');
    }

    const uploaded = await this.uploadService.uploadFileToCloud(
      file,
      `Multi-Tenant/consultations/${patientUser._id}`,
    );

    // فشل الـ AI هنا مستحيل يوقف رفع الاستشارة (analyze() دايمًا بترجع نص،
    // حتى لو رسالة fallback)
    const aiReplyText = await this.analyzerService.analyze(
      file.buffer,
      file.mimetype,
      question,
    );

    const now = new Date();
    const consultation = await this.consultationRepo.create({
      patientId: patientUser._id,
      lastMessageAt: now,
      messages: [
        {
          senderType: ConsultationSenderType.Patient,
          text: question,
          image: { public_id: uploaded.public_id, secure_url: uploaded.secure_url },
        } as any,
        {
          senderType: ConsultationSenderType.AI,
          text: aiReplyText,
        } as any,
      ],
    });

    await this.notifyAllDoctors(consultation._id, patientUser);

    return consultation;
  }

  /** بيبعت إشعار لكل دكتور مسجّل في المنصة إن فيه استشارة جديدة محتاجة رد. */
  private async notifyAllDoctors(consultationId: any, patientUser: any) {
    const doctors = await this.doctorRepo.getAll(
      {},
      { _id: 1 },
      { limit: DEFAULT_LIST_LIMIT },
    );
    if (!doctors.length) return;

    const patientName =
      [patientUser.firstName, patientUser.lastName].filter(Boolean).join(' ') ||
      'مريض';

    await Promise.all(
      doctors.map((doctor) =>
        this.notificationRepo.create({
          doctorId: doctor._id,
          patientId: patientUser._id,
          consultationId,
          title: 'استشارة طبية جديدة',
          message: `${patientName} طلب استشارة طبية عامة جديدة وينتظر رد أحد الأطباء.`,
        } as Partial<Notification>),
      ),
    );
  }

  /** المريض بيشوف كل استشاراته هو بس */
  async getMyConsultations(patientUser: any) {
    return this.consultationRepo.getAll(
      { patientId: patientUser._id },
      {},
      { sort: { lastMessageAt: -1 }, limit: DEFAULT_LIST_LIMIT },
    );
  }

  /** أي دكتور يشوف كل الاستشارات (مفيش تخصيص لدكتور معيّن) */
  async getAllConsultations() {
    return this.consultationRepo.getAll(
      {},
      {},
      {
        sort: { lastMessageAt: -1 },
        limit: DEFAULT_LIST_LIMIT,
        populate: { path: 'patientId', select: 'firstName lastName' },
      },
    );
  }

  /** المريض صاحب الاستشارة، أو أي دكتور — يقدروا يفتحوا الـ thread كامل */
  async getOne(id: string, user: any, isDoctor: boolean) {
    const filter: any = { _id: id };
    if (!isDoctor) {
      filter.patientId = user._id;
    }
    const consultation = await this.consultationRepo.getOne(filter, {}, {
      populate: [
        { path: 'patientId', select: 'firstName lastName' },
        { path: 'messages.senderId', select: 'firstName lastName' },
      ],
    });
    if (!consultation) {
      throw new NotFoundException('consultation not found');
    }
    return consultation;
  }

  /** أي دكتور يقدر يضيف رد نصي على أي استشارة */
  async addDoctorReply(id: string, doctorUser: any, text: string) {
    const consultation = await this.consultationRepo.update(
      { _id: id },
      {
        $push: {
          messages: {
            senderType: ConsultationSenderType.Doctor,
            senderId: doctorUser._id,
            text,
          },
        },
        $set: { lastMessageAt: new Date() },
      } as any,
      { returnDocument: 'after' },
    );
    if (!consultation) {
      throw new NotFoundException('consultation not found');
    }
    return consultation;
  }
}
