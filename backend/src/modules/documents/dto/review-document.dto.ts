import { IsNumber } from 'class-validator';

export class ReviewDocumentDto {
  @IsNumber()
  documentId: number;
}
