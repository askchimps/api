import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLeadDto {
  @IsString()
  organisation_slug: string;

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
  @IsString()
  zoho_id?: string;

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
  is_indian?: number = 0;

  @IsOptional()
  additional_info?: any;

  @IsOptional()
  logs?: any;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  follow_ups?: number = 0;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  reschedule_count?: number = 0;

  @IsOptional()
  @IsDateString()
  next_follow_up?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  in_process?: number = 0;

  // Zoho fields
  @IsOptional()
  @IsString()
  zoho_lead_owner?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner_id?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner_first_name?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner_last_name?: string;

  @IsOptional()
  @IsString()
  zoho_lead_owner_phone?: string;

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
