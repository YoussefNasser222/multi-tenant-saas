import { AbstractRepository } from '@models/abstraction.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmergencyCase } from './emergency-case.schema';
@Injectable()
export class EmergencyCaseRepository extends AbstractRepository<EmergencyCase> {
  constructor(
    @InjectModel(EmergencyCase.name)
    private readonly emergencyCaseModel: Model<EmergencyCase>,
  ) {
    super(emergencyCaseModel);
  }
}
