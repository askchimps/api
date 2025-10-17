import {
    Controller,
    Get,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { type AuthRequest } from 'types/auth-request';
import { Role } from 'decorators/role.decorator';
import { ROLE } from '@prisma/client';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller({
    path: 'agent',
    version: '1',
})
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    // @Role(ROLE.SUPER_ADMIN)
    // @Get('all')
    // async getAll() {
    //     return this.agentService.getAll();
    // }

    // @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    // @Get(':org_id_or_slug/:id_or_slug')
    // async getOne(
    //     @Req() req: AuthRequest,
    //     @Param('org_id_or_slug') orgIdOrSlug: string,
    //     @Param('id_or_slug') idOrSlug: string,
    // ) {
    //     return this.agentService.getOne(req.user, orgIdOrSlug, idOrSlug);
    // }

    // @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    // @Get(':org_id/:id_or_slug/conversations')
    // async getAllConversations(
    //     @Req() req: AuthRequest,
    //     @Param('org_id') orgId: string,
    //     @Param('id_or_slug') idOrSlug: string,
    // ) {
    //     return this.agentService.getAllConversations(req.user, Number(orgId), idOrSlug);
    // }

    // @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    // @Get(':org_id/:id_or_slug/leads')
    // async getAllLeads(
    //     @Req() req: AuthRequest,
    //     @Param('org_id') orgId: string,
    //     @Param('id_or_slug') idOrSlug: string,
    // ) {
    //     return this.agentService.getAllLeads(req.user, Number(orgId), idOrSlug);
    // }

    // @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    // @Get(':org_id/:id/analytics')
    // async getAnalytics(
    //     @Req() req: AuthRequest,
    //     @Param('org_id') orgId: string,
    //     @Param('id') id: string,
    //     @Query('startDate') startDate?: string,
    //     @Query('endDate') endDate?: string,
    // ) {
    //     const parsedStartDate = startDate ? new Date(startDate) : undefined;
    //     const parsedEndDate = endDate ? new Date(endDate) : undefined;
        
    //     return this.agentService.getAnalytics(
    //         req.user,
    //         Number(orgId),
    //         Number(id),
    //         parsedStartDate,
    //         parsedEndDate
    //     );
    // }
}