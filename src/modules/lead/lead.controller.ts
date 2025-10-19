import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { GetLeadsDto, ProcessedLeadFilters } from './dto/get-leads.dto';
import { GetPriorityLeadsDto, ProcessedPriorityLeadFilters } from './dto/get-priority-leads.dto';
import { HeaderAuthGuard } from '@guards/header-auth.guard';
import { Public } from '@decorators/public.decorator';

@UseGuards(HeaderAuthGuard)
@Controller({
    path: 'lead',
    version: '1',
})
export class LeadController {
    constructor(private readonly leadService: LeadService) {}

    @Post()
    async create(
        @Body() createLeadDto: CreateLeadDto,
    ) {
        return this.leadService.create(createLeadDto);
    }

    @Get()
    async findAll(
        @Query() query: GetLeadsDto,
    ) {
        const filters: ProcessedLeadFilters = {
            page: query.page || 1,
            limit: query.limit || 10,
            source: query.source,
            status: query.status,
            agent_slug_or_id: query.agent,
            search: query.search,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            is_indian: query.is_indian,
            nextFollowUpStart: query.nextFollowUpStart ? new Date(query.nextFollowUpStart) : undefined,
            nextFollowUpEnd: query.nextFollowUpEnd ? new Date(query.nextFollowUpEnd) : undefined,
            hasFollowUp: query.hasFollowUp,
            in_process: query.in_process,
        };

        return this.leadService.findAll(filters, query.organisation );
    }

    @Get('all')
    @Public()
    async findAllLeads(
        @Query() query: GetLeadsDto,
    ) {
        const filters: ProcessedLeadFilters = {
            page: query.page || 1,
            limit: query.limit || 10,
            source: query.source,
            status: query.status,
            agent_slug_or_id: query.agent,
            search: query.search,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            is_indian: query.is_indian,
            nextFollowUpStart: query.nextFollowUpStart ? new Date(query.nextFollowUpStart) : undefined,
            nextFollowUpEnd: query.nextFollowUpEnd ? new Date(query.nextFollowUpEnd) : undefined,
            hasFollowUp: query.hasFollowUp,
            in_process: query.in_process,
            organisationSlug: query.organisation,
        };

        return this.leadService.findAllLeads(filters);
    }

    @Get('priority')
    async getPriorityLeads(
        @Query() query: GetPriorityLeadsDto,
    ) {
        const filters: ProcessedPriorityLeadFilters = {
            page: query.page || 1,
            limit: query.limit || 10,
            organisation_slug: query.organisation,
            nextFollowUpStart: query.nextFollowUpStart ? new Date(query.nextFollowUpStart) : undefined,
            nextFollowUpEnd: query.nextFollowUpEnd ? new Date(query.nextFollowUpEnd) : undefined,
            is_indian: query.is_indian,
            in_process: query.in_process,
        };

        return this.leadService.getPriorityLeads(filters);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('organisation') organisation?: string,
    ) {
        return this.leadService.findOne(id, organisation);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateLeadDto: UpdateLeadDto,
        @Query('organisation') organisation?: string,
    ) {
        return this.leadService.update(id, updateLeadDto, organisation);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Query('organisation') organisation?: string,
    ) {
        return this.leadService.remove(id, organisation);
    }

    @Patch(':id/mark-process')
    async markInProcess(
        @Param('id', ParseIntPipe) id: number,
        @Query('organisation') organisation?: string,
    ) {
        return this.leadService.markInProcess(id, organisation);
    }

    @Patch(':id/unmark-process')
    async unmarkInProcess(
        @Param('id', ParseIntPipe) id: number,
        @Query('organisation') organisation?: string,
    ) {
        return this.leadService.unmarkInProcess(id, organisation);
    }
}