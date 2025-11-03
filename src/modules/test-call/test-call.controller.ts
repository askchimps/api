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
import { TestCallService } from './test-call.service';
import { CreateTestCallDto } from './dto/create-test-call.dto';
import { UpdateTestCallDto } from './dto/update-test-call.dto';
import { GetTestCallsQueryDto } from './dto/get-test-calls.dto';
import { HeaderAuthGuard } from '@guards/header-auth.guard';

@Controller({
  path: 'test-call',
  version: '1',
})
@UseGuards(HeaderAuthGuard)
export class TestCallController {
  constructor(private readonly testCallService: TestCallService) {}

  @Post()
  async create(@Body() createTestCallDto: CreateTestCallDto) {
    return this.testCallService.create(createTestCallDto);
  }

  @Get()
  async findAll(@Query() query: GetTestCallsQueryDto) {
    return this.testCallService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.testCallService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTestCallDto: UpdateTestCallDto,
  ) {
    return this.testCallService.update(id, updateTestCallDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.testCallService.remove(id);
  }
}