import { User } from '@models/common/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

/* فرد أسرة */
class FamilyMember {
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String, required: true })
  phoneNumber: string;
}

@Schema({ timestamps: true, discriminatorKey: 'role' })
export class Patient extends User {
  @Prop({ type: String, required: true })
  firstName: string;
  @Prop({ type: String, required: true })
  lastName: string;
  @Prop({ type: String, required: true })
  phoneNumber: string;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Doctor', required: false })
  createdBy?: Types.ObjectId;
  @Prop({ type: Boolean, default: false })
  isFamily: boolean;
  @Prop({ type: [{ name: String, phoneNumber: String }], default: [] })
  familyMembers: FamilyMember[];
}

export const patientSchema = SchemaFactory.createForClass(Patient);
