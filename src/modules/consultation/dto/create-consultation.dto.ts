import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsultationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  question?: string;
}
