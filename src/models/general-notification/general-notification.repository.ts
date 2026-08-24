
import { AbstractRepository } from "@models/abstraction.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GeneralNotification } from "./general-notification.schema";
@Injectable()
export class GeneralNotificationRepository extends AbstractRepository<GeneralNotification> {
    constructor(@InjectModel(GeneralNotification.name) private readonly generalNotificationModel: Model<GeneralNotification>) {
        super(generalNotificationModel);
    }
}