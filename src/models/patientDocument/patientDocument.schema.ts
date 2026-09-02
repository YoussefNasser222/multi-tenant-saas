import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PatientDocument {
  readonly _id: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;
  @Prop({ type: String })
  fileUrl?: string;
  @Prop({ type: String })
  publicId?: string;
  @Prop({ type: String })
  fileName?: string;
  /* دكتور مستهدف */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor' })
  targetDoctorId?: Types.ObjectId;
  /* ملاحظات المريض */
  @Prop({ type: String })
  patientNotes?: string;
  /* تحليل AI */
  @Prop({ type: String })
  aiAnalysis?: string;
  /* فرد الأسرة */
  @Prop({ type: String })
  familyMemberName?: string;
}

export const patientDocumentSchema = SchemaFactory.createForClass(PatientDocument);
