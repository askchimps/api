import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { COST_TYPE } from '@prisma/client';

export class UpdateCostDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  conversation_id?: number;

  @IsOptional()
  @IsEnum(COST_TYPE)
  type?: COST_TYPE;
}
