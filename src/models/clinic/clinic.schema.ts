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
    default: BookingType.TIME,
  })
  bookingType: BookingType;

  @Prop({ type: Number })
  slotDuration?: number;

  @Prop({ type: Number, required: true, default: 20 })
  maxPatientsPerDay: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  followUpPrice: number;
}

export const clinicSchema = SchemaFactory.createForClass(Clinic);
