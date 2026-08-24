import { PartialType } from '@nestjs/mapped-types';
import { CreateEmergencyCaseDto } from './create-emergency-case.dto';

export class UpdateEmergencyCaseDto extends PartialType(CreateEmergencyCaseDto) {}
