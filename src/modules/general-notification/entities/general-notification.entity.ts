import { AudienceType, Role } from "@models/index";
import { Types } from "mongoose";

export class GeneralNotification {
    readonly _id : Types.ObjectId
  title: string;
  message: string;
  audience: AudienceType;
  createdBy: Types.ObjectId;
  createdByRole: Role;
}
