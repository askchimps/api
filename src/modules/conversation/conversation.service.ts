import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class ConversationService {
    constructor(
        private readonly logger: PinoLoggerService,
        private readonly prisma: PrismaService,
    ) { }

    async getAll() {
        const methodName = 'getAll';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
            }),
        );

        const conversations = await this.prisma.conversation.findMany();

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: conversations,
            }),
        );

        return conversations;
    }

    async getOne(user: User, org_id: number, agent_id: number, idOrName: string) {
        const methodName = 'getOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, org_id, agent_id, idOrName },
            }),
            methodName,
        );

        const id = Number(idOrName);
        const name = idOrName;

        const whereCondition: Prisma.ConversationWhereInput = {
            organisation_id: org_id,
            agent_id,
            OR: [
                { id: isNaN(id) ? undefined : id },
                { name: name },
            ],
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const conversation = await this.prisma.conversation.findFirst({
            where: whereCondition,
            include: {
                messages: {
                    orderBy: {
                        created_at: 'asc',
                    }
                }
            }
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: conversation,
            }),
            methodName,
        );

        return conversation;
    }

    async getAllMessages(user: User, org_id: number, agent_id: number, idOrName: string) {
        const methodName = 'getAllMessages';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, org_id, agent_id, idOrName },
            }),
            methodName,
        );

        const id = Number(idOrName);
        const name = idOrName;

        const whereCondition: Prisma.MessageWhereInput = {
            organisation_id: org_id,
            agent_id,
            conversation: {
                OR: [
                    { id: isNaN(id) ? undefined : id },
                    { name: name },
                ],
            }
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const messages = await this.prisma.message.findMany({
            where: whereCondition,
            orderBy: {
                created_at: 'asc',
            },
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: messages,
            }),
            methodName,
        );

        return messages;
    }
}
