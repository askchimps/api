import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsEnum } from 'class-validator';
import { CONVERSATION_TYPE } from '@prisma/client';

export class GetConversationsDto {
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
    agent?: string;

    @IsOptional()
    @IsEnum(CONVERSATION_TYPE)
    type?: CONVERSATION_TYPE;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export interface ProcessedConversationFilters {
    page: number;
    limit: number;
    source?: string;
    agent_slug_or_id?: string;
    type?: CONVERSATION_TYPE;
    startDate?: Date;
    endDate?: Date;
}