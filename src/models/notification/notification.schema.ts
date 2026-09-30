import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;
  @Prop({ type: String, required: true, trim: true })
  title: string;
  @Prop({ type: String, required: true, trim: true })
  message: string;
  @Prop({ type: Boolean, default: false })
  isRead: boolean;
  // اختياري: موجود بس للإشعارات اللي بتشاور على استشارة طبية جديدة، عشان
  // الفرونت يقدر يودّي الدكتور للاستشارة نفسها لما يدوس على الإشعار.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Consultation' })
  consultationId?: Types.ObjectId;
}

export const notificationSchema = SchemaFactory.createForClass(Notification);
