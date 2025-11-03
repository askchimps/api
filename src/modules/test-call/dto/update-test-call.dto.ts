import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTestCallDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsUrl()
  recording_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  call_duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_cost?: number;
}