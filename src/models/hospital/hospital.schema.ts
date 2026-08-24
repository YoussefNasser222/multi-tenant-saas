import { User } from "@models/common/user.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({timestamps : true , discriminatorKey : 'role'})

export class Hospital extends User {
    @Prop({type : String , required : true , trim : true})
    hospitalName : string;
    @Prop({type : String , required : true})
    phoneNumber : string;
    @Prop({type : String , required : true})
    address : string
    @Prop({type : String , required : true})
    governorate : string
    @Prop({type : String , required : true})
    city : string  
    @Prop({type : Boolean , default : false})
    isPaid : boolean;
    @Prop({type : Date})
    paidExpired : Date
}

export const hospitalSchema = SchemaFactory.createForClass(Hospital);