import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTestCallDto {
  @IsString()
  organisation: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  phone_number: string;

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