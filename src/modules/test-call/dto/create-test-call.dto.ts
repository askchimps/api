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

export class CreateTestCallCostDto {
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
  @IsString()
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
  @Type(() => CreateTestCallCostDto)
  costs?: CreateTestCallCostDto[];
}