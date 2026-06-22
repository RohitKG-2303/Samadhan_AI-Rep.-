import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CompareDocumentsDto {
  @IsNumber()
  doc1Id: number;

  @IsNumber()
  doc2Id: number;

  @IsOptional()
  @IsString()
  highlightFormat?: string;
}
