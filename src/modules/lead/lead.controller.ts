import { Controller, Get, Post, Put, Delete, UseGuards, Req, Param, Query, Body } from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { LeadService } from './lead.service';
import { 
    CreateLeadDto, 
    UpdateLeadDto, 
    GetLeadsQueryDto, 
    GetLeadCallsQueryDto, 
    GetLeadChatsQueryDto, 
    LeadParamDto 
} from './dto';

@Controller({
    path: 'lead',
    version: '1',
})
@UseGuards(HeaderAuthGuard)
export class LeadController {
    constructor(private readonly leadService: LeadService) { }

    @Get()
    async getAllLeads(
        @Query() query: GetLeadsQueryDto
    ) {
        return this.leadService.getAllLeads({
            page: query.page || 1,
            limit: query.limit || 1000,
            status: query.status,
            source: query.source,
            is_indian: query.is_indian,
            start_date: query.start_date,
            end_date: query.end_date
        });
    }

    @Get(':id_or_phone')
    async getLeadById(
        @Param() params: LeadParamDto
    ) {
        return this.leadService.getOne(params.id_or_phone);
    }

    @Post()
    async createLead(
        @Body() createLeadDto: CreateLeadDto
    ) {
        return this.leadService.createLead(createLeadDto);
    }

    @Put(':id_or_phone')
    async updateLead(
        @Param() params: LeadParamDto,
        @Body() updateLeadDto: UpdateLeadDto
    ) {
        return this.leadService.updateOne(params.id_or_phone, updateLeadDto);
    }

    @Delete(':id_or_phone')
    async deleteLead(
        @Param() params: LeadParamDto
    ) {
        return this.leadService.deleteOne(params.id_or_phone);
    }

    @Get(':id_or_phone/calls')
    async getLeadCalls(
        @Param() params: LeadParamDto,
        @Query() query: GetLeadCallsQueryDto
    ) {
        return this.leadService.getCallsOne(params.id_or_phone, {
            page: query.page || 1,
            limit: query.limit || 1000,
            status: query.status,
            direction: query.direction
        });
    }

    @Get(':id_or_phone/chats')
    async getLeadChats(
        @Param() params: LeadParamDto,
        @Query() query: GetLeadChatsQueryDto
    ) {
        return this.leadService.getChatsOne(params.id_or_phone, {
            page: query.page || 1,
            limit: query.limit || 1000,
            status: query.status,
            source: query.source
        });
    }
}