import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { COST_TYPE } from '@prisma/client';

export class UpdateTestCallCostDto {
  @IsEnum(COST_TYPE)
  type: COST_TYPE;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  summary?: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTestCallCostDto)
  costs?: UpdateTestCallCostDto[];
}