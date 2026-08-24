import { Role } from '@models/common/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export enum AudienceType {
  all = 'all',
  Doctor = 'Doctor',
  Patient = 'Patient',
  Hospital = 'Hospital',
}

@Schema({ timestamps: true })
export class GeneralNotification {
  readonly _id: Types.ObjectId;
  @Prop({ type: String, required: true })
  title: string;
  @Prop({ type: String, required: true })
  message: string;
  @Prop({ type: String, enum: AudienceType, required: true })
  audience: AudienceType;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
  @Prop({ type: String, enum: Role, required: true })
  createdByRole: Role;
}

export const GeneralNotificationSchema =
  SchemaFactory.createForClass(GeneralNotification);
