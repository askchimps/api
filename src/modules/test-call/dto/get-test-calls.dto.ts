import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetTestCallsQueryDto {
  @IsOptional()
  @IsString()
  organisation?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in first_name, last_name, phone_number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}