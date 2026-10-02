import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;
  // بقى اختياري (كان required) عشان نقدر نعمل إشعارات موجّهة لمستشفى بس
  // (hospitalId) من غير doctorId. أي كود قديم بيقرأ doctorId لسه شغال عادي —
  // الإشعارات القديمة كلها كانت بالفعل بتحطه.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor' })
  doctorId?: Types.ObjectId;
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
  // اختياري: إشعار موجّه لحجز عملية معيّن
  @Prop({ type: SchemaTypes.ObjectId, ref: 'SurgeryBooking' })
  surgeryBookingId?: Types.ObjectId;
  // اختياري: إشعار موجّه لمستشفى (بدل دكتور). الحقل القديم doctorId فضل زي ما
  // هو إجباري عشان متكسرش أي كود قديم بيعتمد عليه، وده اختياري بديل جنبه.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Hospital' })
  hospitalId?: Types.ObjectId;
}

export const notificationSchema = SchemaFactory.createForClass(Notification);
