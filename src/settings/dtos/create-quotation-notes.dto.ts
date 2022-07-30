import { IsString } from 'class-validator';

export class CreateQuotationNotesDto {
  @IsString()
  quotationNotes: string;
}