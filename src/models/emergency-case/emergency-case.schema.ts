import { ImageType } from '@models/doctor/doctor.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
export enum EmergencyStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  // جديدة: مستشفى واحدة بالتحديد قبلت الحالة (مش مجرد "مهتمة")
  ACCEPTED = 'ACCEPTED',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class EmergencyCase {
  readonly _id: Types.ObjectId;
  @Prop({ type: ImageType })
  reportImageUrl: ImageType;
  @Prop({ type: String, required: true })
  phoneNumber: string;
  @Prop({ type: String })
  notes?: string;
  @Prop({ type: String, required: true , unique : true , index : true })
  caseCode: string;
  @Prop({ type: String, enum: EmergencyStatus, default: EmergencyStatus.OPEN })
  status: EmergencyStatus;
  // قديم: لسه موجود عشان التوافق، بيتسجّل فيه أي مستشفى عمل "اهتمام" قديمًا
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Hospital'})
  claimedByHospitalIds: Types.ObjectId[];
  // جديد: بيتسجّل أوتوماتيك لأي مستشفى فتحت تفاصيل الحالة من غير أي تفاعل،
  // عشان المريض يعرف "N مستشفى شافوا الطلب ولسه مفيش رد"
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Hospital', default: [] })
  viewedByHospitalIds: Types.ObjectId[];
  // جديد: المستشفى الوحيدة اللي قبلت فعليًا (exclusive) — ده اللي بيتوضح للمريض
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Hospital' })
  acceptedByHospitalId?: Types.ObjectId;
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const emergencyCaseSchema = SchemaFactory.createForClass(EmergencyCase)
