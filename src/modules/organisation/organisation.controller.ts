import {
    Controller,
    Get,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import type { AuthRequest } from 'types/auth-request';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { Role } from '@decorators/role.decorator';
import { ROLE } from '@prisma/client';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller({
    path: 'organisation',
    version: '1',
})
export class OrganisationController {
    constructor(private readonly organisationService: OrganisationService) { }

    @Get('all')
    async getAll(@Req() req: AuthRequest) {
        return this.organisationService.getAll(req.user);
    }

    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug')
    async getOne(@Req() req: AuthRequest, @Param('org_id_or_slug') org_id_or_slug: string) {
        return this.organisationService.getOne(req.user, org_id_or_slug);
    }

    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/agents')
    async getAllAgents(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
    ) {
        return this.organisationService.getAllAgents(req.user, org_id_or_slug);
    }

    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/usage')
    async getUsage(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const parsedStartDate = startDate ? new Date(startDate) : undefined;
        const parsedEndDate = endDate ? new Date(endDate) : undefined;

        return this.organisationService.getUsage(
            req.user,
            org_id_or_slug,
            parsedStartDate,
            parsedEndDate,
        );
    }
}