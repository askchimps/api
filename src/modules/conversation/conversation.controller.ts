import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { HeaderAuthGuard } from '@guards/header-auth.guard';
import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Role } from '@decorators/role.decorator';
import { Public } from '@decorators/public.decorator';
import { ROLE } from '@prisma/client';
import { type AuthRequest } from 'types/auth-request';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller({
    path: 'conversation',
    version: '1',
})
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) { }

    @UseGuards(HeaderAuthGuard)
    @Public()
    @Post()
    async create(
        @Body() createConversationDto: CreateConversationDto,
    ) {
        return this.conversationService.create(createConversationDto);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.SUPER_ADMIN)
    @Get('all')
    async getAll() {
        return this.conversationService.getAll();
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id/:agent_id/:id_or_name')
    async getById(
        @Req() req: AuthRequest,
        @Param('org_id') org_id: string,
        @Param('agent_id') agent_id: string,
        @Param('id_or_name') id_or_name: string,
    ) {
        return this.conversationService.getOne(
            req.user,
            Number(org_id),
            Number(agent_id),
            id_or_name,
        );
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(ROLE.OWNER, ROLE.ADMIN, ROLE.USER)
    @Get(':org_id/:agent_id/:id_or_name/messages')
    async getAllMessagesById(
        @Req() req: AuthRequest,
        @Param('org_id') org_id: string,
        @Param('agent_id') agent_id: string,
        @Param('id_or_name') id_or_name: string,
    ) {
        return this.conversationService.getAllMessages(
            req.user,
            Number(org_id),
            Number(agent_id),
            id_or_name,
        );
    }
}
