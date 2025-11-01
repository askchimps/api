import { IsInt, IsString, IsOptional, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePaymentDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    amount?: number;

    @IsOptional()
    @IsString()
    @Length(1, 10)
    currency?: string;

    @IsOptional()
    @IsString()
    @Length(1, 1000)
    details?: string;
}