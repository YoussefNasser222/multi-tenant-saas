import { Types } from 'mongoose';

export class Doctor {
  readonly _id: Types.ObjectId;
  nationalId: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber: string;
  isPaid: boolean;
  paidExpired: Date;
  otp: string;
  otpExpired: Date;
  clinicId?: Types.ObjectId;
}

export class Patient {
  readonly _id: Types.ObjectId;
  nationalId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  otp: string;
  otpExpired: Date;
  createdBy?: Types.ObjectId;
  isFamily?: boolean;
  familyMembers?: { name: string; phoneNumber: string }[];
}

export class Hospital {
  readonly _id: Types.ObjectId;
  nationalId: string;
  email: string;
  password: string;
  hospitalName: string;
  phoneNumber: string;
  address: string;
  governorate: string;
  city: string;
  isPaid: boolean;
  paidExpired: Date;
  otp: string;
  otpExpired: Date;
}
