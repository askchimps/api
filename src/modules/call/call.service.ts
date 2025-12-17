import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, CALL_SOURCE, COST_TYPE } from '@prisma/public-client';
import { CallFilterParams, CreateMessageData, CreateCostData, UpdateMessageData, UpdateCostData } from './types/service-interfaces';

@Injectable()
export class CallService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllCalls(filters: CallFilterParams) {
        const {
            page,
            limit,
            status,
            direction,
            source,
            start_date,
            end_date,
            organisation_id,
            agent_id,
            lead_id
        } = filters;

        const whereCondition: Prisma.CallWhereInput = {
            is_deleted: 0,
            ...(status && { status }),
            ...(direction && { direction }),
            ...(source && { source: source as CALL_SOURCE }),
            ...(organisation_id && { organisation_id }),
            ...(agent_id && { agent_id }),
            ...(lead_id && { lead_id }),
            ...(start_date || end_date) && {
                started_at: {
                    ...(start_date && { gte: new Date(start_date) }),
                    ...(end_date && { lte: new Date(end_date) })
                }
            }
        };

        const [calls, total] = await Promise.all([
            this.prisma.call.findMany({
                where: whereCondition,
                include: {
                    organisation: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            slug: true
                        }
                    },
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            email: true
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
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.call.count({
                where: whereCondition
            })
        ]);

        return {
            data: calls,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getCallById(id: number) {
        const call = await this.prisma.call.findFirst({
            where: {
                id,
                is_deleted: 0
            },
            include: {
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        slug: true,
                        image_url: true
                    }
                },
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
                messages: {
                    where: {
                        is_deleted: 0
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                },
                costs: {
                    select: {
                        amount: true,
                        type: true
                    }
                }
            }
        });

        if (!call) {
            throw new NotFoundException('Call not found');
        }

        return call;
    }

    async createCall(createCallData: {
        organisation: string;
        agent: string;
        lead: string;
        status: string;
        source: CALL_SOURCE;
        direction: string;
        from_number: string;
        to_number: string;
        started_at: string;
        ended_at?: string;
        duration?: number;
        summary?: string;
        analysis?: string;
        recording_url?: string;
        call_ended_reason?: string;
        total_cost?: number;
        messages?: CreateMessageData[];
        costs?: CreateCostData[];
    }) {
        // Resolve organisation slug to ID
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { slug: createCallData.organisation },
                    { id: isNaN(parseInt(createCallData.organisation)) ? undefined : parseInt(createCallData.organisation) }
                ],
                is_deleted: 0,
                is_disabled: 0
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        // Resolve agent slug to ID
        const agent = await this.prisma.agent.findFirst({
            where: {
                OR: [
                    { slug: createCallData.agent },
                    { id: isNaN(parseInt(createCallData.agent)) ? undefined : parseInt(createCallData.agent) }
                ],
                is_deleted: 0,
                is_disabled: 0
            }
        });

        if (!agent) {
            throw new NotFoundException('Agent not found');
        }

        const lead = await this.prisma.lead.findFirst({
            where: {
                OR: [
                    { phone_number: createCallData.lead },
                    { id: createCallData.lead.length > 8 ? undefined : parseInt(createCallData.lead) }
                ],
                is_deleted: 0
            }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Use transaction to create call with messages and costs
        const result = await this.prisma.$transaction(async (prisma) => {
            const call = await prisma.call.create({
                data: {
                    organisation_id: organisation.id,
                    agent_id: agent.id,
                    lead_id: lead.id,
                    status: createCallData.status,
                    source: createCallData.source,
                    direction: createCallData.direction,
                    from_number: createCallData.from_number,
                    to_number: createCallData.to_number,
                    started_at: new Date(createCallData.started_at),
                    ...(createCallData.ended_at && {
                        ended_at: new Date(createCallData.ended_at)
                    }),
                    ...(createCallData.duration !== undefined && {
                        duration: createCallData.duration
                    }),
                    ...(createCallData.summary && {
                        summary: createCallData.summary
                    }),
                    ...(createCallData.analysis && {
                        analysis: createCallData.analysis
                    }),
                    ...(createCallData.recording_url && {
                        recording_url: createCallData.recording_url
                    }),
                    ...(createCallData.call_ended_reason && {
                        call_ended_reason: createCallData.call_ended_reason
                    }),
                    ...(createCallData.total_cost !== undefined && {
                        total_cost: createCallData.total_cost
                    })
                }
            });

            // Create messages if provided
            const messages: any[] = [];
            if (createCallData.messages && createCallData.messages.length > 0) {
                for (const messageData of createCallData.messages) {
                    const message = await prisma.message.create({
                        data: {
                            organisation_id: organisation.id,
                            agent_id: agent.id,
                            call_id: call.id,
                            role: messageData.role,
                            content: messageData.content,
                            prompt_tokens: messageData.prompt_tokens || 0,
                            completion_tokens: messageData.completion_tokens || 0,
                            total_cost: messageData.total_cost,
                            created_at: messageData.created_at ? new Date(messageData.created_at) : undefined
                        }
                    });
                    messages.push(message);
                }
            }

            // Create costs if provided
            const costs: any[] = [];
            if (createCallData.costs && createCallData.costs.length > 0) {
                for (const costData of createCallData.costs) {
                    const cost = await prisma.cost.create({
                        data: {
                            organisation_id: organisation.id,
                            call_id: call.id,
                            type: costData.type as COST_TYPE,
                            amount: costData.amount,
                            summary: costData.summary,
                            ...(costData.message_id && { message_id: costData.message_id })
                        }
                    });
                    costs.push(cost);
                }
            }

            // Return call with related data
            return prisma.call.findFirst({
                where: { id: call.id },
                include: {
                    organisation: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            slug: true
                        }
                    },
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            email: true
                        }
                    },
                    messages: {
                        where: { is_deleted: 0 },
                        orderBy: { created_at: 'asc' }
                    },
                    costs: {
                        where: { is_deleted: 0 },
                        orderBy: { created_at: 'asc' }
                    }
                }
            });
        });

        return {
            message: 'Call created successfully',
            data: result
        };
    }

    async updateCall(id: number, updateCallData: {
        organisation?: string;
        agent?: string;
        lead?: string;
        status?: string;
        source?: CALL_SOURCE;
        direction?: string;
        from_number?: string;
        to_number?: string;
        started_at?: string;
        ended_at?: string;
        duration?: number;
        summary?: string;
        analysis?: string;
        recording_url?: string;
        call_ended_reason?: string;
        total_cost?: number;
        messages?: UpdateMessageData[];
        costs?: UpdateCostData[];
        is_deleted?: number;
    }) {
        // Check if call exists
        const existingCall = await this.prisma.call.findFirst({
            where: {
                id,
                is_deleted: 0
            }
        });

        if (!existingCall) {
            throw new NotFoundException('Call not found');
        }

        let organisationId = existingCall.organisation_id;
        let agentId = existingCall.agent_id;
        let leadId = existingCall.lead_id;

        // Resolve organisation slug to ID if provided
        if (updateCallData.organisation) {
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    OR: [
                        { slug: updateCallData.organisation },
                        { id: isNaN(parseInt(updateCallData.organisation)) ? undefined : parseInt(updateCallData.organisation) }
                    ],
                    is_deleted: 0,
                    is_disabled: 0
                }
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found');
            }
            organisationId = organisation.id;
        }

        // Resolve agent slug to ID if provided
        if (updateCallData.agent) {
            const agent = await this.prisma.agent.findFirst({
                where: {
                    OR: [
                        { slug: updateCallData.agent },
                        { id: isNaN(parseInt(updateCallData.agent)) ? undefined : parseInt(updateCallData.agent) }
                    ],
                    is_deleted: 0,
                    is_disabled: 0
                }
            });

            if (!agent) {
                throw new NotFoundException('Agent not found');
            }
            agentId = agent.id;
        }

        // Resolve lead phone number to ID if provided
        if (updateCallData.lead) {
            const lead = await this.prisma.lead.findFirst({
                where: {
                    OR: [
                        { phone_number: updateCallData.lead },
                        { id: updateCallData.lead.length > 8 ? undefined : parseInt(updateCallData.lead) }
                    ],
                    is_deleted: 0
                }
            });

            if (!lead) {
                throw new NotFoundException('Lead not found');
            }
            leadId = lead.id;
        }

        // Use transaction to update call with messages and costs
        const result = await this.prisma.$transaction(async (prisma) => {
            // Update the call
            const updateData: Prisma.CallUpdateInput = {
                organisation: {
                    connect: { id: organisationId }
                },
                agent: {
                    connect: { id: agentId }
                },
                lead: {
                    connect: { id: leadId }
                },
                ...(updateCallData.status && { status: updateCallData.status }),
                ...(updateCallData.source && { source: updateCallData.source }),
                ...(updateCallData.direction && { direction: updateCallData.direction }),
                ...(updateCallData.from_number && { from_number: updateCallData.from_number }),
                ...(updateCallData.to_number && { to_number: updateCallData.to_number }),
                ...(updateCallData.started_at && {
                    started_at: new Date(updateCallData.started_at)
                }),
                ...(updateCallData.ended_at && {
                    ended_at: new Date(updateCallData.ended_at)
                }),
                ...(updateCallData.duration !== undefined && {
                    duration: updateCallData.duration
                }),
                ...(updateCallData.summary !== undefined && {
                    summary: updateCallData.summary
                }),
                ...(updateCallData.analysis !== undefined && {
                    analysis: updateCallData.analysis
                }),
                ...(updateCallData.recording_url !== undefined && {
                    recording_url: updateCallData.recording_url
                }),
                ...(updateCallData.call_ended_reason !== undefined && {
                    call_ended_reason: updateCallData.call_ended_reason
                }),
                ...(updateCallData.total_cost !== undefined && {
                    total_cost: updateCallData.total_cost
                }),
                ...(updateCallData.is_deleted !== undefined && {
                    is_deleted: updateCallData.is_deleted
                }),
                updated_at: new Date()
            };

            await prisma.call.update({
                where: { id },
                data: updateData
            });

            // Handle messages updates if provided
            if (updateCallData.messages) {
                for (const messageData of updateCallData.messages) {
                    if (messageData.id) {
                        // Update existing message
                        await prisma.message.update({
                            where: { id: messageData.id },
                            data: {
                                ...(messageData.role && { role: messageData.role }),
                                ...(messageData.content && { content: messageData.content }),
                                ...(messageData.prompt_tokens !== undefined && { prompt_tokens: messageData.prompt_tokens }),
                                ...(messageData.completion_tokens !== undefined && { completion_tokens: messageData.completion_tokens }),
                                ...(messageData.total_cost !== undefined && { total_cost: messageData.total_cost }),
                                ...(messageData.is_deleted !== undefined && { is_deleted: messageData.is_deleted }),
                                updated_at: new Date()
                            }
                        });
                    } else {
                        // Create new message
                        await prisma.message.create({
                            data: {
                                organisation_id: organisationId,
                                agent_id: agentId,
                                call_id: id,
                                role: messageData.role!,
                                content: messageData.content!,
                                prompt_tokens: messageData.prompt_tokens || 0,
                                completion_tokens: messageData.completion_tokens || 0,
                                total_cost: messageData.total_cost,
                                created_at: messageData.created_at ? new Date(messageData.created_at) : undefined
                            }
                        });
                    }
                }
            }

            // Handle costs updates if provided
            if (updateCallData.costs) {
                for (const costData of updateCallData.costs) {
                    if (costData.id) {
                        // Update existing cost
                        await prisma.cost.update({
                            where: { id: costData.id },
                            data: {
                                ...(costData.type && { type: costData.type as COST_TYPE }),
                                ...(costData.amount !== undefined && { amount: costData.amount }),
                                ...(costData.summary !== undefined && { summary: costData.summary }),
                                ...(costData.message_id !== undefined && { message_id: costData.message_id }),
                                ...(costData.is_deleted !== undefined && { is_deleted: costData.is_deleted }),
                                updated_at: new Date()
                            }
                        });
                    } else {
                        // Create new cost
                        await prisma.cost.create({
                            data: {
                                organisation_id: organisationId,
                                call_id: id,
                                type: costData.type! as COST_TYPE,
                                amount: costData.amount!,
                                summary: costData.summary,
                                ...(costData.message_id && { message_id: costData.message_id })
                            }
                        });
                    }
                }
            }

            // Return updated call with related data
            return prisma.call.findFirst({
                where: { id },
                include: {
                    organisation: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            slug: true
                        }
                    },
                    lead: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            email: true
                        }
                    },
                    messages: {
                        where: { is_deleted: 0 },
                        orderBy: { created_at: 'asc' }
                    },
                    costs: {
                        where: { is_deleted: 0 },
                        orderBy: { created_at: 'asc' }
                    }
                }
            });
        });

        return {
            message: 'Call updated successfully',
            data: result
        };
    }

    async deleteCall(id: number) {
        // Check if call exists
        const existingCall = await this.prisma.call.findFirst({
            where: {
                id,
                is_deleted: 0
            }
        });

        if (!existingCall) {
            throw new NotFoundException('Call not found');
        }

        await this.prisma.call.update({
            where: { id },
            data: {
                is_deleted: 1,
                updated_at: new Date()
            }
        });

        return {
            message: 'Call deleted successfully'
        };
    }
}