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
import {
  GetPriorityLeadsDto,
  ProcessedPriorityLeadFilters,
} from './dto/get-priority-leads.dto';
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
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  @Get()
  async findAll(@Query() query: GetLeadsDto) {
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
      nextFollowUpStart: query.nextFollowUpStart
        ? new Date(query.nextFollowUpStart)
        : undefined,
      nextFollowUpEnd: query.nextFollowUpEnd
        ? new Date(query.nextFollowUpEnd)
        : undefined,
      hasFollowUp: query.hasFollowUp,
      in_process: query.in_process,
      zoho_status: query.zoho_status,
      zoho_lead_owner: query.zoho_lead_owner,
      zoho_lead_source: query.zoho_lead_source,
    };

    return this.leadService.findAll(filters, query.organisation);
  }

  @Get('all')
  @Public()
  async findAllLeads(@Query() query: GetLeadsDto) {
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
      nextFollowUpStart: query.nextFollowUpStart
        ? new Date(query.nextFollowUpStart)
        : undefined,
      nextFollowUpEnd: query.nextFollowUpEnd
        ? new Date(query.nextFollowUpEnd)
        : undefined,
      hasFollowUp: query.hasFollowUp,
      in_process: query.in_process,
      organisationSlug: query.organisation,
      zoho_status: query.zoho_status,
      zoho_lead_owner: query.zoho_lead_owner,
      zoho_lead_source: query.zoho_lead_source,
    };

    return this.leadService.findAllLeads(filters);
  }

  @Get('priority')
  async getPriorityLeads(@Query() query: GetPriorityLeadsDto) {
    const filters: ProcessedPriorityLeadFilters = {
      page: query.page || 1,
      limit: query.limit || 10,
      organisation_slug: query.organisation,
      nextFollowUpStart: query.nextFollowUpStart
        ? new Date(query.nextFollowUpStart)
        : undefined,
      nextFollowUpEnd: query.nextFollowUpEnd
        ? new Date(query.nextFollowUpEnd)
        : undefined,
      is_indian: query.is_indian,
      in_process: query.in_process,
    };

    return this.leadService.getPriorityLeads(filters);
  }

  @Get(':id_or_phone')
  async findOne(
    @Param('id_or_phone') idOrPhone: string,
    @Query('organisation') organisation?: string,
  ) {
    return this.leadService.findOneByIdOrPhone(idOrPhone, organisation);
  }

  @Patch(':id_or_phone')
  async update(
    @Param('id_or_phone') idOrPhone: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Query('organisation') organisation?: string,
  ) {
    return this.leadService.updateByIdOrPhone(
      idOrPhone,
      updateLeadDto,
      organisation,
    );
  }

  @Delete(':id_or_phone')
  async remove(
    @Param('id_or_phone') idOrPhone: string,
    @Query('organisation') organisation?: string,
  ) {
    return this.leadService.removeByIdOrPhone(idOrPhone, organisation);
  }

  @Patch(':id_or_phone/mark-process')
  async markInProcess(
    @Param('id_or_phone') idOrPhone: string,
    @Query('organisation') organisation?: string,
  ) {
    return this.leadService.markInProcessByIdOrPhone(idOrPhone, organisation);
  }

  @Patch(':id_or_phone/unmark-process')
  async unmarkInProcess(
    @Param('id_or_phone') idOrPhone: string,
    @Query('organisation') organisation?: string,
  ) {
    return this.leadService.unmarkInProcessByIdOrPhone(idOrPhone, organisation);
  }
}
