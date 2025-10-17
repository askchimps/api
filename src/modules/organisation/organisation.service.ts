import { PinoLoggerService } from "@modules/common/logger/pinoLogger.service";
import { PrismaService } from "@modules/common/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CONVERSATION_TYPE, Prisma, User } from "@prisma/client";
import { ProcessedConversationFilters } from './dto/get-conversations.dto';
import { ProcessedLeadFilters } from './dto/get-leads.dto';
import { ProcessedAnalyticsFilters, AnalyticsResponse, ConversationAnalytics, DailyAnalyticsBreakdown } from './dto/get-analytics.dto';

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

    async getOverview(user: User, idOrSlug: string, startDate?: Date, endDate?: Date) {
        const methodName = 'getOverview';

        try {
            const now = new Date();

            // Handle date range properly with timezone considerations
            let defaultStartDate: Date;
            let defaultEndDate: Date;

            if (startDate) {
                // If startDate is provided, set it to beginning of that day in UTC
                defaultStartDate = new Date(startDate);
                defaultStartDate.setUTCHours(0, 0, 0, 0);
            } else {
                // Default to first day of current month at 00:00:00 UTC
                defaultStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            }

            if (endDate) {
                // If endDate is provided, set it to end of that day in UTC
                defaultEndDate = new Date(endDate);
                defaultEndDate.setUTCHours(23, 59, 59, 999);
            } else {
                // Default to last day of current month at 23:59:59.999 UTC
                defaultEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            }

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
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Generate complete date range array using UTC dates
            const dateRange: string[] = [];
            const currentDate = new Date(defaultStartDate);
            while (currentDate <= defaultEndDate) {
                dateRange.push(currentDate.toISOString().split('T')[0]);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            const [
                conversationCount,
                callCount,
                leadCount,
                qualifiedLeadCount,
                dailyConversations,
                dailyCalls
            ] = await Promise.all([
                // Total conversation count (conversations with type = 'CHAT')
                this.prisma.conversation.count({
                    where: {
                        organisation_id: organisation.id,
                        type: CONVERSATION_TYPE.CHAT,
                        created_at: {
                            gte: defaultStartDate,
                            lte: defaultEndDate,
                        },
                    },
                }),
                // Total call count (conversations with type = 'CALL')
                this.prisma.conversation.count({
                    where: {
                        organisation_id: organisation.id,
                        type: CONVERSATION_TYPE.CALL,
                        created_at: {
                            gte: defaultStartDate,
                            lte: defaultEndDate,
                        },
                    },
                }),
                // Total lead count
                this.prisma.lead.count({
                    where: {
                        organisation_id: organisation.id,
                        created_at: {
                            gte: defaultStartDate,
                            lte: defaultEndDate,
                        },
                    },
                }),
                // Qualified leads count (status = 'qualified')
                this.prisma.lead.count({
                    where: {
                        organisation_id: organisation.id,
                        status: 'qualified',
                        created_at: {
                            gte: defaultStartDate,
                            lte: defaultEndDate,
                        },
                    },
                }),
                // Daily conversation breakdown using optimized query
                this.prisma.$queryRaw<Array<{
                    date: Date,
                    conversation_count: bigint
                }>>`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as conversation_count
                FROM "Conversation"
                WHERE 
                    organisation_id = ${organisation.id}
                    AND type = 'CHAT'
                    AND created_at >= ${defaultStartDate}
                    AND created_at <= ${defaultEndDate}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
                `,
                // Daily call breakdown using optimized query
                this.prisma.$queryRaw<Array<{
                    date: Date,
                    call_count: bigint
                }>>`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as call_count
                FROM "Conversation"
                WHERE 
                    organisation_id = ${organisation.id}
                    AND type = 'CALL'
                    AND created_at >= ${defaultStartDate}
                    AND created_at <= ${defaultEndDate}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
                `
            ]);

            // Create maps for daily data
            const conversationMap = new Map<string, number>();
            const callMap = new Map<string, number>();

            dailyConversations.forEach(item => {
                const dateKey = item.date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
                conversationMap.set(dateKey, Number(item.conversation_count));
            });

            dailyCalls.forEach(item => {
                const dateKey = item.date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
                callMap.set(dateKey, Number(item.call_count));
            });

            // Create arrays with all dates in range, filling missing dates with 0
            const conversationCountPerDay = dateRange.map(date => ({
                date,
                count: conversationMap.get(date) || 0
            }));

            const callCountPerDay = dateRange.map(date => ({
                date,
                count: callMap.get(date) || 0
            }));

            const result = {
                conversationCount,
                callCount,
                leadCount,
                qualifiedLeadCount,
                dateRange: {
                    startDate: defaultStartDate,
                    endDate: defaultEndDate,
                },
                conversationCountPerDay,
                callCountPerDay
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

    async getAllConversations(user: User, idOrSlug: string, filters: ProcessedConversationFilters) {
        const methodName = 'getAllConversations';

        try {
            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - start`,
                    data: { user, idOrSlug, filters },
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

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Set default values for pagination
            const page = filters.page ?? 1;
            const limit = filters.limit ?? 10;

            // Handle date range with proper timezone
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (filters.startDate) {
                startDate = new Date(filters.startDate);
                startDate.setUTCHours(0, 0, 0, 0);
            }

            if (filters.endDate) {
                endDate = new Date(filters.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
            }

            // Build conversation filters
            const conversationWhere: Prisma.ConversationWhereInput = {
                organisation_id: organisation.id,
            };

            if (!user.is_super_admin) {
                conversationWhere.is_deleted = 0;
                conversationWhere.is_disabled = 0;
            }

            // Add date filters
            if (startDate || endDate) {
                conversationWhere.created_at = {};
                if (startDate) conversationWhere.created_at.gte = startDate;
                if (endDate) conversationWhere.created_at.lte = endDate;
            }

            // Add source filter
            if (filters.source) {
                conversationWhere.source = filters.source;
            }

            // Add agent filter
            if (filters.agent_slug_or_id) {
                const agentId = Number(filters.agent_slug_or_id);
                conversationWhere.agent = {
                    OR: [
                        { id: isNaN(agentId) ? undefined : agentId },
                        { slug: filters.agent_slug_or_id },
                    ],
                };
            }

            // Add type filter
            if (filters.type) {
                conversationWhere.type = filters.type;
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Get total count for pagination metadata
            const totalCount = await this.prisma.conversation.count({
                where: conversationWhere,
            });

            // Get conversations with optimized query including first 2 messages
            const conversations = await this.prisma.conversation.findMany({
                where: conversationWhere,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    source: true,
                    summary: true,
                    created_at: true,
                    updated_at: true,
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            role: true,
                            content: true,
                            created_at: true,
                        },
                        orderBy: {
                            created_at: 'asc',
                        },
                        take: 2, // Get only first 2 messages
                    },
                },
                orderBy: {
                    created_at: 'desc', // Latest conversations first
                },
                skip,
                take: limit,
            });

            // Calculate pagination metadata
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            const result = {
                conversations,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit: limit,
                    hasNextPage,
                    hasPrevPage,
                },
                filters: {
                    source: filters.source,
                    agent: filters.agent_slug_or_id,
                    type: filters.type,
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                },
            };

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - end`,
                    data: {
                        organisationId: organisation.id,
                        conversationCount: conversations.length,
                        totalCount,
                        page: page
                    },
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

    async getConversationDetails(user: User, idOrSlug: string, conversationIdOrName: string) {
        const methodName = 'getConversationDetails';

        try {
            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - start`,
                    data: { user, idOrSlug, conversationIdOrName },
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

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Build conversation filters
            const conversationId = Number(conversationIdOrName);
            const conversationName = conversationIdOrName;

            const conversationWhere: Prisma.ConversationWhereInput = {
                organisation_id: organisation.id,
                OR: [
                    { id: isNaN(conversationId) ? undefined : conversationId },
                    { name: conversationName },
                ],
            };

            if (!user.is_super_admin) {
                conversationWhere.is_deleted = 0;
                conversationWhere.is_disabled = 0;
            }

            // Get conversation with all related details
            const conversation = await this.prisma.conversation.findFirst({
                where: conversationWhere,
                include: {
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            phone_number: true,
                            image_url: true,
                            base_prompt: true,
                            initial_prompt: true,
                            analysis_prompt: true,
                        },
                    },
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone_number: true,
                            source: true,
                            status: true,
                            additional_info: true,
                            follow_ups: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            role: true,
                            content: true,
                            prompt_tokens: true,
                            completion_tokens: true,
                            created_at: true,
                            updated_at: true,
                        },
                        orderBy: {
                            created_at: 'asc', // Messages in chronological order
                        },
                    },
                    topics: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            created_at: true,
                            updated_at: true,
                        },
                        where: {
                            is_deleted: 0,
                            is_disabled: 0,
                        },
                    },
                },
            });

            if (!conversation) {
                throw new NotFoundException('Conversation not found');
            }

            // Organize messages by role for statistics
            const messageStats = {
                total: conversation.messages.length,
                userMessages: conversation.messages.filter(m => m.role === 'user').length,
                assistantMessages: conversation.messages.filter(m => m.role === 'assistant').length,
            };

            const result = {
                conversation: {
                    ...conversation,
                    messageStats,
                },
            };

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - end`,
                    data: {
                        organisationId: organisation.id,
                        conversationId: conversation.id,
                        messageCount: conversation.messages.length,
                    },
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

    async getAllLeads(user: User, idOrSlug: string, filters: ProcessedLeadFilters) {
        const methodName = 'getAllLeads';

        try {
            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - start`,
                    data: { user, idOrSlug, filters },
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

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Set default values for pagination
            const page = filters.page ?? 1;
            const limit = filters.limit ?? 10;

            // Handle date range with proper timezone
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (filters.startDate) {
                startDate = new Date(filters.startDate);
                startDate.setUTCHours(0, 0, 0, 0);
            }

            if (filters.endDate) {
                endDate = new Date(filters.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
            }

            // Build lead filters
            const leadWhere: Prisma.LeadWhereInput = {
                organisation_id: organisation.id,
            };

            // Add date filters
            if (startDate || endDate) {
                leadWhere.created_at = {};
                if (startDate) leadWhere.created_at.gte = startDate;
                if (endDate) leadWhere.created_at.lte = endDate;
            }

            // Add source filter
            if (filters.source) {
                leadWhere.source = filters.source;
            }

            // Add status filter
            if (filters.status) {
                leadWhere.status = filters.status;
            }

            // Add search filter (search in name, email, phone_number)
            if (filters.search) {
                leadWhere.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { phone_number: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            // Add agent filter - leads connected through many-to-many relationship
            if (filters.agent_slug_or_id) {
                const agentId = Number(filters.agent_slug_or_id);
                leadWhere.agents = {
                    some: {
                        OR: [
                            { id: isNaN(agentId) ? undefined : agentId },
                            { slug: filters.agent_slug_or_id },
                        ],
                    },
                };
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Get total count for pagination metadata
            const totalCount = await this.prisma.lead.count({
                where: leadWhere,
            });

            // Get leads with related data
            const leads = await this.prisma.lead.findMany({
                where: leadWhere,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone_number: true,
                    source: true,
                    status: true,
                    additional_info: true,
                    follow_ups: true,
                    created_at: true,
                    updated_at: true,
                    agents: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    conversations: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            created_at: true,
                        },
                        orderBy: {
                            created_at: 'desc',
                        },
                        take: 3, // Get latest 3 conversations for each lead
                    },
                },
                orderBy: {
                    created_at: 'desc', // Latest leads first
                },
                skip,
                take: limit,
            });

            // Calculate pagination metadata
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            const result = {
                leads,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit: limit,
                    hasNextPage,
                    hasPrevPage,
                },
                filters: {
                    source: filters.source,
                    status: filters.status,
                    agent: filters.agent_slug_or_id,
                    search: filters.search,
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                },
            };

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - end`,
                    data: {
                        organisationId: organisation.id,
                        leadCount: leads.length,
                        totalCount,
                        page: page
                    },
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

    async getAnalytics(user: User, idOrSlug: string, filters: ProcessedAnalyticsFilters) {
        const methodName = 'getAnalytics';

        try {
            const now = new Date();

            // Handle date range properly with timezone considerations (consistent with other APIs)
            let defaultStartDate: Date;
            let defaultEndDate: Date;

            if (filters.startDate) {
                // If startDate is provided, set it to beginning of that day in UTC
                defaultStartDate = new Date(filters.startDate);
                defaultStartDate.setUTCHours(0, 0, 0, 0);
            } else {
                // Default to first day of current month at 00:00:00 UTC
                defaultStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            }

            if (filters.endDate) {
                // If endDate is provided, set it to end of that day in UTC
                defaultEndDate = new Date(filters.endDate);
                defaultEndDate.setUTCHours(23, 59, 59, 999);
            } else {
                // Default to last day of current month at 23:59:59.999 UTC
                defaultEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            }

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - start`,
                    data: { user, idOrSlug, filters, startDate: defaultStartDate, endDate: defaultEndDate },
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

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Build base filters for analytics queries
            const baseConversationWhere: Prisma.ConversationWhereInput = {
                organisation_id: organisation.id,
                created_at: {
                    gte: defaultStartDate,
                    lte: defaultEndDate,
                },
            };

            if (!user.is_super_admin) {
                baseConversationWhere.is_deleted = 0;
                baseConversationWhere.is_disabled = 0;
            }

            // Add type filter if specified
            if (filters.type) {
                baseConversationWhere.type = filters.type;
            }

            // Add agent filter
            if (filters.agent_slug_or_id) {
                const agentId = Number(filters.agent_slug_or_id);
                baseConversationWhere.agent = {
                    OR: [
                        { id: isNaN(agentId) ? undefined : agentId },
                        { slug: filters.agent_slug_or_id },
                    ],
                };
            }

            // Add source filter
            if (filters.source) {
                baseConversationWhere.source = filters.source;
            }

            // Build separate filters for different types of conversations
            const chatConversationWhere: Prisma.ConversationWhereInput = {
                ...baseConversationWhere,
                ...(!filters.type && { type: CONVERSATION_TYPE.CHAT }), // Only filter by CHAT if no type specified
            };

            const callConversationWhere: Prisma.ConversationWhereInput = {
                ...baseConversationWhere,
                ...(!filters.type && { type: CONVERSATION_TYPE.CALL }), // Only filter by CALL if no type specified
            };

            // Use filtered base where for leads analytics  
            const leadWhere: Prisma.LeadWhereInput = {
                organisation_id: organisation.id,
                created_at: {
                    gte: defaultStartDate,
                    lte: defaultEndDate,
                },
                ...(filters.type ? {
                    conversations: {
                        some: { type: filters.type },
                    },
                } : {})
            };

            // Generate complete date range array using UTC dates for daily breakdown
            const dateRange: string[] = [];
            const currentDate = new Date(defaultStartDate);
            while (currentDate <= defaultEndDate) {
                dateRange.push(currentDate.toISOString().split('T')[0]);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            // Execute comprehensive analytics queries in parallel for optimal performance
            const [
                // Core conversation metrics
                totalConversations,
                totalCalls,
                totalLeads,
                // Conversation analytics data
                conversationLengthData,
                callLengthData,
                // Daily analytics breakdown
                dailyAnalyticsData
            ] = await Promise.all([
                // Count total conversations (CHAT type if no filter, or filtered by type)
                this.prisma.conversation.count({
                    where: filters.type ? baseConversationWhere : chatConversationWhere,
                }),
                // Count total calls (CALL type if no filter, or filtered by type)
                this.prisma.conversation.count({
                    where: filters.type ? baseConversationWhere : callConversationWhere,
                }),
                // Count total leads generated
                this.prisma.lead.count({
                    where: leadWhere,
                }),
                // Average conversation length (messages per conversation)
                this.prisma.$queryRawUnsafe<Array<{ avg_length: number }>>(
                    `SELECT AVG(message_count) as avg_length
                    FROM (
                        SELECT c.id, COUNT(m.id) as message_count
                        FROM "Conversation" c
                        LEFT JOIN "Message" m ON m.conversation_id = c.id AND m.role = 'user'
                        WHERE c.organisation_id = ${organisation.id}
                            AND c.type = 'CHAT'
                            AND c.created_at >= '${defaultStartDate.toISOString()}'
                            AND c.created_at <= '${defaultEndDate.toISOString()}'
                            ${!user.is_super_admin ? 'AND c.is_deleted = 0 AND c.is_disabled = 0' : ''}
                            ${filters.agent_slug_or_id ?
                        !isNaN(Number(filters.agent_slug_or_id)) ?
                            `AND c.agent_id = ${Number(filters.agent_slug_or_id)}` :
                            `AND EXISTS (SELECT 1 FROM "Agent" a WHERE a.id = c.agent_id AND a.slug = '${filters.agent_slug_or_id}')`
                        : ''}
                            ${filters.source ? `AND c.source = '${filters.source}'` : ''}
                        GROUP BY c.id
                    ) subquery`
                ),
                // Average call length (duration in minutes for CALL conversations)
                this.prisma.$queryRawUnsafe<Array<{ avg_call_length: number }>>(
                    `SELECT AVG(c.duration::float / 60) as avg_call_length
                    FROM "Conversation" c
                    WHERE c.organisation_id = ${organisation.id}
                        AND c.type = 'CALL'
                        AND c.duration IS NOT NULL
                        AND c.created_at >= '${defaultStartDate.toISOString()}'
                        AND c.created_at <= '${defaultEndDate.toISOString()}'
                        ${!user.is_super_admin ? 'AND c.is_deleted = 0 AND c.is_disabled = 0' : ''}
                        ${filters.agent_slug_or_id ?
                        !isNaN(Number(filters.agent_slug_or_id)) ?
                            `AND c.agent_id = ${Number(filters.agent_slug_or_id)}` :
                            `AND EXISTS (SELECT 1 FROM "Agent" a WHERE a.id = c.agent_id AND a.slug = '${filters.agent_slug_or_id}')`
                        : ''}
                        ${filters.source ? `AND c.source = '${filters.source}'` : ''}`
                ),
                // Daily analytics breakdown
                this.prisma.$queryRawUnsafe<Array<{
                    date: Date,
                    conversations: bigint,
                    calls: bigint,
                    leads: bigint
                }>>(
                    `SELECT 
                        DATE(c.created_at) as date,
                        COUNT(CASE WHEN c.type = 'CHAT' THEN 1 END) as conversations,
                        COUNT(CASE WHEN c.type = 'CALL' THEN 1 END) as calls,
                        COUNT(DISTINCT l.id) as leads
                    FROM "Conversation" c
                    LEFT JOIN "Lead" l ON l.id = c.lead_id 
                        AND l.created_at >= '${defaultStartDate.toISOString()}' 
                        AND l.created_at <= '${defaultEndDate.toISOString()}'
                    WHERE c.organisation_id = ${organisation.id}
                        AND c.created_at >= '${defaultStartDate.toISOString()}'
                        AND c.created_at <= '${defaultEndDate.toISOString()}'
                        ${!user.is_super_admin ? 'AND c.is_deleted = 0 AND c.is_disabled = 0' : ''}
                        ${filters.type ? `AND c.type = '${filters.type}'` : ''}
                        ${filters.agent_slug_or_id ?
                        !isNaN(Number(filters.agent_slug_or_id)) ?
                            `AND c.agent_id = ${Number(filters.agent_slug_or_id)}` :
                            `AND EXISTS (SELECT 1 FROM "Agent" a WHERE a.id = c.agent_id AND a.slug = '${filters.agent_slug_or_id}')`
                        : ''}
                        ${filters.source ? `AND c.source = '${filters.source}'` : ''}
                    GROUP BY DATE(c.created_at)
                    ORDER BY date ASC`
                )
            ]);

            // Process analytics data
            const avgConversationLength = conversationLengthData[0]?.avg_length || 0;
            const avgCallLength = callLengthData[0]?.avg_call_length || 0;

            // Build analytics objects
            const conversationAnalytics: ConversationAnalytics = {
                totalConversations: filters.type === CONVERSATION_TYPE.CALL ? 0 : totalConversations,
                totalCalls: filters.type === CONVERSATION_TYPE.CHAT ? 0 : totalCalls,
                averageConversationLength: filters.type === CONVERSATION_TYPE.CALL ? 0 : Math.round(avgConversationLength * 100) / 100,
                averageCallLength: filters.type === CONVERSATION_TYPE.CHAT ? 0 : Math.round(avgCallLength * 100) / 100,
                totalLeadsGenerated: totalLeads,
            };

            // Create daily analytics breakdown map for filling missing dates
            const dailyAnalyticsMap = new Map<string, {
                conversations: number,
                calls: number,
                leads: number
            }>();

            dailyAnalyticsData.forEach(item => {
                dailyAnalyticsMap.set(item.date.toISOString().split('T')[0], {
                    conversations: Number(item.conversations),
                    calls: Number(item.calls),
                    leads: Number(item.leads),
                });
            });

            // Fill daily breakdown with all dates in range
            const dailyBreakdown: DailyAnalyticsBreakdown[] = dateRange.map(date => ({
                date,
                conversations: dailyAnalyticsMap.get(date)?.conversations || 0,
                calls: dailyAnalyticsMap.get(date)?.calls || 0,
                leads: dailyAnalyticsMap.get(date)?.leads || 0,
            }));

            // Construct comprehensive analytics response
            const result: AnalyticsResponse = {
                creditsPlan: organisation.credits_plan,
                remainingConversationCredits: organisation.conversation_credits,
                remainingCallCredits: organisation.call_credits,
                usedConversationCredits: totalConversations,
                usedCallCredits: totalCalls,
                dateRange: {
                    startDate: defaultStartDate,
                    endDate: defaultEndDate,
                },
                conversationAnalytics,
                dailyBreakdown,
                filters: {
                    agent: filters.agent_slug_or_id,
                    source: filters.source,
                    type: filters.type,
                },
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

    // async getAllAgents(user: User, idOrSlug: string) {
    //     const methodName = 'getAllAgents';
    //     this.logger.log(
    //         JSON.stringify({
    //             title: `${methodName} - start`,
    //             data: { user, idOrSlug },
    //         }),
    //         methodName,
    //     );

    //     const orgId = Number(idOrSlug);
    //     const orgSlug = idOrSlug;

    //     const whereCondition: Prisma.AgentWhereInput = {
    //         organisation: {
    //             OR: [
    //                 { id: isNaN(orgId) ? undefined : orgId },
    //                 { slug: orgSlug },
    //             ],
    //         },
    //     };

    //     if (!user.is_super_admin) {
    //         whereCondition.is_deleted = 0;
    //         whereCondition.is_disabled = 0;
    //     }

    //     const agents = await this.prisma.agent.findMany({
    //         where: whereCondition,
    //     });

    //     this.logger.log(
    //         JSON.stringify({
    //             title: `${methodName} - end`,
    //             data: agents,
    //         }),
    //         methodName,
    //     );

    //     return agents;
    // }

}