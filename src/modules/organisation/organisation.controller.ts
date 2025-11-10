import { Controller, Get, Put, UseGuards, Req, Param, Query, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { OrganisationService } from './organisation.service';
import type { AuthRequest } from '../../types/auth-request';
import {
    DateRangeQueryDto,
    ChatsQueryDto,
    CallsQueryDto,
    LeadsQueryDto,
    PriorityLeadsQueryDto,
    UpdateOrganisationDto,
    OrganisationParamDto,
    OrganisationDetailsParamDto,
    OrganisationLeadDetailsParamDto,
    AgentsPaginationQueryDto
} from './dto';
import { HeaderAuthGuard } from '@guards/header-auth.guard';
import { RoleGuard } from '@guards/role.guard';

@Controller({
    path: 'organisation',
    version: '1',
})
export class OrganisationController {
    constructor(private readonly organisationService: OrganisationService) { }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Get()
    async getAllOrganisations(@Req() req: AuthRequest) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        const userId = req.user?.id;
        return this.organisationService.getAllOrganisations(isSuperAdmin, userId);
    }

    @UseGuards(HeaderAuthGuard)
    @Get(':id_or_slug')
    async getOrganisationDetails(
        @Param('id_or_slug') id_or_slug: string,
    ) {
        return this.organisationService.getOrganisationDetails(
            id_or_slug,
        );
    }

    @UseGuards(HeaderAuthGuard)
    @Put(':id_or_slug')
    async updateOrganisation(
        @Param() paramDto: OrganisationParamDto,
        @Body() updateOrganisationDto: UpdateOrganisationDto
    ) {
        return this.organisationService.updateOrganisation(
            paramDto.id_or_slug,
            updateOrganisationDto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/agents')
    async getOrganisationAgents(
        @Param() paramDto: OrganisationParamDto,
        @Req() req: AuthRequest,
        @Query() paginationDto: AgentsPaginationQueryDto
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getOrganisationAgents(
            paramDto.id_or_slug,
            {
                page: paginationDto.page || 1,
                limit: paginationDto.limit || 1000,
            },
            isSuperAdmin
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/overview')
    async getOrganisationOverview(
        @Param() paramDto: OrganisationParamDto,
        @Req() req: AuthRequest,
        @Query() dateRangeDto: DateRangeQueryDto
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getOrganisationOverview(
            paramDto.id_or_slug,
            dateRangeDto.startDate,
            dateRangeDto.endDate,
            isSuperAdmin
        );
    }

    @Get(':id_or_slug/chats')
    async getOrganisationChats(
        @Param() paramDto: OrganisationParamDto,
        @Req() req: AuthRequest,
        @Query() chatsQueryDto: ChatsQueryDto
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getOrganisationChats(
            paramDto.id_or_slug,
            {
                startDate: chatsQueryDto.startDate,
                endDate: chatsQueryDto.endDate,
                status: chatsQueryDto.status,
                source: chatsQueryDto.source,
                page: chatsQueryDto.page || 1,
                limit: chatsQueryDto.limit || 1000,
            },
            isSuperAdmin
        );
    }

    @UseGuards(HeaderAuthGuard)
    @Get(':id_or_slug/chat/:id')
    async getChatDetails(
        @Param('id_or_slug') id_or_slug: string,
        @Param('id') id: string,
        @Req() req: AuthRequest
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getChatDetails(
            id_or_slug,
            id,
            isSuperAdmin
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/calls')
    async getOrganisationCalls(
        @Param() paramDto: OrganisationParamDto,
        @Req() req: AuthRequest,
        @Query() callsQueryDto: CallsQueryDto
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getOrganisationCalls(
            paramDto.id_or_slug,
            {
                start_date: callsQueryDto.start_date,
                end_date: callsQueryDto.end_date,
                status: callsQueryDto.status,
                direction: callsQueryDto.direction,
                source: callsQueryDto.source,
                page: callsQueryDto.page || 1,
                limit: callsQueryDto.limit || 1000,
            },
            isSuperAdmin
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/call/:id')
    async getCallDetails(
        @Param('id_or_slug') id_or_slug: string,
        @Param('id') id: string,
        @Req() req: AuthRequest
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getCallDetails(
            id_or_slug,
            parseInt(id),
            isSuperAdmin
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/leads')
    async getOrganisationLeads(
        @Param() paramDto: OrganisationParamDto,
        @Req() req: AuthRequest,
        @Query() leadsQueryDto: LeadsQueryDto
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getOrganisationLeads(
            paramDto.id_or_slug,
            {
                start_date: leadsQueryDto.start_date,
                end_date: leadsQueryDto.end_date,
                status: leadsQueryDto.status,
                source: leadsQueryDto.source,
                is_indian: leadsQueryDto.is_indian,
                page: leadsQueryDto.page || 1,
                limit: leadsQueryDto.limit || 1000,
            },
            isSuperAdmin
        );
    }

    @UseGuards(HeaderAuthGuard)
    @Get(':id_or_slug/leads/priority')
    async getOrganisationPriorityLeads(
        @Param() paramDto: OrganisationParamDto,
        @Query() priorityQueryDto: PriorityLeadsQueryDto
    ) {
        return this.organisationService.getOrganisationPriorityLeads(
            paramDto.id_or_slug,
            priorityQueryDto.limit || 1000,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id_or_slug/lead/:id_or_phone')
    async getLeadDetails(
        @Param() paramDto: OrganisationLeadDetailsParamDto,
        @Req() req: AuthRequest
    ) {
        const isSuperAdmin = req.user?.is_super_admin === 1;
        return this.organisationService.getLeadDetails(
            paramDto.id_or_slug,
            paramDto.id_or_phone,
            isSuperAdmin
        );
    }
}