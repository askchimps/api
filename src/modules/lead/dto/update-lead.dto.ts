import { IsString, IsOptional, IsArray, IsNumber, IsInt, Min, Max, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateZohoLeadOwnerDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}

export class UpdateZohoLeadDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsString()
    lead_owner_id?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @IsString()
    disposition?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    requires_human_action?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_handled_by_human?: number;
}

export class UpdateLeadDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
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

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    is_indian?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    follow_up_count?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    reschedule_count?: number;

    @IsOptional()
    @IsDateString()
    last_follow_up?: string;

    @IsOptional()
    @IsDateString()
    next_follow_up?: string;
    
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    remove_follow_up?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    call_active?: number;

    @IsOptional()
    @IsArray()
    organisations?: string[];

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateZohoLeadOwnerDto)
    zoho_lead_owner?: UpdateZohoLeadOwnerDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateZohoLeadDto)
    zoho_lead?: UpdateZohoLeadDto;
}