import { Types } from "mongoose";

export class Notification {
  readonly _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
}
