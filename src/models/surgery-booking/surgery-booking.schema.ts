import { ImageType } from '@models/doctor/doctor.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export enum SurgeryBookingStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum AccepterRole {
  Doctor = 'Doctor',
  Hospital = 'Hospital',
}

/** تسجيل "مشاهدة" بدون تفاعل — دكتور أو مستشفى فتح التفاصيل بس. */
@Schema({ _id: false })
export class BookingViewer {
  @Prop({ type: String, enum: AccepterRole, required: true })
  role: AccepterRole;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  id: Types.ObjectId;
}
export const bookingViewerSchema = SchemaFactory.createForClass(BookingViewer);

@Schema({ timestamps: true })
export class SurgeryBooking {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;
  @Prop({ type: String, required: true })
  title: string;
  @Prop({ type: String })
  description?: string;
  @Prop({ type: [ImageType], default: [] })
  reports: ImageType[];
  @Prop({ type: String, required: true, unique: true, index: true })
  bookingCode: string;
  @Prop({ type: String, enum: SurgeryBookingStatus, default: SurgeryBookingStatus.Pending })
  status: SurgeryBookingStatus;
  @Prop({ type: [bookingViewerSchema], default: [] })
  viewedBy: BookingViewer[];
  // refPath: Mongoose هيعرف يعمل populate من كولكشن Doctor أو Hospital حسب
  // قيمة acceptedByRole تلقائيًا
  @Prop({ type: String, enum: AccepterRole })
  acceptedByRole?: AccepterRole;
  @Prop({ type: SchemaTypes.ObjectId, refPath: 'acceptedByRole' })
  acceptedById?: Types.ObjectId;
}

export const surgeryBookingSchema = SchemaFactory.createForClass(SurgeryBooking);
