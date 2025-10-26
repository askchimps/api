import { IsString, IsOptional, IsEmail, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLeadDto {
    @IsString()
    organisation_slug: string;

    @IsOptional()
    @IsString()
    agent_slug?: string;

    @IsString()
    name: string;

    @IsOptional()
    zoho_id?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    is_indian?: number = 0;

    @IsOptional()
    additional_info?: any;

    @IsOptional()
    logs?: any;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    follow_ups?: number = 0;

    @IsOptional()
    @IsDateString()
    next_follow_up?: string;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    in_process?: number = 0;
}