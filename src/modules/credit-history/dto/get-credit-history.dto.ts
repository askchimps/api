import { IsOptional, IsInt, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCreditHistoryQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    organisation_id?: number;

    @IsOptional()
    @IsString()
    change_type?: string;

    @IsOptional()
    @IsString()
    change_field?: string;

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