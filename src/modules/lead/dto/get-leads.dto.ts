import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEmail,
  IsJSON,
} from 'class-validator';

export class GetLeadsDto {
  @IsOptional()
  @IsString()
  organisation?: string;

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
  status?: string;

  @IsOptional()
  @IsString()
  agent?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in name, email, phone_number

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  is_indian?: number;

  @IsOptional()
  @IsDateString()
  nextFollowUpStart?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpEnd?: string;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  hasFollowUp?: number; // 1 for leads with follow_up, 0 for leads without

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  in_process?: number; // 0 for not in process, 1 for in process

  @IsOptional()
  @IsString()
  zoho_status?: string; // Filter by Zoho status

  @IsOptional()
  @IsString()
  zoho_lead_owner?: string; // Filter by Zoho lead owner

  @IsOptional()
  @IsString()
  zoho_lead_source?: string; // Filter by Zoho lead source
}

export interface ProcessedLeadFilters {
  page: number;
  limit: number;
  source?: string;
  status?: string;
  agent_slug_or_id?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  is_indian?: number;
  nextFollowUpStart?: Date;
  nextFollowUpEnd?: Date;
  hasFollowUp?: number;
  in_process?: number;
  organisationSlug?: string;
  zoho_status?: string;
  zoho_lead_owner?: string;
  zoho_lead_source?: string;
}
