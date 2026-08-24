import { EmergencyStatus, ImageType } from "@models/index";
import { Types } from "mongoose";

export class EmergencyCase {
  readonly _id: Types.ObjectId;
  reportImageUrl: ImageType;
  phoneNumber: string;
  notes?: string;
  caseCode: string;
  status: EmergencyStatus;
  claimedByHospitalIds: Types.ObjectId[];
  expiresAt: Date;
}
