import { Controller, Get, Post, Put, Delete, UseGuards, Param, Query, Body } from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { CreditHistoryService } from './credit-history.service';
import {
    CreateSingleCreditHistoryDto,
    CreateBulkCreditHistoryDto,
    UpdateCreditHistoryDto,
    GetCreditHistoryQueryDto,
    CreditHistoryParamDto
} from './dto';

@Controller({
    path: 'credit-history',
    version: '1',
})
@UseGuards(HeaderAuthGuard)
export class CreditHistoryController {
    constructor(private readonly creditHistoryService: CreditHistoryService) { }

    @Get()
    async getAllCreditHistory(
        @Query() query: GetCreditHistoryQueryDto
    ) {
        return this.creditHistoryService.getAllCreditHistory({
            page: query.page || 1,
            limit: query.limit || 1000,
            org: query.org,
            change_type: query.change_type,
            change_field: query.change_field,
            start_date: query.start_date,
            end_date: query.end_date
        });
    }

    @Get(':id')
    async getCreditHistoryById(
        @Param() params: CreditHistoryParamDto
    ) {
        return this.creditHistoryService.getCreditHistoryById(parseInt(params.id));
    }

    @Post('single')
    async createSingleCreditHistory(
        @Body() createCreditHistoryDto: CreateSingleCreditHistoryDto
    ) {
        return this.creditHistoryService.createSingleCreditHistory(createCreditHistoryDto);
    }

    @Post('bulk')
    async createBulkCreditHistory(
        @Body() createBulkCreditHistoryDto: CreateBulkCreditHistoryDto
    ) {
        return this.creditHistoryService.createBulkCreditHistory(createBulkCreditHistoryDto);
    }

    @Put(':id')
    async updateCreditHistory(
        @Param() params: CreditHistoryParamDto,
        @Body() updateCreditHistoryDto: UpdateCreditHistoryDto
    ) {
        return this.creditHistoryService.updateCreditHistory(parseInt(params.id), updateCreditHistoryDto);
    }

    @Delete(':id')
    async deleteCreditHistory(
        @Param() params: CreditHistoryParamDto
    ) {
        return this.creditHistoryService.deleteCreditHistory(parseInt(params.id));
    }
}