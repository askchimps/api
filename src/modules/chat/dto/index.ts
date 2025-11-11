import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGE_TYPE, CHAT_SOURCE } from '@prisma/client';

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

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  organisation: string; // Can be organisation slug or ID

  @IsNotEmpty()
  @IsString()
  agent: string; // Can be agent slug or ID

  @IsOptional()
  @IsString()
  lead?: string; // Can be lead phone number or ID (optional)

  @IsNotEmpty()
  @IsEnum(CHAT_SOURCE)
  source: CHAT_SOURCE;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  instagram_id?: string; // Unique Instagram chat identifier

  @IsOptional()
  @IsString()
  whatsapp_id?: string; // Unique WhatsApp chat identifier

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  human_handled?: number; // 0 or 1 to indicate if human handled
}

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  organisation: string;

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
  organisation: string;

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

  @IsNotEmpty()
  @IsString()
  org: string;
}

export class UpdateChatDto {
  @IsNotEmpty()
  @IsString()
  organisation: string; // Can be organisation slug or ID

  @IsOptional()
  @IsString()
  lead?: string; // Can be lead phone number or ID

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  instagram_id?: string; // Unique Instagram chat identifier

  @IsOptional()
  @IsString()
  whatsapp_id?: string; // Unique WhatsApp chat identifier

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  human_handled?: number; // 0 or 1 to indicate if human handled

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  unread_messages?: number; // Count of unread messages
}