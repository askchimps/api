import { IsString, IsOptional, IsInt, IsDateString, IsIn, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CALL_SOURCE } from '@prisma/public-client';

export class GetCallsQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 1000;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    direction?: string;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(CALL_SOURCE))
    source?: string;

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
    organisation_id?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    agent_id?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    lead_id?: number;
}

export class CallParamDto {
    @IsString()
    id: string;
}