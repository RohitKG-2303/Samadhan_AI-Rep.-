import { IsString, IsOptional, IsNumber } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
