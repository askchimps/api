import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  agent_slug?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

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

  // Zoho fields
  @IsOptional()
  @IsString()
  zoho_id?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner_id?: string;

  @IsOptional()
  @IsString()
  zoho_first_name?: string;

  @IsOptional()
  @IsString()
  zoho_last_name?: string;

  @IsOptional()
  @IsString()
  zoho_mobile?: string;

  @IsOptional()
  @IsEmail()
  zoho_email?: string;

  @IsOptional()
  @IsString()
  zoho_status?: string;

  @IsOptional()
  @IsString()
  zoho_lead_disposition?: string;

  @IsOptional()
  @IsString()
  zoho_lead_source?: string;

  @IsOptional()
  @IsString()
  zoho_country?: string;

  @IsOptional()
  @IsString()
  zoho_state?: string;

  @IsOptional()
  @IsString()
  zoho_city?: string;

  @IsOptional()
  @IsString()
  zoho_street?: string;

  @IsOptional()
  @IsString()
  zoho_description?: string;
}
