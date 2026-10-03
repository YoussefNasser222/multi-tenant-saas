import { AudienceType, EmergencyCaseRepository, EmergencyStatus, GeneralNotificationRepository, Role } from '@models/index';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmergencyCase } from './entities/emergency-case.entity';
import { UploadService } from '@common/upload';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EmergencyCaseService {
  constructor(
    private readonly emergencyRepo: EmergencyCaseRepository,
    private readonly uploadService: UploadService,
    private readonly generalNotificationRepo : GeneralNotificationRepository
  ) {}
  async create(emergency: EmergencyCase) {
    return await this.emergencyRepo.create(emergency);
  }
  async uploadReport(file: Express.Multer.File, caseCode: string) {
    const emergency = await this.emergencyRepo.getOne({ caseCode });
    if (!emergency) {
      throw new NotFoundException('emergency-case not found');
    }
    const uploaded = await this.uploadService.uploadFileToCloud(
      file,
      'Multi-Tenant/reports',
    );
    if (emergency.reportImageUrl?.public_id) {
      await this.uploadService.deleteFileFromCloud(
        emergency.reportImageUrl.public_id,
      );
    }
    await this.emergencyRepo.update(
      { caseCode },
      {
        reportImageUrl: {
          secure_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        },
      },
    );
    await this.generalNotificationRepo.create({
      title: 'Report uploaded',
      message: 'Report uploaded for case ' + caseCode,
      audience: AudienceType.Hospital,
      createdByRole : Role.Admin,
    });
    return uploaded;
  }
  async getOne(user: any, id: string) {
    const emergency = await this.emergencyRepo.getOne(
      { _id: id },
      {},
      {
        populate: {
          path: 'claimedByHospitalIds',
          select: 'hospitalName city governorate address phoneNumber',
        },
      },
    );
    if (!emergency) {
      throw new NotFoundException('emergency-case not found');
    }
    // تسجيل "مشاهدة" تلقائي بدون أي تفاعل من المستشفى — ده اللي بيخلّي
    // المريض يقدر يشوف "N مستشفى شافوا طلبك ولسه مفيش رد". $addToSet بيمنع التكرار.
    if (
      ![EmergencyStatus.RESOLVED, EmergencyStatus.EXPIRED].includes(
        emergency.status,
      )
    ) {
      await this.emergencyRepo.update(
        { _id: id },
        { $addToSet: { viewedByHospitalIds: user._id } } as any,
      );
    }
    return emergency;
  }
  async getAll() {
    return (
      (await this.emergencyRepo.getAll(
        {
          expiresAt: { $gte: new Date() },
          status: {
            $nin: [EmergencyStatus.RESOLVED, EmergencyStatus.EXPIRED],
          },
        },
        {},
        {
          populate: [
            {
              path: 'claimedByHospitalIds',
              select: 'hospitalName city governorate address phoneNumber',
            },
            {
              path: 'acceptedByHospitalId',
              select: 'hospitalName city governorate address phoneNumber',
            },
          ],
        },
      )) || []
    );
  }
  async claim(id: string, hospital: any) {
    const emergency = await this.emergencyRepo.getOne({ _id: id });
    if (!emergency) {
      throw new NotFoundException('emergency-case not found');
    }
    if (
      [EmergencyStatus.RESOLVED, EmergencyStatus.EXPIRED].includes(
        emergency.status,
      )
    ) {
      throw new ForbiddenException('this case is no longer available');
    }

    const alreadyClaimed = emergency.claimedByHospitalIds?.some(
      (hId) => hId.toString() === hospital._id.toString(),
    );
    if (alreadyClaimed) {
      return emergency;
    }

    return this.emergencyRepo.update(
      { _id: id },
      {
        status: EmergencyStatus.CLAIMED,
        $push: { claimedByHospitalIds: hospital._id },
      },
      { returnDocument: 'after' },
    );
  }
  /**
   * قبول حصري: مستشفى واحدة بالتحديد بتقبل الحالة (مش مجرد "اهتمام" زي claim).
   * atomic (findOneAndUpdate بشرط status != ACCEPTED) عشان لو مستشفيين ضغطوا
   * "قبول" في نفس اللحظة، واحدة بس تاخدها.
   */
  async accept(id: string, hospital: any) {
    const emergency = await this.emergencyRepo.update(
      {
        _id: id,
        status: { $nin: [EmergencyStatus.ACCEPTED, EmergencyStatus.RESOLVED, EmergencyStatus.EXPIRED] },
      } as any,
      { status: EmergencyStatus.ACCEPTED, acceptedByHospitalId: hospital._id } as any,
      { returnDocument: 'after' },
    );
    if (!emergency) {
      throw new ForbiddenException(
        'هذه الحالة تم قبولها بالفعل من مستشفى أخرى أو لم تعد متاحة',
      );
    }
    return emergency;
  }

  async resolve(id: string, hospital: any) {
    const emergency = await this.emergencyRepo.getOne({ _id: id });
    if (!emergency) {
      throw new NotFoundException('emergency-case not found');
    }
    // بس المستشفى اللي قبلت الحالة فعليًا (ACCEPTED) تقدر تقفلها كمكتملة
    if (
      !emergency.acceptedByHospitalId ||
      emergency.acceptedByHospitalId.toString() !== hospital._id.toString()
    ) {
      throw new ForbiddenException(
        'يجب قبول هذه الحالة أولاً قبل إغلاقها كمكتملة',
      );
    }
    return this.emergencyRepo.update(
      { _id: id },
      { status: EmergencyStatus.RESOLVED },
      { returnDocument: 'after' },
    );
  }

  /**
   * بترجّع رسالة وحالة واضحة للمريض بدل ما يختفي الطلب من غير تفسير:
   * - لسه مفيش رد: عدد المستشفيات اللي شافت الطلب من غير أي تفاعل
   * - اتقبلت: بيانات المستشفى اللي قبلته كاملة عشان المريض يروحلها
   * - اكتملت: رسالة شكر
   */
  async trackByCaseCode(caseCode: string) {
    const emergency = await this.emergencyRepo.getOne(
      { caseCode },
      { reportImageUrl: 0 },
      {
        populate: {
          path: 'acceptedByHospitalId',
          select: 'hospitalName city governorate address phoneNumber',
        },
      },
    );
    if (!emergency) {
      throw new NotFoundException('case not found');
    }

    if (emergency.status === EmergencyStatus.RESOLVED) {
      return {
        status: emergency.status,
        message: 'تم إتمام طلبك بنجاح، نتمنى لك الشفاء العاجل 🤍',
        acceptedHospital: emergency.acceptedByHospitalId || null,
      };
    }
    if (emergency.status === EmergencyStatus.ACCEPTED) {
      const h: any = emergency.acceptedByHospitalId;
      return {
        status: emergency.status,
        message: h
          ? `تم قبولك من مستشفى ${h.hospitalName}، يرجى التوجه إليها في أقرب وقت`
          : 'تم قبول طلبك',
        acceptedHospital: h || null,
      };
    }
    if (emergency.status === EmergencyStatus.EXPIRED) {
      return {
        status: emergency.status,
        message: 'تم إلغاء هذا الطلب',
        acceptedHospital: null,
      };
    }

    const viewedCount = emergency.viewedByHospitalIds?.length || 0;
    return {
      status: emergency.status,
      message:
        viewedCount > 0
          ? `شاهد طلبك ${viewedCount} ${viewedCount === 1 ? 'مستشفى' : 'مستشفيات'} حتى الآن ولم يردّ أحد بعد`
          : 'طلبك قيد المراجعة من المستشفيات',
      viewedCount,
      acceptedHospital: null,
    };
  }

  async cancelByCaseCode(caseCode: string) {
    const emergency = await this.emergencyRepo.getOne({ caseCode });
    if (!emergency) {
      throw new NotFoundException('case not found');
    }
    if (
      [EmergencyStatus.RESOLVED, EmergencyStatus.EXPIRED].includes(
        emergency.status,
      )
    ) {
      throw new BadRequestException('this case is already closed');
    }
    return this.emergencyRepo.update(
      { caseCode },
      { status: EmergencyStatus.EXPIRED },
    );
  }
}
