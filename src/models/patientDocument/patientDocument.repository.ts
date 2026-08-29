import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from '../abstraction.repository';
import { PatientDocument } from './patientDocument.schema';

export class PatientDocumentRepository extends AbstractRepository<PatientDocument> {
  constructor(
    @InjectModel(PatientDocument.name)
    private readonly patientDocumentModel: Model<PatientDocument>,
  ) {
    super(patientDocumentModel);
  }
}
