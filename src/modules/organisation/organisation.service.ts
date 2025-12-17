import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MagpiePrismaService } from '../common/prisma/magpie-prisma.service';
import { SunroofPrismaService } from '../common/prisma/sunroof-prisma.service';
import { Prisma } from '@prisma/public-client';
import {
    PaginationParams,
    ChatsFilterParams,
    CallsFilterParams,
    LeadsFilterParams
} from './dto/service-interfaces';
import { ChatWhereInput, CallWhereInput, LeadWhereInput } from './dto/prisma-types';

@Injectable()
export class OrganisationService {
    private readonly logger = new Logger(OrganisationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly magpiePrisma: MagpiePrismaService,
        private readonly sunroofPrisma: SunroofPrismaService,
    ) { }

    async getAllOrganisations(isSuperAdmin: boolean = false, userId?: string) {
        this.logger.log(`Getting all organisations - isSuperAdmin: ${isSuperAdmin}, userId: ${userId}`);

        try {
            let whereCondition: any;

            if (isSuperAdmin) {
                // Super admin can see all organisations
                whereCondition = {};
            } else if (userId) {
                // Regular user can only see organisations they belong to
                whereCondition = {
                    is_deleted: 0,
                    is_disabled: 0,
                    user_organisations: {
                        some: {
                            user_id: userId,
                            is_deleted: 0
                        }
                    }
                };
            } else {
                // No user ID provided, return empty result
                return [];
            }

            const organisations = await this.prisma.organisation.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    chat_credits: true,
                    call_credits: true,
                    is_disabled: true,
                    is_deleted: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });

