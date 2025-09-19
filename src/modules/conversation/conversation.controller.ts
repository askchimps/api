import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Role } from '@decorators/role.decorator';
import { ROLE } from '@prisma/client';
import { type AuthRequest } from 'types/auth-request';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller({
    path: 'conversation',
    version: '1',
})
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) { }

    @Role(ROLE.SUPER_ADMIN)
    @Get('all')
    async getAll() {
        return this.conversationService.getAll();
    }

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
