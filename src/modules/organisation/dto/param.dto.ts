import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrganisationParamDto {
    @IsString()
    id_or_slug: string;
}

export class OrganisationDetailsParamDto extends OrganisationParamDto {
    @Transform(({ value }) => parseInt(value, 10))
    id: number;
}

export class OrganisationLeadDetailsParamDto extends OrganisationParamDto {
    @IsString()
    id_or_phone: string;
}

export class AgentsPaginationQueryDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 1000;
}