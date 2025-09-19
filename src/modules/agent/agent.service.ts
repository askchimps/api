import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class AgentService {
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

        const agents = await this.prisma.agent.findMany();

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: agents,
            }),
        );

        return agents;
    }

    async getOne(user: User, orgIdOrSlug: string, idOrSlug: string) {
        const methodName = 'getOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, orgIdOrSlug, idOrSlug },
            }),
            methodName,
        );

        const orgId = Number(orgIdOrSlug);
        const orgSlug = orgIdOrSlug;
        const id = Number(idOrSlug);
        const slug = idOrSlug;

        const whereCondition: Prisma.AgentWhereInput = {
            organisation: {
                OR: [
                    { id: isNaN(orgId) ? undefined : orgId },
                    { slug: orgSlug },
                ],
            },
            OR: [
                { id: isNaN(id) ? undefined : id },
                { slug: slug },
            ],
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const agent = await this.prisma.agent.findFirst({
            where: whereCondition,
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: agent,
            }),
            methodName,
        );

        return agent;
    }

    async getAllConversations(user: User, orgId: number, idOrSlug: string) {
        const methodName = 'getAllConversations';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, orgId, idOrSlug },
            }),
            methodName,
        );

        const id = Number(idOrSlug);
        const slug = idOrSlug;

        const whereCondition: Prisma.ConversationWhereInput = {
            organisation_id: orgId,
            agent: {
                OR: [
                    { id: isNaN(id) ? undefined : id },
                    { slug: slug },
                ],
            },
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const conversations = await this.prisma.conversation.findMany({
            where: whereCondition,
            include: {
                messages: {
                    take: 1,
                    orderBy: {
                        created_at: 'asc',
                    },
                },
            },
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: conversations,
            }),
            methodName,
        );

        return conversations;
    }

    async getAllLeads(user: User, orgId: number, idOrSlug: string) {
        const methodName = 'getAllLeads';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, orgId, idOrSlug },
            }),
            methodName,
        );

        const id = Number(idOrSlug);
        const slug = idOrSlug;

        const leads = await this.prisma.lead.findMany({
            where: {
                organisation_id: orgId,
                agent: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug },
                    ],
                },
            },
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: leads,
            }),
            methodName,
        );

        return leads;
    }

    async getAnalytics(user: User, orgId: number, id: number, startDate?: Date, endDate?: Date) {
        const methodName = 'getAnalytics';

        const now = new Date();
        const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, orgId, id, startDate: defaultStartDate, endDate: defaultEndDate },
            }),
            methodName,
        );

        const [conversationCount, messageCount, leadCount, dailyConversations, dailyLeads] = await Promise.all([
            // Total conversation count
            this.prisma.conversation.count({
                where: {
                    organisation_id: orgId,
                    agent_id: id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
            }),
            // Total message count
            this.prisma.message.count({
                where: {
                    organisation_id: orgId,
                    agent_id: id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
            }),
            // Total lead count
            this.prisma.lead.count({
                where: {
                    organisation_id: orgId,
                    agent_id: id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
            }),
            // Daily conversation breakdown using Prisma groupBy
            this.prisma.conversation.groupBy({
                by: ['created_at'],
                where: {
                    organisation_id: orgId,
                    agent_id: id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    created_at: 'asc',
                },
            }),
            // Daily lead breakdown using Prisma groupBy
            this.prisma.lead.groupBy({
                by: ['created_at'],
                where: {
                    organisation_id: orgId,
                    agent_id: id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    created_at: 'asc',
                },
            }),
        ]);

        const dailyDataMap = new Map<string, { conversations: number; leads: number }>();

        dailyConversations.forEach(item => {
            const dateKey = item.created_at.toISOString().split('T')[0];
            const currentData = dailyDataMap.get(dateKey) || { conversations: 0, leads: 0 };
            dailyDataMap.set(dateKey, {
                conversations: currentData.conversations + item._count.id,
                leads: currentData.leads,
            });
        });

        dailyLeads.forEach(item => {
            const dateKey = item.created_at.toISOString().split('T')[0];
            const currentData = dailyDataMap.get(dateKey) || { conversations: 0, leads: 0 };
            dailyDataMap.set(dateKey, {
                conversations: currentData.conversations,
                leads: currentData.leads + item._count.id,
            });
        });

        const dailyData = Array.from(dailyDataMap.entries())
            .map(([date, { conversations, leads }]) => ({ date, conversations, leads }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const analytics = {
            conversationCount,
            messageCount,
            leadCount,
            dateRange: {
                startDate: defaultStartDate,
                endDate: defaultEndDate,
            },
            dailyData,
        };

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: analytics
            }),
            methodName,
        );

        return analytics;
    }
}