            this.logger.log(`Successfully retrieved ${organisations.length} organisations`);
            return organisations;

        } catch (error) {
            this.logger.error(`Error in getAllOrganisations: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getAllOrganisationsFromAllSchemas() {
        this.logger.log('Getting all organisations from all schemas (Public, Magpie, Sunroof)');

        try {
            // Fetch organisations from all three databases in parallel
            const [publicOrgs, magpieOrgs, sunroofOrgs] = await Promise.all([
                // Public (AskChimps) organisations
                this.prisma.organisation.findMany({
                    where: {
                        is_deleted: 0,
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        chat_credits: true,
                        call_credits: true,
                        active_indian_calls: true,
                        active_international_calls: true,
                        available_indian_channels: true,
                        available_international_channels: true,
                        expenses: true,
                        is_disabled: true,
                        is_deleted: true,
                        created_at: true,
                        updated_at: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                }),

                // Magpie organisations
                this.magpiePrisma.organisation.findMany({
                    where: {
                        is_deleted: 0,
                    },
                    select: {
                        id: true,
                        name: true,
                        call_credits: true,
                        chat_credits: true,
                        available_indian_channel: true,
                        active_indian_channel: true,
                        available_international_channel: true,
                        active_international_channel: true,
                        is_deleted: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),

                // Sunroof organisations
                this.sunroofPrisma.organisation.findMany({
                    where: {
                        is_deleted: 0,
                    },
                    select: {
                        id: true,
                        name: true,
                        call_credits: true,
                        chat_credits: true,
                        available_indian_channel: true,
                        active_indian_channel: true,
                        available_international_channel: true,
                        active_international_channel: true,
                        is_deleted: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
            ]);

            const result = {
                public: {
                    schema: 'AskChimps',
                    count: publicOrgs.length,
                    organisations: publicOrgs,
                },
                magpie: {
                    schema: 'Magpie',
                    count: magpieOrgs.length,
                    organisations: magpieOrgs,
                },
                sunroof: {
                    schema: 'Sunroof',
                    count: sunroofOrgs.length,
                    organisations: sunroofOrgs,
                },
                summary: {
                    total_count: publicOrgs.length + magpieOrgs.length + sunroofOrgs.length,
                    public_count: publicOrgs.length,
                    magpie_count: magpieOrgs.length,
                    sunroof_count: sunroofOrgs.length,
                },
            };

            this.logger.log(`Successfully retrieved organisations from all schemas - Total: ${result.summary.total_count}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getAllOrganisationsFromAllSchemas: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getOrganisationDetails(
        id_or_slug: string,
    ) {
        this.logger.log(`Getting organisation details for: ${id_or_slug}`);

        try {
            // Find organisation by id or slug
            this.logger.log(`Searching organisation by ID or slug: ${id_or_slug}`);
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                        { slug: id_or_slug }
                    ],
                    is_deleted: 0,
                    is_disabled: 0
                },
                include: {
                    user_organisations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    is_super_admin: true,
                                    created_at: true
                                }
                            }
                        }
                    },
                    agents: {
                        where: {
                            is_deleted: 0
                        },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            type: true,
                            image_url: true,
                            is_disabled: true,
                            created_at: true,
                            updated_at: true
                        }
                    },
                    credit_history: {
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 10,
                        select: {
                            id: true,
                            change_amount: true,
                            change_type: true,
                            change_field: true,
                            reason: true,
                            created_at: true
                        }
                    }
                }
            });

            if (!organisation) {
                this.logger.error(`Organisation not found for identifier: ${id_or_slug}`);
                throw new NotFoundException('Organisation not found');
            }

            this.logger.log(`Found organisation: ${organisation.name} (ID: ${organisation.id})`);

            // Get comprehensive statistics
            const orgId = organisation.id;
            this.logger.log(`Starting statistics calculation for organisation ${orgId}`);
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

            // Get total counts
            const totalLeads = await this.prisma.lead.count({
                where: {
                    organisations: {
                        some: {
                            id: orgId
                        }
                    },
                    is_deleted: 0
                }
            });

            const totalCalls = await this.prisma.call.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0
                }
            });

            const totalChats = await this.prisma.chat.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0
                }
            });

            // Get recent activity (last 30 days)
            const recentLeads = await this.prisma.lead.count({
                where: {
                    organisations: {
                        some: {
                            id: orgId
                        }
                    },
                    is_deleted: 0,
                    created_at: {
                        gte: thirtyDaysAgo
                    }
                }
            });

            const recentCalls = await this.prisma.call.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    started_at: {
                        gte: thirtyDaysAgo
                    }
                }
            });

            const recentChats = await this.prisma.chat.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    created_at: {
                        gte: thirtyDaysAgo
                    }
                }
            });

            // Get status-based counts
            const qualifiedLeads = await this.prisma.lead.count({
                where: {
                    organisations: {
                        some: {
                            id: orgId
                        }
                    },
                    is_deleted: 0,
                    status: 'qualified'
                }
            });

            const activeCalls = await this.prisma.call.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    status: 'active'
                }
            });

            const activeChats = await this.prisma.chat.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    status: 'active'
                }
            });

            // Calculate total costs
            const totalCosts = await this.prisma.cost.aggregate({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0
                },
                _sum: {
                    amount: true
                }
            });

            // Get latest activities
            const latestCalls = await this.prisma.call.findMany({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0
                },
                include: {
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    started_at: 'desc'
                },
                take: 5
            });

            const latestChats = await this.prisma.chat.findMany({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0
                },
                include: {
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 5
            });

            const latestLeads = await this.prisma.lead.findMany({
                where: {
                    organisations: {
                        some: {
                            id: orgId
                        }
                    },
                    is_deleted: 0
                },
                include: {
                    zoho_lead: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 5
            });

            const organisationDetails = {
                // Basic organisation info
                id: organisation.id,
                name: organisation.name,
                slug: organisation.slug,
                chat_credits: organisation.chat_credits,
                call_credits: organisation.call_credits,
                expenses: organisation.expenses,
                active_indian_calls: organisation.active_indian_calls,
                active_international_calls: organisation.active_international_calls,
                available_indian_channels: organisation.available_indian_channels,
                available_international_channels: organisation.available_international_channels,
                is_disabled: organisation.is_disabled,
                is_deleted: organisation.is_deleted,
                created_at: organisation.created_at,
                updated_at: organisation.updated_at,
                updated_by_user: organisation.updated_by_user,

                // Related data
                users: organisation.user_organisations.map(uo => uo.user),
                agents: organisation.agents,
                recent_credit_history: organisation.credit_history,

                // Statistics
                stats: {
                    // Total counts
                    total_leads: totalLeads,
                    total_calls: totalCalls,
                    total_chats: totalChats,
                    total_agents: organisation.agents.length,
                    total_users: organisation.user_organisations.length,

                    // Recent activity (last 30 days)
                    recent_leads: recentLeads,
                    recent_calls: recentCalls,
                    recent_chats: recentChats,

                    // Status-based counts
                    qualified_leads: qualifiedLeads,
                    active_calls: activeCalls,
                    active_chats: activeChats,

                    // Financial
                    total_costs: totalCosts._sum.amount || 0,
                    credit_balance: organisation.chat_credits + organisation.call_credits
                },

                // Latest activities
                latest_activities: {
                    calls: latestCalls.map(call => ({
                        id: call.id,
                        status: call.status,
                        direction: call.direction,
                        duration: call.duration,
                        started_at: call.started_at,
                        ended_at: call.ended_at,
                        lead: call.lead ? {
                            id: call.lead.id,
                            name: `${call.lead.first_name || ''} ${call.lead.last_name || ''}`.trim(),
                            phone_number: call.lead.phone_number
                        } : null,
                        agent: {
                            id: call.agent.id,
                            name: call.agent.name
                        }
                    })),
                    chats: latestChats.map(chat => ({
                        id: chat.id,
                        status: chat.status,
                        source: chat.source,
                        instagram_id: chat.instagram_id,
                        whatsapp_id: chat.whatsapp_id,
                        human_handled: chat.human_handled,
                        unread_messages: chat.unread_messages,
                        prompt_tokens: chat.prompt_tokens,
                        completion_tokens: chat.completion_tokens,
                        total_cost: chat.total_cost,
                        created_at: chat.created_at,
                        updated_at: chat.updated_at,
                        lead: chat.lead ? {
                            id: chat.lead.id,
                            name: `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim(),
                            phone_number: chat.lead.phone_number
                        } : null,
                        agent: {
                            id: chat.agent.id,
                            name: chat.agent.name
                        }
                    })),
                    leads: latestLeads.map(lead => ({
                        id: lead.id,
                        first_name: lead.first_name,
                        last_name: lead.last_name,
                        full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
                        email: lead.email,
                        phone_number: lead.phone_number,
                        source: lead.source,
                        status: lead.status,
                        is_indian: lead.is_indian,
                        follow_up_count: lead.follow_up_count,
                        created_at: lead.created_at,
                        zoho_lead: lead.zoho_lead
                    }))
                }
            };

            this.logger.log(`Successfully retrieved organisation details for: ${id_or_slug}`);
            return organisationDetails;

        } catch (error) {
            this.logger.error(`Error in getOrganisationDetails for ${id_or_slug}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getOrganisationAgents(
        id_or_slug: string,
        filters: PaginationParams,
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Getting organisation agents for: ${id_or_slug}, filters: ${JSON.stringify(filters)}, isSuperAdmin: ${isSuperAdmin}`);

        try {
            const { page = 1, limit = 1000 } = filters;

            // Find organisation by id or slug
            this.logger.log(`Searching for organisation: ${id_or_slug}`);
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                        { slug: id_or_slug }
                    ],
                    ...(isSuperAdmin ? {} : { is_deleted: 0, is_disabled: 0 })
                }
            });

            if (!organisation) {
                this.logger.error(`Organisation not found for identifier: ${id_or_slug}`);
                throw new NotFoundException('Organisation not found');
            }

            this.logger.log(`Found organisation: ${organisation.name} (ID: ${organisation.id})`);

            const orgId = organisation.id;
            this.logger.log(`Getting agents for organisation ${orgId} with pagination: page=${page}, limit=${limit}`);

            // Build where condition for agents
            const whereCondition = {
                organisation_id: orgId,
                is_deleted: 0
            };

            // Get total count
            this.logger.log(`Getting total agent count for organisation ${orgId}`);
            const total = await this.prisma.agent.count({
                where: whereCondition
            });

            this.logger.log(`Total agents found: ${total}`);

            // Get agents with all details
            this.logger.log(`Fetching agents with pagination: skip=${(page - 1) * limit}, take=${limit}`);
            const agents = await this.prisma.agent.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    phone_number: true,
                    organisation_id: true,
                    base_prompt: true,
                    image_url: true,
                    type: true,
                    assistant_id: true,
                    initial_prompt: true,
                    analysis_prompt: true,
                    is_disabled: true,
                    is_deleted: true,
                    created_at: true,
                    updated_at: true,
                    updated_by_user: true
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            });

            this.logger.log(`Retrieved ${agents.length} agents from database`);

            // Get agent statistics
            this.logger.log(`Calculating agent statistics for organisation ${orgId}`);
            const activeAgents = await this.prisma.agent.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    is_disabled: 0
                }
            });

            const disabledAgents = await this.prisma.agent.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    is_disabled: 1
                }
            });

            const callAgents = await this.prisma.agent.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    type: 'CALL'
                }
            });

            const chatAgents = await this.prisma.agent.count({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    type: 'CHAT'
                }
            });

            const result = {
                agents: agents.map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    slug: agent.slug,
                    phone_number: agent.phone_number,
                    organisation_id: agent.organisation_id,
                    base_prompt: agent.base_prompt,
                    image_url: agent.image_url,
                    type: agent.type,
                    assistant_id: agent.assistant_id,
                    initial_prompt: agent.initial_prompt,
                    analysis_prompt: agent.analysis_prompt,
                    is_disabled: agent.is_disabled,
                    is_deleted: agent.is_deleted,
                    created_at: agent.created_at,
                    updated_at: agent.updated_at,
                    updated_by_user: agent.updated_by_user,
                    status: agent.is_disabled === 1 ? 'disabled' : 'active'
                })),
                stats: {
                    total_agents: total,
                    active_agents: activeAgents,
                    disabled_agents: disabledAgents,
                    call_agents: callAgents,
                    chat_agents: chatAgents
                },
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total: total,
                    total_pages: Math.ceil(total / limit)
                }
            };

            this.logger.log(`Successfully retrieved agents for organisation ${orgId} - Total: ${total}, Returned: ${agents.length}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getOrganisationAgents for ${id_or_slug}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getOrganisationOverview(
        idOrSlug: string,
        startDate?: string,
        endDate?: string,
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Getting organisation overview for: ${idOrSlug}, startDate: ${startDate}, endDate: ${endDate}, isSuperAdmin: ${isSuperAdmin}`);

        try {

            // Find organisation by ID or slug
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(parseInt(idOrSlug)) ? undefined : parseInt(idOrSlug) },
                        { slug: idOrSlug }
                    ],
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Check permissions - super admin can access any org, others need specific access
            if (!isSuperAdmin) {
                // Here you might want to check if user belongs to this organization
                // For now, we'll just check if org is active
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    throw new NotFoundException('Organisation not found');
                }
            }

            // Set date range based on provided parameters
            const now = new Date();
            let start: Date | undefined;
            let end: Date | undefined;

            if (startDate && endDate) {
                // Both dates provided
                start = new Date(startDate);
                end = new Date(endDate);
            } else if (startDate && !endDate) {
                // Only start date provided - show from start to very end (no end limit)
                start = new Date(startDate);
                end = undefined;
            } else if (!startDate && endDate) {
                // Only end date provided - show current month up to the specified end date
                const endDateObj = new Date(endDate);
                start = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1); // First day of the end date's month
                end = endDateObj;
            } else {
                // Neither provided - default to current month (November 2025)
                const currentYear = now.getFullYear(); // 2025
                const currentMonth = now.getMonth(); // 10 (November, 0-indexed)

                start = new Date(currentYear, currentMonth, 1); // November 1st, 2025
                end = new Date(currentYear, currentMonth + 1, 0); // Last day of November 2025
            }

            // Set time boundaries only for dates that are defined
            if (end) {
                end.setHours(23, 59, 59, 999);
            }
            if (start) {
                start.setHours(0, 0, 0, 0);
            }

            const orgId = organisation.id;

            // Get total counts for the period
            const [totalChats, totalCalls, totalLeads, qualifiedLeads] = await Promise.all([
                this.getTotalChats(orgId, start, end),
                this.getTotalCalls(orgId, start, end),
                this.getTotalLeads(orgId, start, end),
                this.getQualifiedLeads(orgId, start, end),
            ]);

            // Get daily stats (only if both dates are available)
            const dailyStats = (start && end) ? await this.getDailyStats(orgId, start, end) : [];

            const overviewData = {
                organisation: {
                    id: organisation.id,
                    name: organisation.name,
                    slug: organisation.slug,
                },
                overview: {
                    totalChats,
                    totalCalls,
                    totalLeads,
                    qualifiedLeads,
                },
                dailyStats,
                period: {
                    startDate: start ? start.toISOString().split('T')[0] : null,
                    endDate: end ? end.toISOString().split('T')[0] : null,
                },
            };

            this.logger.log(`Successfully retrieved organisation overview for: ${idOrSlug}`);
            return overviewData;

        } catch (error) {
            this.logger.error(`Error in getOrganisationOverview for ${idOrSlug}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getOrganisationChats(
        idOrSlug: string,
        filters: ChatsFilterParams,
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Starting getOrganisationChats for: ${idOrSlug}, filters: ${JSON.stringify(filters)}, isSuperAdmin: ${isSuperAdmin}`);

        try {
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            this.logger.log(`Parsed ID: ${id}, Slug: ${slug}`);

            // Find organisation by ID or slug
            this.logger.log(`Searching for organisation with ID: ${id} or slug: ${slug}`);
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                this.logger.error(`Organisation not found for identifier: ${idOrSlug}`);
                throw new NotFoundException('Organisation not found');
            }

            this.logger.log(`Found organisation: ${organisation.name} (ID: ${organisation.id})`);

            // Check permissions
            if (!isSuperAdmin) {
                this.logger.log(`Checking permissions for non-super admin`);
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    this.logger.error(`Organisation is deleted or disabled: deleted=${organisation.is_deleted}, disabled=${organisation.is_disabled}`);
                    throw new NotFoundException('Organisation not found');
                }
            }

            // Set date range based on provided parameters  
            const now = new Date();
            let start: Date | undefined;
            let end: Date | undefined;

            this.logger.log(`Processing date filters: startDate=${filters.startDate}, endDate=${filters.endDate}`);

            if (filters.startDate && filters.endDate) {
                start = new Date(filters.startDate);
                end = new Date(filters.endDate);
                this.logger.log(`Both dates provided: ${start.toISOString()} to ${end.toISOString()}`);
            } else if (filters.startDate && !filters.endDate) {
                start = new Date(filters.startDate);
                end = undefined;
                this.logger.log(`Only start date provided: ${start.toISOString()}`);
            } else if (!filters.startDate && filters.endDate) {
                start = undefined;
                end = new Date(filters.endDate);
                this.logger.log(`Only end date provided: ${end.toISOString()}`);
            } else {
                // Default to current month
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now);
                this.logger.log(`No dates provided, using current month: ${start.toISOString()} to ${end.toISOString()}`);
            }

            // Set time boundaries
            if (end) {
                end.setHours(23, 59, 59, 999);
                this.logger.log(`Set end time boundaries: ${end.toISOString()}`);
            }
            if (start) {
                start.setHours(0, 0, 0, 0);
                this.logger.log(`Set start time boundaries: ${start.toISOString()}`);
            }

            const orgId = organisation.id;
            this.logger.log(`Processing chats for organisation ID: ${orgId}`);

            // Build where condition for chats
            const whereCondition: ChatWhereInput = {
                organisation_id: orgId,
                is_deleted: 0
            };

            // Apply date filters
            if (start || end) {
                whereCondition.created_at = {};
                if (start) whereCondition.created_at.gte = start;
                if (end) whereCondition.created_at.lte = end;
                this.logger.log(`Applied date filters to whereCondition`);
            }

            // Apply status filter
            if (filters.status) {
                whereCondition.status = filters.status;
                this.logger.log(`Applied status filter: ${filters.status}`);
            }

            // Apply source filter
            if (filters.source) {
                whereCondition.source = filters.source as any;
                this.logger.log(`Applied source filter: ${filters.source}`);
            }

            // Apply tag filter
            if (filters.tag_id) {
                whereCondition.tags = {
                    some: {
                        id: filters.tag_id,
                        is_deleted: 0,
                    },
                };
                this.logger.log(`Applied tag filter: tag_id=${filters.tag_id}`);
            }

            this.logger.log(`Final whereCondition: ${JSON.stringify(whereCondition)}`);

            // Calculate pagination
            const skip = (filters.page - 1) * filters.limit;
            this.logger.log(`Pagination: page=${filters.page}, limit=${filters.limit}, skip=${skip}`);

            // Get chats with first two messages and lead info
            this.logger.log(`Starting parallel database queries`);
            const [chats, totalChats, openChats, handoverChats, completedChats, chatsWithLead, chatsWithoutLead] = await Promise.all([
                this.prisma.chat.findMany({
                    where: whereCondition,
                    include: {
                        lead: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                        messages: {
                            select: {
                                id: true,
                                role: true,
                                content: true,
                                message_type: true,
                                prompt_tokens: true,
                                completion_tokens: true,
                                total_cost: true,
                                created_at: true,
                                updated_at: true,
                                attachments: {
                                    select: {
                                        id: true,
                                        file_url: true,
                                        file_name: true,
                                        file_size: true,
                                        file_type: true,
                                        width: true,
                                        height: true,
                                        duration: true,
                                        thumbnail_url: true,
                                        created_at: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'asc',
                            },
                            take: 5, // First two messages
                        },
                        tags: true,
                        agent: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                    skip,
                    take: filters.limit,
                }),
                // Total chats count
                this.prisma.chat.count({
                    where: whereCondition,
                }),
                // Open chats count
                this.prisma.chat.count({
                    where: {
                        ...whereCondition,
                        status: 'open',
                    },
                }),
                // Handover chats count
                this.prisma.chat.count({
                    where: {
                        ...whereCondition,
                        human_handled: 1,
                    },
                }),
                // Completed chats count
                this.prisma.chat.count({
                    where: {
                        ...whereCondition,
                        status: 'completed',
                    },
                }),
                // Chats with lead count
                this.prisma.chat.count({
                    where: {
                        ...whereCondition,
                        lead_id: { not: null },
                    },
                }),
                // Chats without lead count
                this.prisma.chat.count({
                    where: {
                        ...whereCondition,
                        lead_id: null,
                    },
                }),
            ]);

            this.logger.log(`Database queries completed - Found ${chats.length} chats, total: ${totalChats}, open: ${openChats}, with lead: ${chatsWithLead}, without lead: ${chatsWithoutLead}`);

            // Transform chats data
            this.logger.log(`Transforming ${chats.length} chat records`);
            const transformedChats = chats.map(chat => ({
                id: chat.id,
                status: chat.status,
                source: chat.source,
                instagram_id: chat.instagram_id,
                whatsapp_id: chat.whatsapp_id,
                human_handled: chat.human_handled,
                unread_messages: chat.unread_messages,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                name: chat.lead
                    ? `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim() || null
                    : chat.name || null,
                lead_id: chat.lead_id,
                lead: chat.lead, // Complete lead details
                agent: chat.agent,
                messages: chat.messages,
                total_cost: chat.total_cost,
                tags: chat.tags,
            }));

            const result = {
                organisation: {
                    id: organisation.id,
                    name: organisation.name,
                    slug: organisation.slug,
                },
                chats: transformedChats,
                summary: {
                    totalChats,
                    openChats: filters.status === 'completed' ? 0 : openChats,
                    handoverChats,
                    completedChats: filters.status === 'open' ? 0 : completedChats,
                    chatsWithLead,
                    chatsWithoutLead,
                },
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: totalChats,
                    totalPages: Math.ceil(totalChats / filters.limit),
                },
                filters: {
                    startDate: start ? start.toISOString().split('T')[0] : null,
                    endDate: end ? end.toISOString().split('T')[0] : null,
                    status: filters.status || null,
                    source: filters.source || null,
                    tag_id: filters.tag_id || null,
                },
            };

            this.logger.log(`Successfully completed getOrganisationChats for ${idOrSlug} - returning ${transformedChats.length} chats`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getOrganisationChats for ${idOrSlug}: ${error.message}`, error.stack);
            this.logger.error(`Filters that caused error: ${JSON.stringify(filters)}`);
            throw error;
        }
    }

    async getChatDetails(
        idOrSlug: string,
        idIrExternalId: string,
        isSuperAdmin: boolean = false
    ) {
        const id = Number(idOrSlug);
        const slug = idOrSlug;

        // Find organisation by ID or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(id) ? undefined : id },
                    { slug: slug }
                ]
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        // Check permissions
        if (!isSuperAdmin) {
            if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                throw new NotFoundException('Organisation not found');
            }
        }

        const orgId = organisation.id;

        // Get the specific chat with all details
        const chat = await this.prisma.chat.findFirst({
            where: {
                OR: [
                    { id: idIrExternalId.length > 6 ? undefined : parseInt(idIrExternalId) },
                    { whatsapp_id: idIrExternalId },
                    { instagram_id: idIrExternalId },
                ],
                organisation_id: orgId,
                is_deleted: 0,
            },
            include: {
                // Complete lead details
                lead: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        source: true,
                        status: true,
                        is_indian: true,
                        follow_up_count: true,
                        reschedule_count: true,
                        last_follow_up: true,
                        next_follow_up: true,
                        call_active: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                // Complete agent details
                agent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        phone_number: true,
                        base_prompt: true,
                        image_url: true,
                        initial_prompt: true,
                        analysis_prompt: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                // All messages in proper chronological order
                messages: {
                    select: {
                        id: true,
                        role: true,
                        content: true,
                        message_type: true,
                        prompt_tokens: true,
                        completion_tokens: true,
                        total_cost: true,
                        created_at: true,
                        updated_at: true,
                        attachments: {
                            select: {
                                id: true,
                                file_url: true,
                                file_name: true,
                                file_size: true,
                                file_type: true,
                                width: true,
                                height: true,
                                duration: true,
                                thumbnail_url: true,
                                created_at: true,
                            },
                        },
                    },
                    orderBy: {
                        created_at: 'asc', // Chronological order
                    },
                },
                // Associated costs
                costs: {
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        summary: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: 'asc',
                    },
                },
                // Tags associated with the chat
                tags: {
                    where: {
                        is_deleted: 0,
                    },
                    select: {
                        id: true,
                        name: true,
                        created_at: true,
                        updated_at: true,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Calculate totals
        const messageCount = chat.messages.length;
        const totalPromptTokens = chat.messages.reduce((sum, msg) => sum + msg.prompt_tokens, 0);
        const totalCompletionTokens = chat.messages.reduce((sum, msg) => sum + msg.completion_tokens, 0);
        const totalMessagesCost = chat.messages.reduce((sum, msg) => sum + (msg.total_cost || 0), 0);
        const totalAssociatedCosts = chat.costs.reduce((sum, cost) => sum + cost.amount, 0);
        const grandTotalCost = (chat.total_cost || 0) + totalMessagesCost + totalAssociatedCosts;

        // Group messages by role for quick insights
        const messagesByRole = chat.messages.reduce((acc, msg) => {
            acc[msg.role] = (acc[msg.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate chat duration
        const firstMessage = chat.messages[0];
        const lastMessage = chat.messages[chat.messages.length - 1];
        const chatDuration = firstMessage && lastMessage
            ? new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()
            : null;

        return {
            organisation: {
                id: organisation.id,
                name: organisation.name,
                slug: organisation.slug,
            },
            chat: {
                id: chat.id,
                status: chat.status,
                source: chat.source,
                instagram_id: chat.instagram_id,
                whatsapp_id: chat.whatsapp_id,
                human_handled: chat.human_handled,
                unread_messages: chat.unread_messages,
                summary: chat.summary,
                analysis: chat.analysis,
                prompt_tokens: chat.prompt_tokens,
                completion_tokens: chat.completion_tokens,
                total_cost: chat.total_cost,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                name: chat.lead
                    ? `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim() || null
                    : chat.name || null,
                // Duration in milliseconds (null if no messages)
                duration: chatDuration,
            },
            lead: chat.lead,
            agent: chat.agent,
            messages: chat.messages,
            costs: chat.costs,
            tags: chat.tags,
            statistics: {
                messageCount,
                messagesByRole,
                totalPromptTokens,
                totalCompletionTokens,
                totalMessagesCost,
                totalAssociatedCosts,
                grandTotalCost,
                averageMessageLength: messageCount > 0
                    ? Math.round(chat.messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / messageCount)
                    : 0,
            },
        };
    }

    private async getTotalChats(orgId: number, start?: Date, end?: Date): Promise<number> {
        const whereCondition: ChatWhereInput = {
            organisation_id: orgId,
            is_deleted: 0
        };

        if (start || end) {
            whereCondition.created_at = {};
            if (start) whereCondition.created_at.gte = start;
            if (end) whereCondition.created_at.lte = end;
        }

        const count = await this.prisma.chat.count({
            where: whereCondition,
        });
        return count;
    }

    private async getTotalCalls(orgId: number, start?: Date, end?: Date): Promise<number> {
        const whereCondition: CallWhereInput = {
            organisation_id: orgId,
            is_deleted: 0,
        };

        if (start || end) {
            whereCondition.created_at = {};
            if (start) whereCondition.created_at.gte = start;
            if (end) whereCondition.created_at.lte = end;
        }

        const count = await this.prisma.call.count({
            where: whereCondition,
        });
        return count;
    }

    private async getTotalLeads(orgId: number, start?: Date, end?: Date): Promise<number> {
        const whereCondition: LeadWhereInput = {
            organisations: {
                some: {
                    id: orgId,
                },
            },
            is_deleted: 0,
        };

        if (start || end) {
            whereCondition.created_at = {};
            if (start) whereCondition.created_at.gte = start;
            if (end) whereCondition.created_at.lte = end;
        }

        const count = await this.prisma.lead.count({
            where: whereCondition,
        });
        return count;
    }

    private async getQualifiedLeads(orgId: number, start?: Date, end?: Date): Promise<number> {
        const whereCondition: LeadWhereInput = {
            organisations: {
                some: {
                    id: orgId,
                },
            },
            status: "qualified",
            is_deleted: 0,
        };

        if (start || end) {
            whereCondition.created_at = {};
            if (start) whereCondition.created_at.gte = start;
            if (end) whereCondition.created_at.lte = end;
        }

        const count = await this.prisma.lead.count({
            where: whereCondition,
        });
        return count;
    }

    private async getDailyStats(orgId: number, start: Date, end: Date) {
        // Use raw SQL for optimal performance with date aggregation
        // created_at::date extracts only the date part (YYYY-MM-DD) from timestamp
        // This groups all records from the same calendar day together
        const [chatStats, callStats] = await Promise.all([
            this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
                SELECT 
                    created_at::date as date,
                    COUNT(*) as count
                FROM "Chat"
                WHERE organisation_id = ${orgId}
                    AND created_at >= ${start}
                    AND created_at <= ${end}
                    AND is_deleted = 0
                GROUP BY created_at::date
                ORDER BY created_at::date
            `,
            this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
                SELECT 
                    created_at::date as date,
                    COUNT(*) as count
                FROM "Call"
                WHERE organisation_id = ${orgId}
                    AND created_at >= ${start}
                    AND created_at <= ${end}
                    AND is_deleted = 0
                GROUP BY created_at::date
                ORDER BY created_at::date
            `
        ]);

        // Convert BigInt to number and create lookup maps
        const chatMap = new Map<string, number>();
        const callMap = new Map<string, number>();

        chatStats.forEach(stat => {
            // Handle both Date object and string formats
            const dateStr = typeof stat.date === 'string'
                ? stat.date
                : new Date(stat.date).toISOString().split('T')[0];
            chatMap.set(dateStr, Number(stat.count));
        });

        callStats.forEach(stat => {
            // Handle both Date object and string formats
            const dateStr = typeof stat.date === 'string'
                ? stat.date
                : new Date(stat.date).toISOString().split('T')[0];
            callMap.set(dateStr, Number(stat.count));
        });

        // Generate complete date range with counts (including zero days)
        const dailyStats: Array<{
            date: string;
            chatCount: number;
            callCount: number;
        }> = [];

        // Create date objects for iteration (normalize to avoid timezone issues)
        const currentDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];

            dailyStats.push({
                date: dateStr,
                chatCount: chatMap.get(dateStr) || 0,
                callCount: callMap.get(dateStr) || 0,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyStats;
    }

    async getOrganisationCalls(
        id_or_slug: string,
        filters: CallsFilterParams,
        isSuperAdmin: boolean = false
    ) {
        const { start_date, end_date, status, direction, source, page = 1, limit = 1000 } = filters;

        // Find organisation by id or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                    { slug: id_or_slug }
                ],
                ...(isSuperAdmin ? {} : { is_deleted: 0, is_disabled: 0 })
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        const orgId = organisation.id;

        // Build where condition for calls
        let whereCondition: CallWhereInput = {
            organisation_id: orgId,
            is_deleted: 0
        };

        // Date filter
        if (start_date || end_date) {
            whereCondition.started_at = {};
            if (start_date) {
                whereCondition.started_at.gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                whereCondition.started_at.lte = endDate;
            }
        }

        // Status filter
        if (status) {
            whereCondition.status = status;
        }

        // Direction filter
        if (direction) {
            whereCondition.direction = direction;
        }

        // Source filter
        if (source) {
            whereCondition.source = source as any;
        }

        // Get total count
        const total = await this.prisma.call.count({
            where: whereCondition
        });

        // Calculate stats
        const totalCalls = await this.prisma.call.count({
            where: {
                organisation_id: orgId,
                is_deleted: 0,
                ...(status ? { status: status } : {}),
                ...(start_date || end_date ? {
                    started_at: {
                        ...(start_date ? { gte: new Date(start_date) } : {}),
                        ...(end_date ? { lte: new Date(end_date + 'T23:59:59.999Z') } : {})
                    }
                } : {})
            }
        });

        const missedCalls = await this.prisma.call.count({
            where: {
                organisation_id: orgId,
                is_deleted: 0,
                status: 'missed',
                ...(start_date || end_date ? {
                    started_at: {
                        ...(start_date ? { gte: new Date(start_date) } : {}),
                        ...(end_date ? { lte: new Date(end_date + 'T23:59:59.999Z') } : {})
                    }
                } : {})
            }
        });

        const activeCalls = await this.prisma.call.count({
            where: {
                organisation_id: orgId,
                is_deleted: 0,
                status: 'active',
                ...(start_date || end_date ? {
                    started_at: {
                        ...(start_date ? { gte: new Date(start_date) } : {}),
                        ...(end_date ? { lte: new Date(end_date + 'T23:59:59.999Z') } : {})
                    }
                } : {})
            }
        });

        const disconnectedCalls = await this.prisma.call.count({
            where: {
                organisation_id: orgId,
                is_deleted: 0,
                status: 'disconnected',
                ...(start_date || end_date ? {
                    started_at: {
                        ...(start_date ? { gte: new Date(start_date) } : {}),
                        ...(end_date ? { lte: new Date(end_date + 'T23:59:59.999Z') } : {})
                    }
                } : {})
            }
        });

        // Get calls
        const calls = await this.prisma.call.findMany({
            where: whereCondition,
            include: {
                lead: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        source: true,
                        status: true,
                        created_at: true,
                        updated_at: true
                    }
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        phone_number: true,
                        created_at: true
                    }
                }
            },
            orderBy: {
                started_at: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

        // Get unique statuses for calls
        const statusesResult = await this.prisma.call.findMany({
            where: {
                organisation_id: orgId,
                is_deleted: 0,
                status: {
                    not: ''
                }
            },
            select: {
                status: true
            },
            distinct: ['status']
        });

        // Format as label-value arrays
        const call_statuses = statusesResult
            .filter(item => item.status)
            .map(item => ({
                label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                value: item.status
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        return {
            calls,
            stats: {
                total_calls: totalCalls,
                missed_calls: status && status !== "missed" ? 0 : missedCalls,
                active_calls: status && status !== "active" ? 0 : activeCalls,
                disconnected_calls: status && status !== "disconnected" ? 0 : disconnectedCalls
            },
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            },
            statuses: call_statuses
        };
    }

    async getCallDetails(
        id_or_slug: string,
        call_id: number,
        isSuperAdmin: boolean = false
    ) {
        // Find organisation by id or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                    { slug: id_or_slug }
                ],
                ...(isSuperAdmin ? {} : { is_deleted: 0, is_disabled: 0 })
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        // Get call details with all related data
        const call = await this.prisma.call.findFirst({
            where: {
                id: call_id,
                organisation_id: organisation.id,
                is_deleted: 0
            },
            include: {
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        created_at: true
                    }
                },
                lead: {
                    include: {
                        zoho_lead: true
                    }
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        phone_number: true,
                        image_url: true,
                        type: true,
                        created_at: true
                    }
                },
                messages: {
                    orderBy: {
                        created_at: 'asc'
                    },
                    select: {
                        id: true,
                        content: true,
                        role: true,
                        prompt_tokens: true,
                        completion_tokens: true,
                        total_cost: true,
                        created_at: true,
                        updated_at: true
                    }
                },
                costs: {
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        summary: true,
                        created_at: true
                    }
                }
            }
        });

        if (!call) {
            throw new NotFoundException('Call not found');
        }

        // Calculate comprehensive statistics
        const totalCost = call.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
        const totalTokens = call.messages.reduce((sum, msg) => sum + (msg.prompt_tokens + msg.completion_tokens), 0);
        const totalPromptTokens = call.messages.reduce((sum, msg) => sum + msg.prompt_tokens, 0);
        const totalCompletionTokens = call.messages.reduce((sum, msg) => sum + msg.completion_tokens, 0);

        // Message statistics by role
        const messageStats = call.messages.reduce((stats, msg) => {
            if (!stats[msg.role]) {
                stats[msg.role] = 0;
            }
            stats[msg.role]++;
            return stats;
        }, {} as Record<string, number>);

        // Cost breakdown by type
        const costBreakdown = call.costs.reduce((breakdown, cost) => {
            if (!breakdown[cost.type]) {
                breakdown[cost.type] = 0;
            }
            breakdown[cost.type] += cost.amount || 0;
            return breakdown;
        }, {} as Record<string, number>);

        const callStats = {
            total_messages: call.messages.length,
            message_breakdown: messageStats,
            duration_minutes: call.duration ? Math.round(call.duration / 60) : 0,
            duration_seconds: call.duration || 0,
            total_cost: totalCost,
            total_tokens: totalTokens,
            prompt_tokens: totalPromptTokens,
            completion_tokens: totalCompletionTokens,
            cost_breakdown_by_type: costBreakdown,
            detailed_costs: call.costs.map(cost => ({
                id: cost.id,
                type: cost.type,
                amount: cost.amount,
                summary: cost.summary,
                created_at: cost.created_at
            }))
        };

        return {
            id: call.id,
            status: call.status,
            source: call.source,
            direction: call.direction,
            from_number: call.from_number,
            to_number: call.to_number,
            started_at: call.started_at,
            ended_at: call.ended_at,
            duration: call.duration,
            summary: call.summary,
            analysis: call.analysis,
            recording_url: call.recording_url,
            call_ended_reason: call.call_ended_reason,
            total_cost: call.total_cost,
            created_at: call.created_at,
            updated_at: call.updated_at,
            organisation: call.organisation,
            lead: call.lead,
            agent: call.agent,
            messages: call.messages,
            stats: callStats
        };
    }

    async getOrganisationLeads(
        id_or_slug: string,
        filters: LeadsFilterParams,
        isSuperAdmin: boolean = false
    ) {
        const { start_date, end_date, status, source, is_indian, zoho_status, zoho_lead_owner, search, page = 1, limit = 1000 } = filters;

        // Find organisation by id or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                    { slug: id_or_slug }
                ],
                ...(isSuperAdmin ? {} : { is_deleted: 0, is_disabled: 0 })
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        const orgId = organisation.id;

        // Build where condition for leads
        let whereCondition: LeadWhereInput = {
            organisations: {
                some: {
                    id: orgId
                }
            },
            zoho_lead: {
                is_deleted: 0
            },
            is_deleted: 0
        };
        // Zoho status filter
        if (zoho_status) {
            whereCondition = {
                ...whereCondition,
                zoho_lead: {
                    status: zoho_status
                }
            };
        }
        // Zoho lead owner filter
        if (zoho_lead_owner) {
            whereCondition = {
                ...whereCondition,
                zoho_lead: {
                    lead_owner_id: zoho_lead_owner.toString()
                }
            };
        }

        if (zoho_status && zoho_lead_owner) {
            whereCondition = {
                ...whereCondition,
                zoho_lead: {
                    status: zoho_status,
                    lead_owner_id: zoho_lead_owner.toString()
                }
            };
        }

        // Date filter (using created_at)
        if (start_date || end_date) {
            whereCondition.created_at = {};
            if (start_date) {
                whereCondition.created_at.gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                whereCondition.created_at.lte = endDate;
            }
        }

        // Status filter
        if (status) {
            whereCondition.status = status;
        }

        // Source filter
        if (source) {
            whereCondition.source = source;
        }

        // Is Indian filter
        if (is_indian !== undefined) {
            whereCondition.is_indian = is_indian;
        }

        // Search filter - optimized for email, phone, and name fields
        if (search) {
            const searchTerm = search.trim();

            whereCondition.OR = [
                // Search in Lead table fields - Name fields
                {
                    first_name: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                {
                    last_name: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                // Email field
                {
                    email: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                // Phone field (always search, not just for numeric terms)
                {
                    phone_number: {
                        contains: searchTerm
                    }
                },
                // Search in ZohoLead table fields - Name fields
                {
                    zoho_lead: {
                        first_name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    zoho_lead: {
                        last_name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                // Email field in ZohoLead
                {
                    zoho_lead: {
                        email: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                // Phone field in ZohoLead (always search)
                {
                    zoho_lead: {
                        phone: {
                            contains: searchTerm
                        }
                    }
                }
            ];
        }

        // Get total count
        const total = await this.prisma.lead.count({
            where: whereCondition
        });

        // Helper to build stats filter
        const statsBaseFilter: any = {
            organisations: { some: { id: orgId } },
            is_deleted: 0
        };
        if (start_date || end_date) {
            statsBaseFilter.created_at = {};
            if (start_date) statsBaseFilter.created_at.gte = new Date(start_date);
            if (end_date) statsBaseFilter.created_at.lte = new Date(end_date + 'T23:59:59.999Z');
        }
        if (source) statsBaseFilter.source = source;
        if (is_indian !== undefined) statsBaseFilter.is_indian = is_indian;
        if (zoho_status) statsBaseFilter.zoho_lead = { ...statsBaseFilter.zoho_lead, status: zoho_status };
        if (zoho_lead_owner) statsBaseFilter.zoho_lead = { ...statsBaseFilter.zoho_lead, lead_owner: { id: zoho_lead_owner } };
        if (search) {
            const searchTerm = search.trim();

            statsBaseFilter.OR = [
                // Search in Lead table fields - Name fields
                {
                    first_name: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                {
                    last_name: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                // Email field
                {
                    email: {
                        contains: searchTerm,
                        mode: 'insensitive'
                    }
                },
                // Phone field (always search, not just for numeric terms)
                {
                    phone_number: {
                        contains: searchTerm
                    }
                },
                // Search in ZohoLead table fields - Name fields
                {
                    zoho_lead: {
                        first_name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    zoho_lead: {
                        last_name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                // Email field in ZohoLead
                {
                    zoho_lead: {
                        email: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                },
                // Phone field in ZohoLead (always search)
                {
                    zoho_lead: {
                        phone: {
                            contains: searchTerm
                        }
                    }
                }
            ];
        }

        // totalLeads: all matching
        const totalLeads = await this.prisma.lead.count({
            where: {
                ...statsBaseFilter,
                ...(status ? { status } : {})
            }
        });

        // newLeads: status 'new' + all filters
        const newLeads = await this.prisma.lead.count({
            where: {
                ...statsBaseFilter,
                status: 'new'
            }
        });

        // qualifiedLeads: status 'qualified' + all filters
        const qualifiedLeads = await this.prisma.lead.count({
            where: {
                ...statsBaseFilter,
                status: 'qualified'
            }
        });

        // junkLeads: status 'junk' + all filters
        const junkLeads = await this.prisma.lead.count({
            where: {
                ...statsBaseFilter,
                status: 'junk'
            }
        });

        // Get leads with related data
        const leads = await this.prisma.lead.findMany({
            where: whereCondition,
            include: {
                zoho_lead: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        status: true,
                        source: true,
                        disposition: true,
                        country: true,
                        state: true,
                        city: true,
                        requires_human_action: true,
                        is_handled_by_human: true,
                        created_at: true,
                        updated_at: true
                    }
                },
                calls: {
                    where: {
                        is_deleted: 0
                    },
                    select: {
                        id: true,
                        status: true,
                        direction: true,
                        started_at: true,
                        ended_at: true,
                        duration: true
                    },
                    orderBy: {
                        started_at: 'desc'
                    },
                },
                chats: {
                    where: {
                        is_deleted: 0
                    },
                    select: {
                        id: true,
                        status: true,
                        created_at: true,
                        updated_at: true
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

        // Get unique statuses and sources for metadata
        const statusesResult = await this.prisma.lead.findMany({
            where: {
                organisations: {
                    some: {
                        id: orgId
                    }
                },
                is_deleted: 0,
                status: {
                    not: null
                }
            },
            select: {
                status: true
            },
            distinct: ['status']
        });

        const zohoStatusesResult = await this.prisma.lead.findMany({
            where: {
                organisations: {
                    some: {
                        id: orgId
                    }
                },
                is_deleted: 0,
                zoho_lead: {
                    status: {
                        not: null
                    }
                }
            },
            select: {
                zoho_lead: {
                    select: {
                        status: true
                    }
                }
            }
        });

        // Prisma does not support distinct on nested fields like zoho_lead.status;
        // deduplicate the nested statuses client-side and format as label-value array.
        const zoho_statuses = Array.from(
            new Set(
                zohoStatusesResult
                    .map(item => item.zoho_lead?.status)
                    .filter((s): s is string => s !== null && s !== undefined && s !== '')
            )
        ).map(status => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status
        })).sort((a, b) => a.label.localeCompare(b.label));

        const sourcesResult = await this.prisma.lead.findMany({
            where: {
                organisations: {
                    some: {
                        id: orgId
                    }
                },
                is_deleted: 0,
                source: {
                    not: null
                }
            },
            select: {
                source: true
            },
            distinct: ['source']
        });

        // Format as label-value arrays
        const statuses = statusesResult
            .filter((item): item is { status: string } => item.status !== null && item.status !== undefined && item.status !== '')
            .map(item => ({
                label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                value: item.status
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        const sources = sourcesResult
            .filter((item): item is { source: string } => item.source !== null && item.source !== undefined && item.source !== '')
            .map(item => ({
                label: item.source.charAt(0).toUpperCase() + item.source.slice(1),
                value: item.source
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        // Get unique zoho lead owners
        const zohoLeadOwnersResult = await this.prisma.zohoLeadOwner.findMany({
            where: {
                zoho_leads: {
                    some: {
                        lead: {
                            organisations: {
                                some: {
                                    id: orgId
                                }
                            }
                        }
                    }
                },
                is_deleted: 0
            },
        });

        const zoho_lead_owners = zohoLeadOwnersResult.map(owner => ({
            label: owner.first_name + (owner.last_name ? ` ${owner.last_name}` : ''),
            value: owner.id
        }));

        return {
            leads: leads.map(lead => ({
                id: lead.id,
                first_name: lead.first_name,
                last_name: lead.last_name,
                full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || null,
                email: lead.email,
                phone_number: lead.phone_number,
                source: lead.source,
                status: lead.status,
                is_indian: lead.is_indian,
                follow_up_count: lead.follow_up_count,
                reschedule_count: lead.reschedule_count,
                last_follow_up: lead.last_follow_up,
                next_follow_up: lead.next_follow_up,
                call_active: lead.call_active,
                created_at: lead.created_at,
                updated_at: lead.updated_at,
                zoho_lead: lead.zoho_lead,
                latest_call: lead.calls[0] || null,
                latest_chat: lead.chats[0] || null,
                total_calls: lead.calls.length,
                total_chats: lead.chats.length
            })),
            stats: {
                total_leads: totalLeads,
                new_leads: status && status !== "new" ? 0 : newLeads,
                qualified_leads: status && status !== "qualified" ? 0 : qualifiedLeads,
                junk_leads: status && status !== "junk" ? 0 : junkLeads
            },
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            },
            status: statuses,
            sources,
            zoho_statuses,
            zoho_lead_owners
        };
    }

    async getLeadDetails(
        id_or_slug: string,
        id_or_phone: string,
        isSuperAdmin: boolean = false
    ) {
        // Find organisation by id or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                    { slug: id_or_slug }
                ],
                ...(isSuperAdmin ? {} : { is_deleted: 0, is_disabled: 0 })
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        // Determine if id_or_phone is a phone number (exactly 10 digits) or an ID
        const isPhoneNumber = /^\d{10}$/.test(id_or_phone);

        // Get lead details with all related data
        const lead = await this.prisma.lead.findFirst({
            where: {
                ...(isPhoneNumber
                    ? { phone_number: id_or_phone }
                    : { id: parseInt(id_or_phone) }
                ),
                organisations: {
                    some: {
                        id: organisation.id
                    }
                },
                is_deleted: 0
            },
            include: {
                organisations: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                zoho_lead: {
                    include: {
                        lead_owner: true
                    }
                },
                agents: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        type: true,
                        image_url: true
                    }
                },
                calls: {
                    where: {
                        is_deleted: 0
                    },
                    include: {
                        agent: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        },
                        costs: {
                            select: {
                                amount: true,
                                type: true
                            }
                        }
                    },
                    orderBy: {
                        started_at: 'desc'
                    }
                },
                chats: {
                    where: {
                        is_deleted: 0
                    },
                    include: {
                        agent: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Calculate comprehensive statistics
        const totalCalls = lead.calls.length;
        const totalChats = lead.chats.length;
        const totalCallCost = lead.calls.reduce((sum, call) => {
            return sum + call.costs.reduce((callSum, cost) => callSum + (cost.amount || 0), 0);
        }, 0);
        const totalChatCost = lead.chats.reduce((sum, chat) => sum + (chat.total_cost || 0), 0);

        // Call statistics by status
        const callStats = lead.calls.reduce((stats, call) => {
            if (!stats[call.status]) {
                stats[call.status] = 0;
            }
            stats[call.status]++;
            return stats;
        }, {} as Record<string, number>);

        // Chat statistics by status  
        const chatStats = lead.chats.reduce((stats, chat) => {
            if (!stats[chat.status]) {
                stats[chat.status] = 0;
            }
            stats[chat.status]++;
            return stats;
        }, {} as Record<string, number>);

        // Latest activity
        const latestCall = lead.calls[0] || null;
        const latestChat = lead.chats[0] || null;

        return {
            // Basic lead info
            id: lead.id,
            first_name: lead.first_name,
            last_name: lead.last_name,
            full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || null,
            email: lead.email,
            phone_number: lead.phone_number,
            source: lead.source,
            status: lead.status,
            is_indian: lead.is_indian,
            follow_up_count: lead.follow_up_count,
            reschedule_count: lead.reschedule_count,
            last_follow_up: lead.last_follow_up,
            next_follow_up: lead.next_follow_up,
            call_active: lead.call_active,
            created_at: lead.created_at,
            updated_at: lead.updated_at,

            // Related data
            organisations: lead.organisations,
            zoho_lead: lead.zoho_lead,
            assigned_agents: lead.agents,

            // Activity data
            calls: lead.calls.map(call => ({
                id: call.id,
                status: call.status,
                source: call.source,
                direction: call.direction,
                from_number: call.from_number,
                to_number: call.to_number,
                started_at: call.started_at,
                ended_at: call.ended_at,
                duration: call.duration,
                summary: call.summary,
                analysis: call.analysis,
                recording_url: call.recording_url,
                call_ended_reason: call.call_ended_reason,
                total_cost: call.total_cost,
                agent: call.agent,
                calculated_cost: call.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
            })),
            chats: lead.chats.map(chat => ({
                id: chat.id,
                status: chat.status,
                source: chat.source,
                instagram_id: chat.instagram_id,
                whatsapp_id: chat.whatsapp_id,
                human_handled: chat.human_handled,
                unread_messages: chat.unread_messages,
                summary: chat.summary,
                analysis: chat.analysis,
                prompt_tokens: chat.prompt_tokens,
                completion_tokens: chat.completion_tokens,
                total_cost: chat.total_cost,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                agent: chat.agent
            })),

            // Statistics
            stats: {
                total_calls: totalCalls,
                total_chats: totalChats,
                total_interactions: totalCalls + totalChats,
                total_call_cost: totalCallCost,
                total_chat_cost: totalChatCost,
                total_cost: totalCallCost + totalChatCost,
                call_breakdown: callStats,
                chat_breakdown: chatStats,
                latest_activity: {
                    latest_call: latestCall ? {
                        id: latestCall.id,
                        status: latestCall.status,
                        started_at: latestCall.started_at,
                        duration: latestCall.duration
                    } : null,
                    latest_chat: latestChat ? {
                        id: latestChat.id,
                        status: latestChat.status,
                        created_at: latestChat.created_at,
                        total_cost: latestChat.total_cost
                    } : null
                }
            }
        };
    }

    async getOrganisationPriorityLeads(
        id_or_slug: string,
        limit: number = 1000,
    ) {
        // Find organisation by id or slug
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                    { slug: id_or_slug }
                ],
            },
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        const currentTime = new Date();

        const leads = await this.prisma.lead.findMany({
            where: {
                organisations: {
                    some: {
                        id: organisation.id
                    }
                },
                is_deleted: 0,
                next_follow_up: {
                    lte: currentTime
                },
                call_active: 0
            },
            orderBy: {
                next_follow_up: 'asc'
            },
            take: limit,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                phone_number: true,
                email: true,
                status: true,
                source: true,
                next_follow_up: true,
                is_indian: true,
                reschedule_count: true,
                created_at: true,
                updated_at: true,
                zoho_lead: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        status: true,
                        source: true,
                        disposition: true,
                        country: true,
                        state: true,
                        city: true,
                        requires_human_action: true,
                        is_handled_by_human: true,
                        lead_owner: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return {
            data: leads,
            total: leads.length,
            organisation: {
                id: organisation.id,
                name: organisation.name,
                slug: organisation.slug
            }
        };
    }

    async getOrganisationChatsForAnalysis(
        idOrSlug: string,
        filters: { startDate?: string; endDate?: string }
    ) {
        this.logger.log(`Starting getOrganisationChatsForAnalysis for: ${idOrSlug}, filters: ${JSON.stringify(filters)}`);

        try {
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            // Find organisation by ID or slug
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Calculate 5 minutes ago from current time
            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes in milliseconds

            this.logger.log(`Looking for chats with messages after: ${tenMinutesAgo.toISOString()}`);

            const orgId = organisation.id;

            // Find chats that have any message in the last 10 minutes
            const chats = await this.prisma.chat.findMany({
                where: {
                    organisation_id: orgId,
                    is_deleted: 0,
                    messages: {
                        some: {
                            created_at: {
                                gte: tenMinutesAgo
                            },
                            is_deleted: 0
                        }
                    }
                },
                include: {
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            email: true,
                            source: true,
                            status: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    messages: {
                        where: {
                            created_at: {
                                gte: tenMinutesAgo
                            },
                            is_deleted: 0
                        },
                        select: {
                            id: true,
                            role: true,
                            content: true,
                            message_type: true,
                            created_at: true,
                            prompt_tokens: true,
                            completion_tokens: true,
                            total_cost: true,
                            attachments: {
                                select: {
                                    id: true,
                                    file_url: true,
                                    file_name: true,
                                    file_type: true,
                                    file_size: true,
                                    created_at: true
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    },
                    _count: {
                        select: {
                            messages: {
                                where: {
                                    created_at: {
                                        gte: tenMinutesAgo
                                    },
                                    is_deleted: 0
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    {
                        updated_at: 'desc'
                    },
                    {
                        created_at: 'desc'
                    }
                ]
            });

            // Transform the chats data
            const transformedChats = chats.map(chat => ({
                id: chat.id,
                status: chat.status,
                source: chat.source,
                instagram_id: chat.instagram_id,
                whatsapp_id: chat.whatsapp_id,
                name: chat.lead
                    ? `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim() || null
                    : chat.name || null,
                human_handled: chat.human_handled,
                unread_messages: chat.unread_messages,
                prompt_tokens: chat.prompt_tokens,
                completion_tokens: chat.completion_tokens,
                total_cost: chat.total_cost,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                lead: chat.lead,
                agent: chat.agent,
                recent_messages: chat.messages,
                recent_message_count: chat._count.messages,
                summary: chat.summary,
                analysis: chat.analysis
            }));

            const result = {
                organisation: {
                    id: organisation.id,
                    name: organisation.name,
                    slug: organisation.slug
                },
                chats: transformedChats,
                metadata: {
                    total_chats: transformedChats.length,
                    time_window_minutes: 10,
                    search_time: tenMinutesAgo.toISOString(),
                    current_time: now.toISOString()
                }
            };

            this.logger.log(`Found ${transformedChats.length} chats with recent activity for organisation ${orgId}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getOrganisationChatsForAnalysis for ${idOrSlug}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async updateOrganisation(
        id_or_slug: string,
        updateData: {
            name?: string;
            slug?: string;
            chat_credits?: number;
            call_credits?: number;
            updated_by_user?: string;
            active_indian_calls?: number;
            active_international_calls?: number;
            available_indian_channels?: number;
            available_international_channels?: number;
            expenses?: number;
            is_disabled?: number;
            is_deleted?: number;
        },
    ) {
        this.logger.log(`Updating organisation: ${id_or_slug} with data: ${JSON.stringify(updateData)}`);

        try {
            // Find organisation by id or slug
            this.logger.log(`Searching for organisation to update: ${id_or_slug}`);
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(parseInt(id_or_slug)) ? undefined : parseInt(id_or_slug) },
                        { slug: id_or_slug }
                    ],
                }
            });

            if (!organisation) {
                this.logger.error(`Organisation not found for update: ${id_or_slug}`);
                throw new NotFoundException('Organisation not found');
            }

            this.logger.log(`Found organisation for update: ${organisation.name} (ID: ${organisation.id})`);

            // Update organisation
            this.logger.log(`Executing update for organisation ${organisation.id}`);
            const updatedOrganisation = await this.prisma.organisation.update({
                where: { id: organisation.id },
                data: {
                    ...updateData,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    chat_credits: true,
                    call_credits: true,
                    updated_by_user: true,
                    active_indian_calls: true,
                    active_international_calls: true,
                    available_indian_channels: true,
                    available_international_channels: true,
                    expenses: true,
                    is_disabled: true,
                    is_deleted: true,
                    created_at: true,
                    updated_at: true,
                }
            });

            this.logger.log(`Successfully updated organisation: ${organisation.id}`);

            return {
                message: 'Organisation updated successfully',
                data: updatedOrganisation
            };

        } catch (error) {
            this.logger.error(`Error in updateOrganisation for ${id_or_slug}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async addChatTags(
        idOrSlug: string,
        chatIdOrExternalId: string,
        tagIds: number[],
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Adding tags to chat ${chatIdOrExternalId} in organisation ${idOrSlug}`);

        try {
            // Find organisation
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Check permissions
            if (!isSuperAdmin) {
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    throw new NotFoundException('Organisation not found');
                }
            }

            const orgId = organisation.id;

            // Find the chat
            const chat = await this.prisma.chat.findFirst({
                where: {
                    OR: [
                        { id: chatIdOrExternalId.length > 6 ? undefined : parseInt(chatIdOrExternalId) },
                        { whatsapp_id: chatIdOrExternalId },
                        { instagram_id: chatIdOrExternalId },
                    ],
                    organisation_id: orgId,
                    is_deleted: 0,
                },
            });

            if (!chat) {
                throw new NotFoundException('Chat not found');
            }

            // Validate that all tags exist and belong to the organisation
            const tags = await this.prisma.tag.findMany({
                where: {
                    id: { in: tagIds },
                    organisation_id: orgId,
                    is_deleted: 0,
                },
            });

            if (tags.length !== tagIds.length) {
                throw new NotFoundException('One or more tags not found or do not belong to this organisation');
            }

            // Get existing tag associations
            const existingTags = await this.prisma.chat.findUnique({
                where: { id: chat.id },
                select: {
                    tags: {
                        where: { is_deleted: 0 },
                        select: { id: true },
                    },
                },
            });

            const existingTagIds = existingTags?.tags.map(t => t.id) || [];
            const newTagIds = tagIds.filter(id => !existingTagIds.includes(id));

            if (newTagIds.length === 0) {
                this.logger.log(`All tags already associated with chat ${chat.id}`);
                return {
                    message: 'All tags are already associated with this chat',
                    data: {
                        chat_id: chat.id,
                        added_tags: [],
                        existing_tags: existingTagIds,
                    },
                };
            }

            // Add new tags using connect
            const updatedChat = await this.prisma.chat.update({
                where: { id: chat.id },
                data: {
                    tags: {
                        connect: newTagIds.map(id => ({ id })),
                    },
                    updated_at: new Date(),
                },
                include: {
                    tags: {
                        where: { is_deleted: 0 },
                        select: {
                            id: true,
                            name: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                },
            });

            this.logger.log(`Successfully added ${newTagIds.length} tags to chat ${chat.id}`);

            return {
                message: 'Tags added successfully',
                data: {
                    chat_id: updatedChat.id,
                    added_tags: newTagIds,
                    all_tags: updatedChat.tags,
                },
            };

        } catch (error) {
            this.logger.error(`Error adding tags to chat ${chatIdOrExternalId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async removeChatTags(
        idOrSlug: string,
        chatIdOrExternalId: string,
        tagIds: number[],
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Removing tags from chat ${chatIdOrExternalId} in organisation ${idOrSlug}`);

        try {
            // Find organisation
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Check permissions
            if (!isSuperAdmin) {
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    throw new NotFoundException('Organisation not found');
                }
            }

            const orgId = organisation.id;

            // Find the chat
            const chat = await this.prisma.chat.findFirst({
                where: {
                    OR: [
                        { id: chatIdOrExternalId.length > 6 ? undefined : parseInt(chatIdOrExternalId) },
                        { whatsapp_id: chatIdOrExternalId },
                        { instagram_id: chatIdOrExternalId },
                    ],
                    organisation_id: orgId,
                    is_deleted: 0,
                },
            });

            if (!chat) {
                throw new NotFoundException('Chat not found');
            }

            // Validate that all tags exist and belong to the organisation
            const tags = await this.prisma.tag.findMany({
                where: {
                    id: { in: tagIds },
                    organisation_id: orgId,
                    is_deleted: 0,
                },
            });

            if (tags.length !== tagIds.length) {
                throw new NotFoundException('One or more tags not found or do not belong to this organisation');
            }

            // Get existing tag associations
            const existingTags = await this.prisma.chat.findUnique({
                where: { id: chat.id },
                select: {
                    tags: {
                        where: { is_deleted: 0 },
                        select: { id: true },
                    },
                },
            });

            const existingTagIds = existingTags?.tags.map(t => t.id) || [];
            const tagsToRemove = tagIds.filter(id => existingTagIds.includes(id));

            if (tagsToRemove.length === 0) {
                this.logger.log(`None of the specified tags are associated with chat ${chat.id}`);
                return {
                    message: 'None of the specified tags are associated with this chat',
                    data: {
                        chat_id: chat.id,
                        removed_tags: [],
                        remaining_tags: existingTagIds,
                    },
                };
            }

            // Remove tags using disconnect
            const updatedChat = await this.prisma.chat.update({
                where: { id: chat.id },
                data: {
                    tags: {
                        disconnect: tagsToRemove.map(id => ({ id })),
                    },
                    updated_at: new Date(),
                },
                include: {
                    tags: {
                        where: { is_deleted: 0 },
                        select: {
                            id: true,
                            name: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                },
            });

            this.logger.log(`Successfully removed ${tagsToRemove.length} tags from chat ${chat.id}`);

            return {
                message: 'Tags removed successfully',
                data: {
                    chat_id: updatedChat.id,
                    removed_tags: tagsToRemove,
                    remaining_tags: updatedChat.tags,
                },
            };

        } catch (error) {
            this.logger.error(`Error removing tags from chat ${chatIdOrExternalId}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async getOrganisationTags(
        idOrSlug: string,
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Getting all tags for organisation ${idOrSlug}`);

        try {
            // Find organisation
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Check permissions
            if (!isSuperAdmin) {
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    throw new NotFoundException('Organisation not found');
                }
            }

            // Fetch all tags for the organisation
            const tags = await this.prisma.tag.findMany({
                where: {
                    organisation_id: organisation.id,
                    is_deleted: 0,
                },
                select: {
                    id: true,
                    name: true,
                    created_at: true,
                    updated_at: true,
                    _count: {
                        select: {
                            chats: {
                                where: {
                                    is_deleted: 0,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });

            this.logger.log(`Found ${tags.length} tags for organisation ${organisation.id}`);

            return {
                message: 'Tags retrieved successfully',
                data: {
                    organisation: {
                        id: organisation.id,
                        name: organisation.name,
                        slug: organisation.slug,
                    },
                    tags: tags.map(tag => ({
                        id: tag.id,
                        name: tag.name,
                        chat_count: tag._count.chats,
                        created_at: tag.created_at,
                        updated_at: tag.updated_at,
                    })),
                    total: tags.length,
                },
            };

        } catch (error) {
            this.logger.error(`Error getting tags for organisation ${idOrSlug}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async updateChatHandover(
        idOrSlug: string,
        chatIdOrExternalId: string,
        humanHandled: number,
        isSuperAdmin: boolean = false
    ) {
        this.logger.log(`Updating chat handover status for chat ${chatIdOrExternalId} in organisation ${idOrSlug} to ${humanHandled}`);

        try {
            // Find organisation
            const id = Number(idOrSlug);
            const slug = idOrSlug;

            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { id: isNaN(id) ? undefined : id },
                        { slug: slug }
                    ]
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }

            // Check permissions
            if (!isSuperAdmin) {
                if (organisation.is_deleted === 1 || organisation.is_disabled === 1) {
                    throw new NotFoundException('Organisation not found');
                }
            }

            const orgId = organisation.id;

            // Find the chat
            const chat = await this.prisma.chat.findFirst({
                where: {
                    OR: [
                        { id: chatIdOrExternalId.length > 6 ? undefined : parseInt(chatIdOrExternalId) },
                        { whatsapp_id: chatIdOrExternalId },
                        { instagram_id: chatIdOrExternalId },
                    ],
                    organisation_id: orgId,
                    is_deleted: 0,
                },
            });

            if (!chat) {
                throw new NotFoundException('Chat not found');
            }

            // Validate human_handled value (should be 0 or 1)
            if (humanHandled !== 0 && humanHandled !== 1) {
                throw new Error('human_handled must be 0 or 1');
            }

            // Update the chat
            const updatedChat = await this.prisma.chat.update({
                where: { id: chat.id },
                data: {
                    human_handled: humanHandled,
                    updated_at: new Date(),
                },
                select: {
                    id: true,
                    human_handled: true,
                    status: true,
                    source: true,
                    updated_at: true,
                },
            });

            this.logger.log(`Successfully updated chat ${chat.id} handover status to ${humanHandled}`);

            return {
                success: true,
                message: `Chat handover status updated successfully`,
                data: {
                    id: updatedChat.id,
                    human_handled: updatedChat.human_handled,
                    status: updatedChat.status,
                    source: updatedChat.source,
                    updated_at: updatedChat.updated_at,
                },
            };

        } catch (error) {
            this.logger.error(`Error updating chat handover status for ${chatIdOrExternalId}: ${error.message}`, error.stack);
            throw error;
        }
    }

}