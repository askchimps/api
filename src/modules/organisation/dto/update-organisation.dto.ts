import { IsString, IsOptional, IsNumber, Min, IsInt, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateOrganisationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    chat_credits?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    call_credits?: number;

    @IsOptional()
    @IsString()
    updated_by_user?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    active_indian_calls?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    active_international_calls?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    available_indian_channels?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    available_international_channels?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    expenses?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_disabled?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_deleted?: number;
}