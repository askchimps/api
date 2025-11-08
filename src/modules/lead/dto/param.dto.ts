import { IsString, IsNotEmpty } from 'class-validator';

export class LeadParamDto {
    @IsNotEmpty()
    @IsString()
    id_or_phone: string;
}