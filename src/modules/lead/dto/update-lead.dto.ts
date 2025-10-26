import { IsString, IsOptional, IsEmail, IsInt, Min, Max, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLeadDto {
    @IsOptional()
    @IsString()
    agent_slug?: string;

    @IsOptional()
    @IsString()
    name?: string;

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
    is_indian?: number;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    remove_follow_up?: number;

    @IsOptional()
    additional_info?: any;

    @IsOptional()
    logs?: any;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    follow_ups?: number;

    // New fields for follow_ups operations
    @IsOptional()
    @IsIn(['increment', 'decrement'])
    follow_ups_operation?: 'increment' | 'decrement';

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(1)
    follow_ups_value?: number;

    @IsOptional()
    @IsDateString()
    next_follow_up?: string;

    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    in_process?: number;
}