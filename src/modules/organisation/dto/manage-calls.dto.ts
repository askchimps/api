import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum CallType {
  INDIAN = 'indian',
  INTERNATIONAL = 'international',
}

export class ManageCallsDto {
  @IsOptional()
  @IsString()
  lead_id?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be at least 1' })
  amount?: number = 1;
}