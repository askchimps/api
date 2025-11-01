import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CreditHistoryService } from './credit-history.service';
import { GetCreditHistoryQueryDto } from './dto/get-credit-history.dto';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { Role } from '@decorators/role.decorator';
import { ROLE } from '@prisma/client';
import type { AuthRequest } from 'types/auth-request';

@Controller('credit-history')
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(ROLE.USER) // Any authenticated user can view their organization's credit history
export class CreditHistoryController {
    constructor(private readonly creditHistoryService: CreditHistoryService) {}

    @Get()
    async findAll(@Req() req: AuthRequest, @Query() query: GetCreditHistoryQueryDto) {
        return this.creditHistoryService.findAll(req.user, query);
    }

    @Get(':id')
    async findOne(@Req() req: AuthRequest, @Param('id', ParseIntPipe) id: number) {
        return this.creditHistoryService.findOne(req.user, id);
    }
}