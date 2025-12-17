import { Controller, Get, Post, Put, Delete, UseGuards, Param, Query, Body } from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { CallService } from './call.service';
import { CALL_SOURCE } from '@prisma/public-client';
import { 
    CreateCallDto, 
    UpdateCallDto, 
    GetCallsQueryDto, 
    CallParamDto 
} from './dto';

@Controller({
    path: 'call',
    version: '1',
})
@UseGuards(HeaderAuthGuard)
export class CallController {
    constructor(private readonly callService: CallService) { }

    @Get()
    async getAllCalls(
        @Query() query: GetCallsQueryDto
    ) {
        return this.callService.getAllCalls({
            page: query.page || 1,
            limit: query.limit || 1000,
            status: query.status,
            direction: query.direction,
            source: query.source,
            start_date: query.start_date,
            end_date: query.end_date,
            organisation_id: query.organisation_id,
            agent_id: query.agent_id,
            lead_id: query.lead_id
        });
    }

    @Get(':id')
    async getCallById(
        @Param() params: CallParamDto
    ) {
        return this.callService.getCallById(parseInt(params.id));
    }

    @Post()
    async createCall(
        @Body() createCallDto: CreateCallDto
    ) {
        return this.callService.createCall({
            ...createCallDto,
            source: createCallDto.source as CALL_SOURCE
        });
    }

    @Put(':id')
    async updateCall(
        @Param() params: CallParamDto,
        @Body() updateCallDto: UpdateCallDto
    ) {
        const updateData = {
            organisation: updateCallDto.organisation,
            agent: updateCallDto.agent,
            lead: updateCallDto.lead,
            status: updateCallDto.status,
            ...(updateCallDto.source && { source: updateCallDto.source as CALL_SOURCE }),
            direction: updateCallDto.direction,
            from_number: updateCallDto.from_number,
            to_number: updateCallDto.to_number,
            started_at: updateCallDto.started_at,
            ended_at: updateCallDto.ended_at,
            duration: updateCallDto.duration,
            summary: updateCallDto.summary,
            analysis: updateCallDto.analysis,
            recording_url: updateCallDto.recording_url,
            call_ended_reason: updateCallDto.call_ended_reason,
            total_cost: updateCallDto.total_cost,
            messages: updateCallDto.messages,
            costs: updateCallDto.costs,
            is_deleted: updateCallDto.is_deleted
        };

        return this.callService.updateCall(parseInt(params.id), updateData);
    }

    @Delete(':id')
    async deleteCall(
        @Param() params: CallParamDto
    ) {
        return this.callService.deleteCall(parseInt(params.id));
    }
}