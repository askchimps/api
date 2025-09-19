import { PinoLoggerService } from "@modules/common/logger/pinoLogger.service";
import { PrismaService } from "@modules/common/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CREDITS_PLAN, Prisma, User } from "@prisma/client";

@Injectable()
export class OrganisationService {
    constructor(
        private readonly logger: PinoLoggerService,
        private readonly prisma: PrismaService
    ) { }

    async getAll(user: User) {
        const methodName = 'getAll';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: user,
            }),
            methodName,
        );

        const whereCondition: Prisma.OrganisationWhereInput = {};

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
            whereCondition.user_organisations = {
                some: {
                    user_id: user.id,
                },
            };
        }

        const organisations = await this.prisma.organisation.findMany({
            where: whereCondition
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: organisations,
            }),
            methodName,
        );

        return organisations;
    }

    async getOne(user: User, idOrSlug: string) {
        const methodName = 'getOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, idOrSlug },
            }),
            methodName,
        );

        const id = Number(idOrSlug);
        const slug = idOrSlug;

        const whereCondition: Prisma.OrganisationWhereInput = {
            OR: [
                { id: isNaN(id) ? undefined : id },
                { slug: slug },
            ],
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const organisation = await this.prisma.organisation.findFirst({
            where: whereCondition,
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: organisation,
            }),
            methodName,
        );

        return organisation;
    }

    async getUsage(user: User, idOrSlug: string, startDate?: Date, endDate?: Date) {
        const methodName = 'getUsage';

        const now = new Date();
        const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, idOrSlug, startDate: defaultStartDate, endDate: defaultEndDate },
            }),
            methodName,
        );

        const id = Number(idOrSlug);
        const slug = idOrSlug;

        const whereCondition: Prisma.OrganisationWhereInput = {
            OR: [
                { id: isNaN(id) ? undefined : id },
                { slug: slug },
            ],
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const organisation = await this.prisma.organisation.findFirst({
            where: whereCondition,
            include: {
                agents: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        const [conversationCount, messageCount, dailyConversations, dailyMessages, agentConversations, agentMessages] = await Promise.all([
            // Total conversation count
            this.prisma.conversation.count({
                where: {
                    organisation_id: organisation.id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
            }),
            // Total message count
            this.prisma.message.count({
                where: {
                    organisation_id: organisation.id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                    role: "assistant",
                },
            }),
            // Daily conversation breakdown using Prisma groupBy
            this.prisma.conversation.groupBy({
                by: ['created_at'],
                where: {
                    organisation_id: organisation.id,
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
            // Daily message breakdown using Prisma groupBy
            this.prisma.message.groupBy({
                by: ['created_at'],
                where: {
                    organisation_id: organisation.id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                    role: "assistant",
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    created_at: 'asc',
                },
            }),
            // Agent conversation breakdown using Prisma groupBy
            this.prisma.conversation.groupBy({
                by: ['agent_id'],
                where: {
                    organisation_id: organisation.id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                },
                _count: {
                    id: true,
                }
            }),
            // Agent message breakdown using Prisma groupBy
            this.prisma.message.groupBy({
                by: ['agent_id'],
                where: {
                    organisation_id: organisation.id,
                    created_at: {
                        gte: defaultStartDate,
                        lte: defaultEndDate,
                    },
                    role: "assistant",
                },
                _count: {
                    id: true,
                }
            }),
        ]);

        const dailyUsageMap = new Map<string, { usedConversationCredits: number, usedMessageCredits: number }>();

        dailyConversations.forEach(item => {
            const date = item.created_at.toISOString().split('T')[0];
            const currentData = dailyUsageMap.get(date) || { usedConversationCredits: 0, usedMessageCredits: 0 };
            dailyUsageMap.set(date, {
                usedConversationCredits: currentData.usedConversationCredits + item._count.id,
                usedMessageCredits: currentData.usedMessageCredits,
            });
        });

        dailyMessages.forEach(item => {
            const date = item.created_at.toISOString().split('T')[0];
            const currentData = dailyUsageMap.get(date) || { usedConversationCredits: 0, usedMessageCredits: 0 };
            dailyUsageMap.set(date, {
                usedConversationCredits: currentData.usedConversationCredits,
                usedMessageCredits: currentData.usedMessageCredits + item._count.id,
            });
        });

        const dailyUsage = Array.from(dailyUsageMap.entries()).map(([date, { usedConversationCredits, usedMessageCredits }]) => ({
            date,
            usedConversationCredits,
            usedMessageCredits,
        }));

        const agentUsageMap = new Map<number, { usedConversationCredits: number, usedMessageCredits: number }>();

        agentConversations.forEach(item => {
            const agent_id = item.agent_id;
            const currentData = agentUsageMap.get(agent_id) || { usedConversationCredits: 0, usedMessageCredits: 0 };
            agentUsageMap.set(agent_id, {
                usedConversationCredits: currentData.usedConversationCredits + item._count.id,
                usedMessageCredits: currentData.usedMessageCredits,
            });
        });

        agentMessages.forEach(item => {
            const agent_id = item.agent_id;
            const currentData = agentUsageMap.get(agent_id) || { usedConversationCredits: 0, usedMessageCredits: 0 };
            agentUsageMap.set(agent_id, {
                usedConversationCredits: currentData.usedConversationCredits,
                usedMessageCredits: currentData.usedMessageCredits + item._count.id,
            });
        });

        const agentUsage = Array.from(agentUsageMap.entries()).map(([agent_id, { usedConversationCredits, usedMessageCredits }]) => ({
            agent_id,
            agent_name: organisation.agents.find(a => a.id === agent_id)?.name || 'Unknown',
            usedConversationCredits,
            usedMessageCredits,
        }));

        const result = {
            creditsPlan: organisation.credits_plan,
            remainingConversationCredits: organisation.conversation_credits,
            remainingMessageCredits: organisation.message_credits,
            remainingCallCredits: organisation.call_credits,
            dateRange: {
                startDate: defaultStartDate,
                endDate: defaultEndDate,
            },
            usedConversationCredits: conversationCount,
            usedMessageCredits: messageCount,
            dailyUsage,
            agentUsage
        };

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: { organisationId: organisation.id, resultSize: JSON.stringify(result).length },
            }),
            methodName,
        );

        return result;
    }

    async getAllAgents(user: User, idOrSlug: string) {
        const methodName = 'getAllAgents';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user, idOrSlug },
            }),
            methodName,
        );

        const orgId = Number(idOrSlug);
        const orgSlug = idOrSlug;

        const whereCondition: Prisma.AgentWhereInput = {
            organisation: {
                OR: [
                    { id: isNaN(orgId) ? undefined : orgId },
                    { slug: orgSlug },
                ],
            },
        };

        if (!user.is_super_admin) {
            whereCondition.is_deleted = 0;
            whereCondition.is_disabled = 0;
        }

        const agents = await this.prisma.agent.findMany({
            where: whereCondition,
        });

        this.logger.log(
            JSON.stringify({
                title: `${methodName} - end`,
                data: agents,
            }),
            methodName,
        );

        return agents;
    }

}