import { IsString, IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCreditHistoryDto {
    @IsOptional()
    @IsString()
    organisation_id_or_slug?: string;

    @IsOptional()
    @IsNumber()
    change_amount?: number;

    @IsOptional()
    @IsString()
    change_type?: string;

    @IsOptional()
    @IsString()
    change_field?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    prev_value?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    new_value?: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_deleted?: number;
}