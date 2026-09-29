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
  // index (مش unique) عشان send-otp / reset-password بيدوروا بالإيميل
  @Prop({ type: String, required: true, index: true })
  email: string;
  role: Role;
  @Prop({ type: String })
  otp: string;
  @Prop({ type: Date })
  otpExpired: Date;
  // عداد محاولات الـ OTP الغلط + وقت القفل المؤقت بعد تجاوز الحد المسموح
  // حقول اختيارية (مش required) فمش هيأثر على أي document قديم موجود بالفعل
  @Prop({ type: Number, default: 0 })
  otpAttempts: number;
  @Prop({ type: Date })
  otpLockedUntil: Date;
  // قفل الحساب مؤقتًا بعد محاولات لوجن غلط متكررة (حقول اختيارية → مفيش تأثير على الداتا القديمة)
  @Prop({ type: Number, default: 0 })
  loginAttempts: number;
  @Prop({ type: Date })
  loginLockedUntil: Date;
  @Prop({ type: String, required: true, unique: true, index: true })
  nationalId: string;
}

export const userSchema = SchemaFactory.createForClass(User);