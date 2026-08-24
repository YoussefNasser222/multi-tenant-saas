import { Injectable } from "@nestjs/common";
import { CreateEmergencyCaseDto } from "../dto/create-emergency-case.dto";
import { EmergencyCase } from "../entities/emergency-case.entity";
import { generateOtp } from "@common/helpers";
import { EmergencyStatus } from "@models/index";
import { randomBytes } from "crypto";

@Injectable()
export class EmergencyCaseFactory {
    create(dto : CreateEmergencyCaseDto){
        const emergencyCase = new EmergencyCase();
        emergencyCase.phoneNumber = dto.phoneNumber
        emergencyCase.notes = dto.notes || ""
        emergencyCase.caseCode = randomBytes(4).toString('hex').toUpperCase()
        emergencyCase.expiresAt = new Date(Date.now() +  6 * 60 * 60 * 1000) 
        emergencyCase.status = EmergencyStatus.OPEN
        return emergencyCase
    }
}