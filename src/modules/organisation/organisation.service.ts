import { PinoLoggerService } from "@modules/common/logger/pinoLogger.service";
import { PrismaService } from "@modules/common/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";

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

        try {
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

            const [
                conversationCount,
                messageCount,
                dailyStats,
                agentStats
            ] = await Promise.all([
                this.prisma.conversation.count({
                    where: {
                        organisation_id: organisation.id,
                        created_at: {
                            gte: defaultStartDate,
                            lte: defaultEndDate,
                        },
                    },
                }),
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
                this.prisma.$queryRaw<Array<{
                    date: Date,
                    conversation_count: bigint,
                    message_count: bigint
                }>>`
                SELECT 
                    DATE_TRUNC('day', c.created_at) as date,
                    COUNT(DISTINCT c.id) as conversation_count,
                    COUNT(m.id) as message_count
                FROM "Conversation" c
                LEFT JOIN "Message" m ON 
                    m.conversation_id = c.id 
                    AND m.created_at >= ${defaultStartDate}
                    AND m.created_at <= ${defaultEndDate}
                    AND m.role = 'assistant'
                WHERE 
                    c.organisation_id = ${organisation.id}
                    AND c.created_at >= ${defaultStartDate}
                    AND c.created_at <= ${defaultEndDate}
                GROUP BY DATE_TRUNC('day', c.created_at)
                ORDER BY date ASC
            `,
                this.prisma.$queryRaw<Array<{
                    agent_id: number,
                    agent_name: string,
                    conversation_count: bigint,
                    message_count: bigint
                }>>`
                SELECT 
                    a.id as agent_id,
                    a.name as agent_name,
                    COUNT(DISTINCT c.id) as conversation_count,
                    COUNT(m.id) as message_count
                FROM "Agent" a
                LEFT JOIN "Conversation" c ON 
                    c.agent_id = a.id 
                    AND c.organisation_id = ${organisation.id}
                    AND c.created_at >= ${defaultStartDate}
                    AND c.created_at <= ${defaultEndDate}
                LEFT JOIN "Message" m ON 
                    m.conversation_id = c.id 
                    AND m.created_at >= ${defaultStartDate}
                    AND m.created_at <= ${defaultEndDate}
                    AND m.role = 'assistant'
                WHERE a.organisation_id = ${organisation.id}
                GROUP BY a.id, a.name
                HAVING COUNT(DISTINCT c.id) > 0 OR COUNT(m.id) > 0
                ORDER BY a.id ASC
            `
            ]);

            const dailyUsage = dailyStats.map(day => ({
                date: day.date.toISOString().split('T')[0],
                usedConversationCredits: Number(day.conversation_count),
                usedMessageCredits: Number(day.message_count)
            }));

            const agentUsage = agentStats.map(agent => ({
                agent_id: agent.agent_id,
                agent_name: agent.agent_name,
                usedConversationCredits: Number(agent.conversation_count),
                usedMessageCredits: Number(agent.message_count)
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
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message || 'Unknown error',
                    stack: error?.stack,
                }),
                methodName,
            );
            throw error;
        }
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