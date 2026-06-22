import { IsString } from 'class-validator';

export class AnalyzeSignalDto {
  @IsString()
  projectId: string;

  @IsString()
  fromUnit: string;

  @IsString()
  toUnit: string;
}
