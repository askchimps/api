import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'assistant', 'bot'])
  role: 'user' | 'assistant' | 'bot';

  @IsNotEmpty()
  @IsString()
  content: string;

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