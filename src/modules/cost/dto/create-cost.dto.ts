import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { COST_TYPE } from '@prisma/client';

export class CreateCostDto {
    @IsString()
    organisation: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    conversation_id?: number;

    @IsEnum(COST_TYPE)
    type: COST_TYPE;

    @IsNumber()
    @Type(() => Number)
    amount: number;

    @IsString()
    @IsOptional()
    summary?: string;
}