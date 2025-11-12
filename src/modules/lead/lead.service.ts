import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
    GetLeadsFilters,
    CreateLeadData,
    UpdateLeadData,
    GetLeadCallsFilters,
    GetLeadChatsFilters
} from './types';

@Injectable()
export class LeadService {
    constructor(private readonly prisma: PrismaService) { }

    private async findLeadByIdOrPhone(idOrPhone: string) {
        return await this.prisma.lead.findFirst({
            where: {
                OR: [
                    { phone_number: idOrPhone },
                    { id: idOrPhone.length > 8 ? undefined : parseInt(idOrPhone, 10) }
                ],
                is_deleted: 0
            }
        });
    }

    async getAllLeads(filters: GetLeadsFilters) {
        const { page = 1, limit = 1000, status, source, is_indian, start_date, end_date } = filters;

        // Build where condition
        const whereCondition = {
            is_deleted: 0,
            ...(status && { status }),
            ...(source && { source }),
            ...(is_indian !== undefined && { is_indian }),
            ...(start_date || end_date ? {
                created_at: {
                    ...(start_date && { gte: new Date(start_date) }),
                    ...(end_date && {
                        lte: (() => {
                            const endDate = new Date(end_date);
                            endDate.setHours(23, 59, 59, 999);
                            return endDate;
                        })()
                    })
                }
            } : {})
        };

        // Get total count
        const total = await this.prisma.lead.count({
            where: whereCondition
        });

        // Calculate stats
        const totalLeads = await this.prisma.lead.count({
            where: { is_deleted: 0 }
        });

        const newLeads = await this.prisma.lead.count({
            where: { is_deleted: 0, status: 'new' }
        });

        const qualifiedLeads = await this.prisma.lead.count({
            where: { is_deleted: 0, status: 'qualified' }
        });

        const junkLeads = await this.prisma.lead.count({
            where: { is_deleted: 0, status: 'junk' }
        });

        // Get leads
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
                        city: true
                    }
                },
                organisations: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

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
                organisations: lead.organisations
            })),
            stats: {
                total_leads: totalLeads,
                new_leads: newLeads,
                qualified_leads: qualifiedLeads,
                junk_leads: junkLeads
            },
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    async getOne(idOrPhone: string) {
        const lead = await this.prisma.lead.findFirst({
            where: {
                OR: [
                    { phone_number: idOrPhone },
                    { id: idOrPhone.length > 8 ? undefined : parseInt(idOrPhone, 10) }
                ],
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
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        started_at: 'desc'
                    },
                    take: 10
                },
                chats: {
                    where: {
                        is_deleted: 0
                    },
                    include: {
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
                    take: 10
                }
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Calculate statistics
        const totalCalls = await this.prisma.call.count({
            where: {
                lead_id: lead.id,
                is_deleted: 0
            }
        });

        const totalChats = await this.prisma.chat.count({
            where: {
                lead_id: lead.id,
                is_deleted: 0
            }
        });

        return {
            ...lead,
            organisations: lead.organisations,
            zoho_lead: lead.zoho_lead,
            assigned_agents: lead.agents,
            recent_calls: lead.calls,
            recent_chats: lead.chats,
            stats: {
                total_calls: totalCalls,
                total_chats: totalChats,
                total_interactions: totalCalls + totalChats
            }
        };
    }

    async getLeadById(id: number) {
        const lead = await this.prisma.lead.findFirst({
            where: {
                id: id,
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
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        started_at: 'desc'
                    },
                    take: 10
                },
                chats: {
                    where: {
                        is_deleted: 0
                    },
                    include: {
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
                    take: 10
                }
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Calculate statistics
        const totalCalls = await this.prisma.call.count({
            where: {
                lead_id: id,
                is_deleted: 0
            }
        });

        const totalChats = await this.prisma.chat.count({
            where: {
                lead_id: id,
                is_deleted: 0
            }
        });

        return {
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
            organisations: lead.organisations,
            zoho_lead: lead.zoho_lead,
            assigned_agents: lead.agents,
            recent_calls: lead.calls,
            recent_chats: lead.chats,
            stats: {
                total_calls: totalCalls,
                total_chats: totalChats,
                total_interactions: totalCalls + totalChats
            }
        };
    }

    async createLead(createLeadDto: CreateLeadData) {
        const { organisations, zoho_lead_owner, zoho_lead, remove_follow_up, next_follow_up, ...leadData } = createLeadDto;

        // Validate required fields
        if (!leadData.phone_number) {
            throw new BadRequestException('Phone number is required');
        }

        // Check if lead with phone number already exists
        const existingLead = await this.prisma.lead.findUnique({
            where: {
                phone_number: leadData.phone_number
            }
        });

        if (existingLead) {
            throw new BadRequestException('Lead with this phone number already exists');
        }

        // Start transaction to create lead and related data
        const result = await this.prisma.$transaction(async (prisma) => {
            // Create lead first
            const lead = await prisma.lead.create({
                data: {
                    ...leadData,
                    organisations: organisations ? {
                        connect: organisations.map(slug => ({ slug }))
                    } : undefined,
                    ...(remove_follow_up === 1 ? { next_follow_up: null } : next_follow_up ? { next_follow_up: new Date(next_follow_up) } : {}),

                }
            });

            // Handle Zoho Lead Owner creation/update if provided
            let createdZohoLeadOwner: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; } | null = null;
            if (zoho_lead_owner) {
                const { id: zoho_owner_id, ...ownerData } = zoho_lead_owner;

                if (zoho_owner_id) {
                    // Check if owner exists, create or update
                    const existingOwner = await prisma.zohoLeadOwner.findUnique({
                        where: { id: zoho_owner_id }
                    });

                    if (existingOwner) {
                        createdZohoLeadOwner = await prisma.zohoLeadOwner.update({
                            where: { id: zoho_owner_id },
                            data: ownerData
                        });
                    } else {
                        createdZohoLeadOwner = await prisma.zohoLeadOwner.create({
                            data: {
                                id: zoho_owner_id,
                                ...ownerData
                            }
                        });
                    }
                } else {
                    throw new BadRequestException('Zoho lead owner ID is required');
                }
            }

            // Handle Zoho Lead creation/update if provided
            if (zoho_lead) {
                const { id: zoho_lead_id, ...zohoLeadData } = zoho_lead;

                if (zoho_lead_id) {
                    // Check if zoho lead exists
                    const existingZohoLead = await prisma.zohoLead.findUnique({
                        where: { id: zoho_lead_id }
                    });

                    let zohoLeadCreateData: any = {
                        ...zohoLeadData,
                        lead_id: lead.id,
                    };

                    // Only add lead_owner_id if we have a created/updated owner
                    if (createdZohoLeadOwner) {
                        zohoLeadCreateData.lead_owner_id = createdZohoLeadOwner.id;
                    }

                    if (existingZohoLead) {
                        await prisma.zohoLead.update({
                            where: { id: zoho_lead_id },
                            data: zohoLeadCreateData
                        });
                    } else {
                        await prisma.zohoLead.create({
                            data: {
                                id: zoho_lead_id,
                                ...zohoLeadCreateData
                            }
                        });
                    }
                } else {
                    throw new BadRequestException('Zoho lead ID is required');
                }
            }

            // Return the created lead with all relationships
            return await prisma.lead.findUnique({
                where: { id: lead.id },
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
                    }
                }
            });
        });

        if (!result) {
            throw new Error('Failed to create lead');
        }

        return {
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            full_name: `${result.first_name || ''} ${result.last_name || ''}`.trim() || null,
            email: result.email,
            phone_number: result.phone_number,
            source: result.source,
            status: result.status,
            is_indian: result.is_indian,
            follow_up_count: result.follow_up_count,
            reschedule_count: result.reschedule_count,
            last_follow_up: result.last_follow_up,
            next_follow_up: result.next_follow_up,
            call_active: result.call_active,
            created_at: result.created_at,
            updated_at: result.updated_at,
            organisations: result.organisations,
            zoho_lead: result.zoho_lead
        };
    }

    async updateLead(id: number, updateLeadDto: UpdateLeadData) {
        const { organisations, zoho_lead_owner, zoho_lead, remove_follow_up, next_follow_up, ...leadData } = updateLeadDto;

        // Check if lead exists
        const existingLead = await this.prisma.lead.findFirst({
            where: {
                id: id,
                is_deleted: 0
            },
            include: {
                zoho_lead: {
                    include: {
                        lead_owner: true
                    }
                }
            }
        });

        if (!existingLead) {
            throw new NotFoundException('Lead not found');
        }

        // If updating phone number, check for duplicates
        if (leadData.phone_number && leadData.phone_number !== existingLead.phone_number) {
            const phoneExists = await this.prisma.lead.findUnique({
                where: {
                    phone_number: leadData.phone_number
                }
            });

            if (phoneExists) {
                throw new BadRequestException('Lead with this phone number already exists');
            }
        }

        // Start transaction to update lead and related data
        const result = await this.prisma.$transaction(async (prisma) => {
            // Handle Zoho Lead Owner update/creation if provided
            let updatedZohoLeadOwner: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; } | null = null;
            if (zoho_lead_owner) {
                const { id: zoho_owner_id, ...ownerData } = zoho_lead_owner;

                if (zoho_owner_id) {
                    // Check if owner exists, create or update
                    const existingOwner = await prisma.zohoLeadOwner.findUnique({
                        where: { id: zoho_owner_id }
                    });

                    if (existingOwner) {
                        updatedZohoLeadOwner = await prisma.zohoLeadOwner.update({
                            where: { id: zoho_owner_id },
                            data: ownerData
                        });
                    } else {
                        updatedZohoLeadOwner = await prisma.zohoLeadOwner.create({
                            data: {
                                id: zoho_owner_id,
                                ...ownerData
                            }
                        });
                    }
                } else {
                    throw new BadRequestException('Zoho lead owner ID is required');
                }
            }

            // Handle Zoho Lead update/creation if provided
            if (zoho_lead) {
                const { id: zoho_lead_id, ...zohoLeadData } = zoho_lead;

                if (zoho_lead_id) {
                    // Check if zoho lead exists
                    const existingZohoLead = await prisma.zohoLead.findUnique({
                        where: { id: zoho_lead_id }
                    });

                    let zohoLeadUpdateData: any = {
                        ...zohoLeadData,
                        lead_id: id,
                    };

                    // Update lead_owner_id if new owner was created/updated
                    if (updatedZohoLeadOwner) {
                        zohoLeadUpdateData.lead_owner_id = updatedZohoLeadOwner.id;
                    }

                    if (existingZohoLead) {
                        await prisma.zohoLead.update({
                            where: { id: zoho_lead_id },
                            data: zohoLeadUpdateData
                        });
                    } else {
                        await prisma.zohoLead.create({
                            data: {
                                id: zoho_lead_id,
                                ...zohoLeadUpdateData
                            }
                        });
                    }
                } else {
                    throw new BadRequestException('Zoho lead ID is required');
                }
            } else if (updatedZohoLeadOwner && existingLead.zoho_lead) {
                // If only owner was updated but zoho_lead exists, update the owner reference
                await prisma.zohoLead.update({
                    where: { id: existingLead.zoho_lead.id },
                    data: {
                        lead_owner_id: updatedZohoLeadOwner.id
                    }
                });
            }

            // Update the main lead record
            return await prisma.lead.update({
                where: {
                    id: id
                },
                data: {
                    ...leadData,
                    ...(organisations ? {
                        organisations: {
                            set: organisations.map(slug => ({ slug }))
                        }
                    } : {}),
                    ...(remove_follow_up === 1 ? { next_follow_up: null } : next_follow_up ? { next_follow_up: new Date(next_follow_up) } : {}),
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
                    }
                }
            });
        });

        if (!result) {
            throw new Error('Failed to update lead');
        }

        return {
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            full_name: `${result.first_name || ''} ${result.last_name || ''}`.trim() || null,
            email: result.email,
            phone_number: result.phone_number,
            source: result.source,
            status: result.status,
            is_indian: result.is_indian,
            follow_up_count: result.follow_up_count,
            reschedule_count: result.reschedule_count,
            last_follow_up: result.last_follow_up,
            next_follow_up: result.next_follow_up,
            call_active: result.call_active,
            created_at: result.created_at,
            updated_at: result.updated_at,
            organisations: result.organisations,
            zoho_lead: result.zoho_lead
        };
    }

    async deleteLead(id: number) {
        // Check if lead exists
        const existingLead = await this.prisma.lead.findFirst({
            where: {
                id: id,
                is_deleted: 0
            }
        });

        if (!existingLead) {
            throw new NotFoundException('Lead not found');
        }

        // Soft delete the lead
        await this.prisma.lead.update({
            where: {
                id: id
            },
            data: {
                is_deleted: 1
            }
        });

        return {
            message: 'Lead deleted successfully',
            id: id
        };
    }

    // Unified methods that handle both ID and phone
    async updateOne(idOrPhone: string, updateLeadDto: UpdateLeadData) {
        // Find lead first
        const lead = await this.findLeadByIdOrPhone(idOrPhone);
        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return this.updateLead(lead.id, updateLeadDto);
    }

    async deleteOne(idOrPhone: string) {
        // Find lead first
        const lead = await this.findLeadByIdOrPhone(idOrPhone);
        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return this.deleteLead(lead.id);
    }

    async getCallsOne(idOrPhone: string, filters: GetLeadCallsFilters) {
        // Find lead first
        const lead = await this.findLeadByIdOrPhone(idOrPhone);
        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return this.getCalls(lead.id, filters);
    }

    async getChatsOne(idOrPhone: string, filters: GetLeadChatsFilters) {
        // Find lead first
        const lead = await this.findLeadByIdOrPhone(idOrPhone);
        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return this.getChats(lead.id, filters);
    }

    async getCalls(leadId: number, filters: GetLeadCallsFilters) {
        const { page = 1, limit = 1000, status, direction } = filters;

        // Check if lead exists
        const lead = await this.prisma.lead.findFirst({
            where: {
                id: leadId,
                is_deleted: 0
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Build where condition
        const whereCondition = {
            lead_id: leadId,
            is_deleted: 0,
            ...(status && { status }),
            ...(direction && { direction })
        };

        // Get total count
        const total = await this.prisma.call.count({
            where: whereCondition
        });

        // Get calls
        const calls = await this.prisma.call.findMany({
            where: whereCondition,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                started_at: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            calls: calls,
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    async getChats(leadId: number, filters: GetLeadChatsFilters) {
        const { page = 1, limit = 1000, status, source } = filters;

        // Check if lead exists
        const lead = await this.prisma.lead.findFirst({
            where: {
                id: leadId,
                is_deleted: 0
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Build where condition
        const whereCondition = {
            lead_id: leadId,
            is_deleted: 0,
            ...(status && { status }),
            ...(source && { source })
        };

        // Get total count
        const total = await this.prisma.chat.count({
            where: whereCondition
        });

        // Get chats
        const chats = await this.prisma.chat.findMany({
            where: whereCondition,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            chats: chats,
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }
}