import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateLearningDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsArray()
  keyTakeaways?: string[];
}
