import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCostDto {
  @IsEnum(['STT', 'LLM', 'TTS', 'VAPI', 'MISC'])
  type: 'STT' | 'LLM' | 'TTS' | 'VAPI' | 'MISC';

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  created_at?: Date;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  prompt_tokens?: number = 0;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  completion_tokens?: number = 0;
}

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  organisation: string;

  @IsString()
  @IsNotEmpty()
  agent: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(['CHAT', 'CALL'])
  type?: 'CHAT' | 'CALL' = 'CHAT';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  source: string;

  @IsString()
  @IsOptional()
  lead?: string;

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

  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  prompt_tokens?: number = 0;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  completion_tokens?: number = 0;

  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_cost?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMessageDto)
  messages: CreateMessageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCostDto)
  costs?: CreateCostDto[];
}
