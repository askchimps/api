import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGE_TYPE } from '@prisma/client';

export class CreateAttachmentDto {
  @IsNotEmpty()
  @IsString()
  file_url: string;

  @IsNotEmpty()
  @IsString()
  file_name: string;

  @IsNotEmpty()
  @IsNumber()
  file_size: number;

  @IsNotEmpty()
  @IsString()
  file_type: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;
}

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'assistant', 'bot'])
  role: 'user' | 'assistant' | 'bot';

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  message_type?: MESSAGE_TYPE;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments?: CreateAttachmentDto[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  prompt_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  completion_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  total_cost?: number;
}

export class CreateMediaMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'assistant', 'bot'])
  role: 'user' | 'assistant' | 'bot';

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsEnum(MESSAGE_TYPE)
  message_type: MESSAGE_TYPE;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  prompt_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  completion_tokens?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  total_cost?: number;
}

export class ChatParamDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}