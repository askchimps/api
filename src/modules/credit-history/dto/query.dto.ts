import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCreditHistoryQueryDto {
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
    org?: string;

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
}

export class CreditHistoryParamDto {
    @IsString()
    id: string;
}