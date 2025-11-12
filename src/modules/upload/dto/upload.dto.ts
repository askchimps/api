import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  category: 'image' | 'video' | 'audio' | 'document';

  @IsOptional()
  @IsString()
  description?: string;
}

export class FileUploadResult {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
  whatsapp_compatible?: boolean;
  whatsapp_warnings?: string[];
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  destination: string;
}