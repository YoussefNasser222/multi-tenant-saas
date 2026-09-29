import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { SchemaTypes, Types } from 'mongoose';
@Schema({ _id: false })
export class WorkingDay {
  @Prop({ type: String, required: true })
  day: string;
  @Prop({ type: Date, required: true })
  from: Date;
  @Prop({ type: Date, required: true })
  to: Date;
}

export enum BookingType {
  QUEUE = 'queue',
  TIME = 'time',
}

/**
 * عدّاد أرقام الدور لكل يوم (date كـ YYYY-MM-DD)، بيتحدّث بعملية atomic واحدة ($inc)
 * عشان نمنع الـ race condition: قبل كده كنا بنعمل count() لحساب رقم الدور والتأكد من
 * الـ maxPatientsPerDay، وبعدين create() في نداء منفصل — لو طلبين وصلوا في نفس اللحظة
 * كانوا بياخدوا نفس رقم الدور وممكن الاتنين يعدّوا الحد الأقصى لليوم.
 */
@Schema({ _id: false })
export class DailyCounter {
  @Prop({ type: String, required: true })
  date: string;
  @Prop({ type: Number, required: true, default: 0 })
  count: number;
}

@Schema({ timestamps: true })
export class Clinic {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String })
  description?: string;
  @Prop({ type: String })
  phoneNumber: string;
  @Prop({ type: String, required: true })
  street: string;
  @Prop({ type: String })
  email: string;
  @Prop({ type: String, required: true })
  governorate: string;
  @Prop({ type: String, required: true })
  city: string;
  @Prop({ type: String, required: true })
  specialization: string;
  @Prop({ type: Number, required: true })
  consultationPrice: number;
  @Prop({ type: [WorkingDay] })
  workingDays: WorkingDay[];
  @Prop({ type: String })
  address: string;
  @Prop({ type: Boolean, default: true })
  isActive: boolean;
  @Prop({
    type: String,
    enum: BookingType,
    required: true,
    default: BookingType.QUEUE,
  })
  bookingType: BookingType;

  @Prop({ type: [Date], default: [] })
  blockedDates: Date[];

  @Prop({ type: Number, required: true, default: 20 })
  maxPatientsPerDay: number;

  // اختياري: افتراضيًا [] فمش هيأثر على أي clinic موجود بالفعل
  @Prop({ type: [DailyCounter], default: [] })
  dailyCounters: DailyCounter[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  followUpPrice: number;
}

export const clinicSchema = SchemaFactory.createForClass(Clinic);
