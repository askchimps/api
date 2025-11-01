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
    Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentsQueryDto } from './dto/get-payments.dto';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { Role } from '@decorators/role.decorator';
import { ROLE } from '@prisma/client';
import type { AuthRequest } from 'types/auth-request';

@Controller({
    path: 'payment',
    version: '1',
})
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(ROLE.ADMIN)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post()
    async create(@Req() req: AuthRequest, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentService.create(req.user, createPaymentDto);
    }

    @Get()
    async findAll(@Req() req: AuthRequest, @Query() query: GetPaymentsQueryDto) {
        return this.paymentService.findAll(req.user, query);
    }

    @Get(':id')
    async findOne(@Req() req: AuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.paymentService.findOne(req.user, id);
    }

    @Patch(':id')
    async update(
        @Req() req: AuthRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePaymentDto: UpdatePaymentDto,
    ) {
        return this.paymentService.update(req.user, id, updatePaymentDto);
    }

    @Delete(':id')
    async remove(@Req() req: AuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.paymentService.remove(req.user, id);
    }
}