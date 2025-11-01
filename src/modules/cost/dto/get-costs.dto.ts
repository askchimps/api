import { IsOptional, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { COST_TYPE } from '@prisma/client';

export class GetCostsQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    organisation_id?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    conversation_id?: number;

    @IsOptional()
    @IsEnum(COST_TYPE)
    type?: COST_TYPE;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

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
    limit?: number = 20;
}