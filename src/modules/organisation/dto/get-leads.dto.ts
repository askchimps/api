import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';

export class GetLeadsDto {
    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    agent?: string;

    @IsOptional()
    @IsString()
    search?: string; // Search in name, email, phone_number

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export interface ProcessedLeadFilters {
    page: number;
    limit: number;
    source?: string;
    status?: string;
    agent_slug_or_id?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
}