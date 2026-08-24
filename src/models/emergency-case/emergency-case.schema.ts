import { ImageType } from '@models/doctor/doctor.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
export enum EmergencyStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
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
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Hospital'})
  claimedByHospitalIds: Types.ObjectId[];
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const emergencyCaseSchema = SchemaFactory.createForClass(EmergencyCase)
