import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsDateString,
} from 'class-validator';

export class GetPriorityLeadsDto {
  @IsOptional()
  @IsString()
  organisation?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50; // Default to top 50 priority leads

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsDateString()
  nextFollowUpStart?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpEnd?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  is_indian?: number; // 0 for international, 1 for indian

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  in_process?: number; // 0 for not in process, 1 for in process, undefined for both
}

export interface ProcessedPriorityLeadFilters {
  organisation_slug?: string;
  limit: number;
  page: number;
  nextFollowUpStart?: Date;
  nextFollowUpEnd?: Date;
  is_indian?: number;
  in_process?: number;
}
