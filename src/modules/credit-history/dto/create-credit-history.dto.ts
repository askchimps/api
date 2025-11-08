import { IsString, IsNumber, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditHistoryEntryDto {
    @IsNumber()
    change_amount: number;

    @IsString()
    change_type: string;

    @IsString()
    change_field: string;

    @IsNumber()
    @Min(0)
    prev_value: number;

    @IsNumber()
    @Min(0)
    new_value: number;

    @IsString()
    reason: string;
}

export class CreateSingleCreditHistoryDto extends CreateCreditHistoryEntryDto {
    @IsString()
    org: string;
}

export class CreateBulkCreditHistoryDto {
    @IsString()
    org: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCreditHistoryEntryDto)
    entries: CreateCreditHistoryEntryDto[];
}