import { ImageType } from '@models/doctor/doctor.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export enum ConsultationSenderType {
  Patient = 'Patient',
  AI = 'AI',
  Doctor = 'Doctor',
}

/**
 * رسالة واحدة جوه thread الاستشارة. أول رسالة دايمًا من المريض (وفيها الصورة)،
 * وبعدها رد الـ AI تلقائي، وبعد كده أي دكتور يقدر يضيف رد.
 */
@Schema({ timestamps: true })
export class ConsultationMessage {
  readonly _id: Types.ObjectId;
  @Prop({ type: String, enum: ConsultationSenderType, required: true })
  senderType: ConsultationSenderType;
  // موجود بس لو senderType = Doctor (عشان نعرض اسمه في الفرونت)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor' })
  senderId?: Types.ObjectId;
  @Prop({ type: String })
  text?: string;
  @Prop({ type: ImageType })
  image?: ImageType;
}
export const consultationMessageSchema =
  SchemaFactory.createForClass(ConsultationMessage);

@Schema({ timestamps: true })
export class Consultation {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;
  @Prop({ type: [consultationMessageSchema], default: [] })
  messages: ConsultationMessage[];
  // بيتحدّث مع أي رسالة جديدة، عشان نرتّب القوائم بيه من غير الاعتماد على آخر رسالة
  @Prop({ type: Date, default: Date.now, index: true })
  lastMessageAt: Date;
}

export const consultationSchema = SchemaFactory.createForClass(Consultation);
