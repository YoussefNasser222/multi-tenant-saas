import { UploadService } from '@common/upload';
import { DEFAULT_LIST_LIMIT } from '@common/constants';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AccepterRole,
  DoctorRepository,
  HospitalRepository,
  Notification,
  NotificationRepository,
  SurgeryBookingRepository,
  SurgeryBookingStatus,
} from '@models/index';

@Injectable()
export class SurgeryBookingService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly bookingRepo: SurgeryBookingRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly hospitalRepo: HospitalRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  async create(
    files: Express.Multer.File[] | undefined,
    dto: { title: string; description?: string },
    patientUser: any,
  ) {
    const uploadedReports = await Promise.all(
      (files || []).map((f) =>
        this.uploadService.uploadFileToCloud(
          f,
          `Multi-Tenant/surgery-bookings/${patientUser._id}`,
        ),
      ),
    );

    const booking = await this.bookingRepo.create({
      patientId: patientUser._id,
      title: dto.title,
      description: dto.description,
      reports: uploadedReports.map((u) => ({
        public_id: u.public_id,
        secure_url: u.secure_url,
      })),
      bookingCode: randomBytes(4).toString('hex').toUpperCase(),
      status: SurgeryBookingStatus.Pending,
    } as any);

    await this.notifyProviders(booking._id, patientUser);
    return booking;
  }

  /** بيبعت إشعار لكل الأطباء وكل المستشفيات المسجّلين في المنصة */
  private async notifyProviders(bookingId: any, patientUser: any) {
    const [doctors, hospitals] = await Promise.all([
      this.doctorRepo.getAll({}, { _id: 1 }, { limit: DEFAULT_LIST_LIMIT }),
      this.hospitalRepo.getAll({}, { _id: 1 }, { limit: DEFAULT_LIST_LIMIT }),
    ]);
    const patientName =
      [patientUser.firstName, patientUser.lastName].filter(Boolean).join(' ') ||
      'مريض';
    const title = 'طلب حجز عملية جديد';
    const message = `${patientName} قدّم طلب حجز عملية جديد وينتظر رد.`;

    await Promise.all([
      ...doctors.map((d) =>
        this.notificationRepo.create({
          doctorId: d._id,
          patientId: patientUser._id,
          title,
          message,
        } as Partial<Notification>),
      ),
      ...hospitals.map((h) =>
        this.notificationRepo.create({
          hospitalId: h._id,
          patientId: patientUser._id,
          title,
          message,
        } as any),
      ),
    ]);
  }

  async getMine(patientUser: any) {
    return this.bookingRepo.getAll(
      { patientId: patientUser._id },
      {},
      { sort: { createdAt: -1 }, limit: DEFAULT_LIST_LIMIT },
    );
  }

  /** أي دكتور أو مستشفى يشوف كل الطلبات المتاحة (لسه مقبولاش حد تاني) */
  async getAllForProviders() {
    return this.bookingRepo.getAll(
      { status: { $in: [SurgeryBookingStatus.Pending, SurgeryBookingStatus.Accepted] } },
      {},
      {
        sort: { createdAt: -1 },
        limit: DEFAULT_LIST_LIMIT,
        populate: { path: 'patientId', select: 'firstName lastName phoneNumber' },
      },
    );
  }

  async getOne(id: string, user: any, providerRole?: AccepterRole) {
    const filter: any = { _id: id };
    if (!providerRole) {
      filter.patientId = user._id;
    }
    const booking = await this.bookingRepo.getOne(filter, {}, {
      populate: [
        { path: 'patientId', select: 'firstName lastName phoneNumber' },
        { path: 'acceptedById' },
      ],
    });
    if (!booking) {
      throw new NotFoundException('booking not found');
    }

    // تسجيل مشاهدة تلقائي (بدون تفاعل) لو اللي بيفتح دكتور أو مستشفى
    if (
      providerRole &&
      ![SurgeryBookingStatus.Completed, SurgeryBookingStatus.Cancelled].includes(
        booking.status,
      )
    ) {
      const alreadyViewed = booking.viewedBy?.some(
        (v) => v.role === providerRole && v.id.toString() === user._id.toString(),
      );
      if (!alreadyViewed) {
        await this.bookingRepo.update(
          { _id: id },
          { $push: { viewedBy: { role: providerRole, id: user._id } } } as any,
        );
      }
    }

    return this.buildStatusView(booking);
  }

  private buildStatusView(booking: any) {
    if (booking.status === SurgeryBookingStatus.Completed) {
      return {
        ...booking.toObject(),
        statusMessage: 'تم إتمام الحجز بنجاح، نتمنى لك الشفاء العاجل 🤍',
      };
    }
    if (booking.status === SurgeryBookingStatus.Accepted) {
      const provider: any = booking.acceptedById;
      const name =
        booking.acceptedByRole === AccepterRole.Hospital
          ? provider?.hospitalName
          : provider
          ? `د. ${provider.firstName} ${provider.lastName}`
          : null;
      return {
        ...booking.toObject(),
        statusMessage: name
          ? `تم قبولك من ${booking.acceptedByRole === AccepterRole.Hospital ? 'مستشفى' : ''} ${name}، سيتواصل معك قريبًا`
          : 'تم قبول طلبك',
      };
    }
    if (booking.status === SurgeryBookingStatus.Cancelled) {
      return { ...booking.toObject(), statusMessage: 'تم إلغاء هذا الطلب' };
    }
    const viewedCount = booking.viewedBy?.length || 0;
    return {
      ...booking.toObject(),
      statusMessage:
        viewedCount > 0
          ? `شاهد طلبك ${viewedCount} ${viewedCount === 1 ? 'جهة' : 'جهات'} حتى الآن ولم يردّ أحد بعد`
          : 'طلبك قيد المراجعة',
    };
  }

  async accept(id: string, role: AccepterRole, providerUser: any) {
    const booking = await this.bookingRepo.update(
      {
        _id: id,
        status: { $nin: [SurgeryBookingStatus.Accepted, SurgeryBookingStatus.Completed, SurgeryBookingStatus.Cancelled] },
      } as any,
      { status: SurgeryBookingStatus.Accepted, acceptedByRole: role, acceptedById: providerUser._id } as any,
      { returnDocument: 'after' },
    );
    if (!booking) {
      throw new ForbiddenException('تم قبول هذا الطلب بالفعل من جهة أخرى أو لم يعد متاحًا');
    }
    return booking;
  }

  async complete(id: string, role: AccepterRole, providerUser: any) {
    const booking = await this.bookingRepo.getOne({ _id: id });
    if (!booking) {
      throw new NotFoundException('booking not found');
    }
    if (
      booking.acceptedByRole !== role ||
      !booking.acceptedById ||
      booking.acceptedById.toString() !== providerUser._id.toString()
    ) {
      throw new ForbiddenException('يجب قبول هذا الطلب أولاً قبل إغلاقه كمكتمل');
    }
    return this.bookingRepo.update(
      { _id: id },
      { status: SurgeryBookingStatus.Completed },
      { returnDocument: 'after' },
    );
  }

  async cancel(id: string, patientUser: any) {
    const booking = await this.bookingRepo.getOne({ _id: id, patientId: patientUser._id });
    if (!booking) {
      throw new NotFoundException('booking not found');
    }
    if ([SurgeryBookingStatus.Completed, SurgeryBookingStatus.Cancelled].includes(booking.status)) {
      throw new BadRequestException('هذا الطلب مغلق بالفعل');
    }
    return this.bookingRepo.update(
      { _id: id },
      { status: SurgeryBookingStatus.Cancelled },
    );
  }
}
