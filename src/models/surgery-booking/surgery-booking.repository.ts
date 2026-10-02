import { AbstractRepository } from "@models/abstraction.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SurgeryBooking } from "./surgery-booking.schema";

@Injectable()
export class SurgeryBookingRepository extends AbstractRepository<SurgeryBooking> {
    constructor(@InjectModel(SurgeryBooking.name) private readonly surgeryBookingModel: Model<SurgeryBooking>) {
        super(surgeryBookingModel);
    }
}
