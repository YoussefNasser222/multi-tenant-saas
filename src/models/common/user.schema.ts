import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum Role {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Patient = 'Patient',
  Hospital = 'Hospital',
}

@Schema({ timestamps: true, discriminatorKey: 'role' })
export class User {
  readonly _id: Types.ObjectId;
  @Prop({ type: String, required: true })
  password: string;
  @Prop({ type: String, required: true })
  email: string;
  role: Role;
  @Prop({ type: String })
  otp: string;
  @Prop({ type: Date })
  otpExpired: Date;
  @Prop({ type: String, required: true, unique: true, index: true })
  nationalId: string;
}

export const userSchema = SchemaFactory.createForClass(User);
