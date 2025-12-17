import { IsString, IsOptional, IsInt, IsNumber, IsDateString, IsIn, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CALL_SOURCE, COST_TYPE } from '@prisma/public-client';

export class UpdateMessageDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    id?: number;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    created_at?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    prompt_tokens?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    completion_tokens?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    total_cost?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_deleted?: number;
}

export class UpdateCostDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    id?: number;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(COST_TYPE))
    type?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount?: number;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    message_id?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_deleted?: number;
}

export class UpdateCallDto {
    @IsOptional()
    @IsString()
    organisation?: string;

    @IsOptional()
    @IsString()
    agent?: string;

    @IsOptional()
    @IsString()
    lead?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(CALL_SOURCE))
    source?: string;

    @IsOptional()
    @IsString()
    direction?: string;

    @IsOptional()
    @IsString()
    from_number?: string;

    @IsOptional()
    @IsString()
    to_number?: string;

    @IsOptional()
    @IsDateString()
    started_at?: string;

    @IsOptional()
    @IsDateString()
    ended_at?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    duration?: number;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    analysis?: string;

    @IsOptional()
    @IsString()
    recording_url?: string;

    @IsOptional()
    @IsString()
    call_ended_reason?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    total_cost?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateMessageDto)
    messages?: UpdateMessageDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateCostDto)
    costs?: UpdateCostDto[];

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_deleted?: number;
}