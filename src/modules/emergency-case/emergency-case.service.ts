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
          populate: {
            path: 'claimedByHospitalIds',
            select: 'hospitalName city governorate address phoneNumber',
          },
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
  async resolve(id: string, hospital: any) {
    const emergency = await this.emergencyRepo.getOne({ _id: id });
    if (!emergency) {
      throw new NotFoundException('emergency-case not found');
    }
    const hasClaimedIt = emergency.claimedByHospitalIds?.some(
      (hId) => hId.toString() === hospital._id.toString(),
    );
    if (!hasClaimedIt) {
      throw new ForbiddenException(
        'you must claim this case before resolving it',
      );
    }
    return this.emergencyRepo.update(
      { _id: id },
      { status: EmergencyStatus.RESOLVED },
      { returnDocument: 'after' },
    );
  }

  async trackByCaseCode(caseCode: string) {
    const emergency = await this.emergencyRepo.getOne(
      { caseCode },
      { reportImageUrl: 0 },
    );
    if (!emergency) {
      throw new NotFoundException('case not found');
    }
    return {
      status: emergency.status,
      interestedHospitalsCount: emergency.claimedByHospitalIds?.length || 0,
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
