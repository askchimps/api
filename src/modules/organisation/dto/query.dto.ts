import { IsString, IsOptional, IsISO8601, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}

export class DateRangeQueryDto {
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    endDate?: string;
}

export class ChatsQueryDto extends DateRangeQueryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}

export class CallsQueryDto {
    @IsOptional()
    @IsISO8601()
    start_date?: string;

    @IsOptional()
    @IsISO8601()
    end_date?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsIn(['inbound', 'outbound'])
    direction?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}

export class LeadsQueryDto {
    @IsOptional()
    @IsISO8601()
    start_date?: string;

    @IsOptional()
    @IsISO8601()
    end_date?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    zoho_status?: string;

    @IsOptional()
    @IsString()
    zoho_lead_owner?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    is_indian?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}

export class PriorityLeadsQueryDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}