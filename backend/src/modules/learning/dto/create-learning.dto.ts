import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateLearningDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  issue?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsArray()
  keyTakeaways?: string[];
}
