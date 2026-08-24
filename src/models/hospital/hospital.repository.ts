import { AbstractRepository } from "@models/abstraction.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Hospital } from "./hospital.schema";
@Injectable()
export class HospitalRepository extends AbstractRepository<Hospital> {
    constructor(@InjectModel(Hospital.name) private readonly hospitalModel: Model<Hospital>) {
        super(hospitalModel);
    }
}