import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

export class SubmitFeedbackDto {
  @IsNumber()
  queryId: number;

  @IsNumber()
  rating: number;

  @IsBoolean()
  helpful: boolean;

  @IsOptional()
  @IsString()
  correction?: string;
}
