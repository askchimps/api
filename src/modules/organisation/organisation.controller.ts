import {
    Controller,
    Get,
    Param,
    Query,
    Req,
    UseGuards,
    Post,
    Patch,
} from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import type { AuthRequest } from 'types/auth-request';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { HeaderAuthGuard } from '@guards/header-auth.guard';
import { Role } from '@decorators/role.decorator';
import { ROLE } from '@prisma/client';
import { GetConversationsDto, ProcessedConversationFilters } from './dto/get-conversations.dto';
import { GetLeadsDto, ProcessedLeadFilters } from './dto/get-leads.dto';
import { GetAnalyticsDto, ProcessedAnalyticsFilters } from './dto/get-analytics.dto';

@Controller({
    path: 'organisation',
    version: '1',
})
export class OrganisationController {
    constructor(private readonly organisationService: OrganisationService) { }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Get('all')
    async getAll(@Req() req: AuthRequest) {
        return this.organisationService.getAll(req.user);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug')
    async getOne(@Req() req: AuthRequest, @Param('org_id_or_slug') org_id_or_slug: string) {
        return this.organisationService.getOne(req.user, org_id_or_slug);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/overview')
    async getOverview(
        @Req() req: AuthRequest, 
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const parsedStartDate = startDate ? new Date(startDate) : undefined;
        const parsedEndDate = endDate ? new Date(endDate) : undefined;
        
        return this.organisationService.getOverview(req.user, org_id_or_slug, parsedStartDate, parsedEndDate);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/conversations')
    async getAllConversations(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Query() queryParams: GetConversationsDto,
    ) {
        // Convert DTO to processed filters with proper date parsing
        const processedFilters: ProcessedConversationFilters = {
            page: queryParams.page ?? 1,
            limit: queryParams.limit ?? 10,
            source: queryParams.source,
            agent_slug_or_id: queryParams.agent,
            type: queryParams.type,
            startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
            endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
        };

        return this.organisationService.getAllConversations(
            req.user,
            org_id_or_slug,
            processedFilters
        );
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/conversations/:conversation_id_or_name')
    async getConversationDetails(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Param('conversation_id_or_name') conversation_id_or_name: string,
    ) {
        return this.organisationService.getConversationDetails(
            req.user,
            org_id_or_slug,
            conversation_id_or_name
        );
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/leads')
    async getAllLeads(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Query() queryParams: GetLeadsDto,
    ) {
        // Convert DTO to processed filters with proper date parsing
        const processedFilters: ProcessedLeadFilters = {
            page: queryParams.page ?? 1,
            limit: queryParams.limit ?? 10,
            source: queryParams.source,
            status: queryParams.status,
            agent_slug_or_id: queryParams.agent,
            search: queryParams.search,
            startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
            endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
        };

        return this.organisationService.getAllLeads(
            req.user,
            org_id_or_slug,
            processedFilters
        );
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id_or_slug/analytics')
    async getAnalytics(
        @Req() req: AuthRequest,
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Query() queryParams: GetAnalyticsDto,
    ) {
        // Convert DTO to processed filters with proper date parsing
        const processedFilters: ProcessedAnalyticsFilters = {
            agent_slug_or_id: queryParams.agent,
            source: queryParams.source,
            type: queryParams.type,
            startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
            endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
        };

        return this.organisationService.getAnalytics(
            req.user,
            org_id_or_slug,
            processedFilters,
        );
    }

    // @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    // @Get(':org_id_or_slug/agents')
    // async getAllAgents(
    //     @Req() req: AuthRequest,
    //     @Param('org_id_or_slug') org_id_or_slug: string,
    // ) {
    //     return this.organisationService.getAllAgents(req.user, org_id_or_slug);
    // }

    // Channel Management APIs - Header Auth Protected Only
    @UseGuards(HeaderAuthGuard)
    @Get(':org_id_or_slug/channels/available')
    async getAvailableChannels(@Param('org_id_or_slug') org_id_or_slug: string) {
        return this.organisationService.getAvailableChannels(org_id_or_slug);
    }

    @UseGuards(HeaderAuthGuard)
    @Post(':org_id_or_slug/calls/:call_type/increment')
    async incrementActiveCalls(
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Param('call_type') call_type: 'indian' | 'international'
    ) {
        return this.organisationService.incrementActiveCalls(org_id_or_slug, call_type);
    }

    @UseGuards(HeaderAuthGuard)
    @Post(':org_id_or_slug/calls/:call_type/decrement')
    async decrementActiveCalls(
        @Param('org_id_or_slug') org_id_or_slug: string,
        @Param('call_type') call_type: 'indian' | 'international'
    ) {
        return this.organisationService.decrementActiveCalls(org_id_or_slug, call_type);
    }
}