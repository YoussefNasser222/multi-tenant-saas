import { AbstractRepository } from "@models/abstraction.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Consultation } from "./consultation.schema";

@Injectable()
export class ConsultationRepository extends AbstractRepository<Consultation> {
    constructor(@InjectModel(Consultation.name) private readonly consultationModel: Model<Consultation>) {
        super(consultationModel);
    }
}
