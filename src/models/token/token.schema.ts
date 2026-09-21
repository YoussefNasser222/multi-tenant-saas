import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({timestamps: true})
export class Token {
    @Prop({type : SchemaTypes.ObjectId , ref : "User" , required : true})
    userId : Types.ObjectId;

    @Prop({type : String , required : true})
    refreshToken : string

    // بيتمسح تلقائيًا من الداتابيز أول ما تعدي المدة دي — بديل عن deleteMany
    // اللي كنا بنعمله وقت اللوجن (اللي كان بيقفل جلسات تانية بالغلط)
    @Prop({type : Date , required : true , expires : 0})
    expiresAt : Date
}

export const tokenSchema = SchemaFactory.createForClass(Token)