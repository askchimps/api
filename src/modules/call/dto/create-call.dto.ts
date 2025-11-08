import { IsString, IsOptional, IsInt, IsNumber, IsDateString, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CALL_SOURCE, COST_TYPE } from '@prisma/client';

export class CreateMessageDto {
    @IsString()
    role: string;

    @IsString()
    content: string;
    
    @IsOptional()
    @IsString()
    created_at?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    prompt_tokens?: number = 0;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    completion_tokens?: number = 0;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    total_cost?: number;
}

export class CreateCostDto {
    @IsString()
    @IsIn(Object.values(COST_TYPE))
    type: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    message_id?: number;
}

export class CreateCallDto {
    @IsString()
    organisation: string;

    @IsString()
    agent: string;

    @IsString()
    lead: string;

    @IsString()
    status: string;

    @IsString()
    @IsIn(Object.values(CALL_SOURCE))
    source: string;

    @IsString()
    direction: string;

    @IsString()
    from_number: string;

    @IsString()
    to_number: string;

    @IsDateString()
    started_at: string;

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
    @Type(() => CreateMessageDto)
    messages?: CreateMessageDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCostDto)
    costs?: CreateCostDto[];
}