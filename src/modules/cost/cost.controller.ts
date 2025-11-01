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
import { CostService } from './cost.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { GetCostsQueryDto } from './dto/get-costs.dto';
import { HeaderAuthGuard } from '@guards/header-auth.guard';

@Controller({
    path: 'cost',
    version: '1',
})
@UseGuards(HeaderAuthGuard)
export class CostController {
    constructor(private readonly costService: CostService) { }

    @Post()
    async create(@Body() createCostDto: CreateCostDto) {
        return this.costService.create(createCostDto);
    }

    @Get()
    async findAll(@Query() query: GetCostsQueryDto) {
        return this.costService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.costService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCostDto: UpdateCostDto,
    ) {
        return this.costService.update(id, updateCostDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.costService.remove(id);
    }
}