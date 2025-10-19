import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { Lead, Prisma } from '@prisma/client';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ProcessedLeadFilters } from './dto/get-leads.dto';
import { ApiResponse } from '@helpers/api-response.helper';
import { ProcessedPriorityLeadFilters } from './dto/get-priority-leads.dto';

@Injectable()
export class LeadService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLoggerService,
    ) { }

    async create(createLeadDto: CreateLeadDto): Promise<ApiResponse<Lead>> {
        const methodName = 'create';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { createLeadDto },
            }),
            methodName,
        );

        try {
            const organisationSlug = createLeadDto.organisation_slug;

            // Verify organization exists
            const organization = await this.prisma.organisation.findFirst({
                where: {
                    slug: organisationSlug,
                    is_deleted: 0,
                    is_disabled: 0,
                }
            });

            if (!organization) {
                throw new NotFoundException('Organization not found');
            }

            // Check for duplicate email or phone if provided
            if (createLeadDto.email || createLeadDto.phone_number) {
                const duplicateCheck: Prisma.LeadWhereInput = {
                    organisation_id: organization.id,
                    OR: []
                };

                if (createLeadDto.email) {
                    (duplicateCheck.OR as Prisma.LeadWhereInput[]).push({ email: createLeadDto.email });
                }
                if (createLeadDto.phone_number) {
                    (duplicateCheck.OR as Prisma.LeadWhereInput[]).push({ phone_number: createLeadDto.phone_number });
                }

                const existingLead = await this.prisma.lead.findFirst({
                    where: duplicateCheck
                });

                if (existingLead) {
                    throw new BadRequestException('Lead with this email or phone number already exists');
                }
            }

            const { organisation_slug, ...leadDataWithoutSlug } = createLeadDto;
            const leadData = {
                ...leadDataWithoutSlug,
                organisation_id: organization.id,
                next_follow_up: createLeadDto.next_follow_up ? new Date(createLeadDto.next_follow_up) : null,
            };

            const lead = await this.prisma.lead.create({
                data: leadData,
                include: {
                    organisation: {
                        select: { id: true, name: true, slug: true }
                    },
                    agents: {
                        select: { id: true, name: true, slug: true }
                    }
                }
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: lead.id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead created successfully', lead, 201);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create lead');
        }
    }

    async findAll(filters: ProcessedLeadFilters, organisationSlug?: string): Promise<ApiResponse<{ leads: Lead[], total: number, page: number, limit: number }>> {
        const methodName = 'findAll';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { organisationSlug, filters },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {};

            // Add organisation filter if provided
            if (organisationSlug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            // Apply filters
            if (filters.source) {
                whereCondition.source = { contains: filters.source, mode: 'insensitive' };
            }

            if (filters.status) {
                whereCondition.status = { contains: filters.status, mode: 'insensitive' };
            }

            if (filters.is_indian !== undefined) {
                whereCondition.is_indian = filters.is_indian;
            }

            if (filters.in_process !== undefined) {
                whereCondition.in_process = filters.in_process;
            }

            if (filters.search) {
                whereCondition.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { phone_number: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            if (filters.startDate || filters.endDate) {
                whereCondition.created_at = {};
                if (filters.startDate) {
                    whereCondition.created_at.gte = filters.startDate;
                }
                if (filters.endDate) {
                    whereCondition.created_at.lte = filters.endDate;
                }
            }

            if (filters.agent_slug_or_id) {
                const agentId = Number(filters.agent_slug_or_id);
                whereCondition.agents = {
                    some: {
                        OR: [
                            { id: isNaN(agentId) ? undefined : agentId },
                            { slug: filters.agent_slug_or_id },
                        ]
                    }
                };
            }

            const [leads, total] = await Promise.all([
                this.prisma.lead.findMany({
                    where: whereCondition,
                    include: {
                        organisation: {
                            select: { id: true, name: true, slug: true }
                        },
                        agents: {
                            select: { id: true, name: true, slug: true }
                        }
                    },
                    orderBy: { created_at: 'desc' },
                    skip: (filters.page - 1) * filters.limit,
                    take: filters.limit,
                }),
                this.prisma.lead.count({ where: whereCondition }),
            ]);

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { total, page: filters.page, limit: filters.limit },
                }),
                methodName,
            );

            const response = {
                leads,
                total,
                page: filters.page,
                limit: filters.limit,
            };

            return ApiResponse.success('Leads retrieved successfully', response);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve leads');
        }
    }

    async findAllLeads(filters: ProcessedLeadFilters): Promise<ApiResponse<{ leads: Lead[], total: number, page: number, limit: number }>> {
        const methodName = 'findAllLeads';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { filters },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {};

            // Add organisation filter if provided
            if (filters.organisationSlug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: filters.organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            // Apply filters without organisation restriction
            if (filters.source) {
                whereCondition.source = { contains: filters.source, mode: 'insensitive' };
            }

            if (filters.status) {
                whereCondition.status = { contains: filters.status, mode: 'insensitive' };
            }

            if (filters.is_indian !== undefined) {
                whereCondition.is_indian = filters.is_indian;
            }

            if (filters.in_process !== undefined) {
                whereCondition.in_process = filters.in_process;
            }

            if (filters.search) {
                whereCondition.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { phone_number: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            if (filters.startDate || filters.endDate) {
                whereCondition.created_at = {};
                if (filters.startDate) {
                    whereCondition.created_at.gte = filters.startDate;
                }
                if (filters.endDate) {
                    whereCondition.created_at.lte = filters.endDate;
                }
            }

            if (filters.agent_slug_or_id) {
                const agentId = Number(filters.agent_slug_or_id);
                whereCondition.agents = {
                    some: {
                        OR: [
                            { id: isNaN(agentId) ? undefined : agentId },
                            { slug: filters.agent_slug_or_id },
                        ]
                    }
                };
            }

            const [leads, total] = await Promise.all([
                this.prisma.lead.findMany({
                    where: whereCondition,
                    include: {
                        organisation: {
                            select: { id: true, name: true, slug: true }
                        },
                        agents: {
                            select: { id: true, name: true, slug: true }
                        }
                    },
                    orderBy: { created_at: 'desc' },
                    skip: (filters.page - 1) * filters.limit,
                    take: filters.limit,
                }),
                this.prisma.lead.count({ where: whereCondition }),
            ]);

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { total, page: filters.page, limit: filters.limit },
                }),
                methodName,
            );

            const response = {
                leads,
                total,
                page: filters.page,
                limit: filters.limit,
            };

            return ApiResponse.success('All leads retrieved successfully', response);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            throw new BadRequestException('Failed to retrieve all leads');
        }
    }

    async getPriorityLeads(filters: ProcessedPriorityLeadFilters): Promise<ApiResponse<{ leads: Lead[], total: number, page: number, limit: number }>> {
        const methodName = 'getPriorityLeads';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { filters },
            }),
            methodName,
        );

        try {
            const currentTime = new Date();
            const whereCondition: Prisma.LeadWhereInput = {
                next_follow_up: {
                    not: null,
                    lte: filters.nextFollowUpEnd ?? currentTime, // Follow-up time has passed or is now
                    gte: filters.nextFollowUpStart, // Follow-up time is after start filter or from the past
                }
            };

            // Add organisation filter if provided
            if (filters.organisation_slug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: filters.organisation_slug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            // Add is_indian filter if provided
            if (filters.is_indian !== undefined) {
                whereCondition.is_indian = filters.is_indian;
            }

            // Add in_process filter if provided, otherwise exclude in_process leads from priority queue
            if (filters.in_process !== undefined) {
                whereCondition.in_process = filters.in_process;
            } else {
                // By default, exclude leads that are in process from priority queue
                whereCondition.in_process = 0;
            }

            const [leads, total] = await Promise.all([
                this.prisma.lead.findMany({
                    where: whereCondition,
                    include: {
                        organisation: {
                            select: { id: true, name: true, slug: true }
                        },
                        agents: {
                            select: { id: true, name: true, slug: true }
                        },
                        conversations: {
                            select: { id: true, name: true, type: true, created_at: true },
                            orderBy: { created_at: 'desc' },
                        }
                    },
                    orderBy: [
                        { next_follow_up: 'asc' }, // Most urgent first (oldest follow-up time)
                        { created_at: 'desc' }, // Then by newest leads
                    ],
                    skip: (filters.page - 1) * filters.limit,
                    take: filters.limit,
                }),
                this.prisma.lead.count({ where: whereCondition }),
            ]);

            // Calculate urgency for each lead (how overdue they are)
            const enrichedLeads = leads.map(lead => ({
                ...lead,
                urgency_minutes: lead.next_follow_up
                    ? Math.floor((currentTime.getTime() - new Date(lead.next_follow_up).getTime()) / (1000 * 60))
                    : 0,
                is_overdue: lead.next_follow_up
                    ? new Date(lead.next_follow_up) < currentTime
                    : false,
            }));

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { total, page: filters.page, limit: filters.limit, currentTime },
                }),
                methodName,
            );

            const response = {
                leads: enrichedLeads,
                total,
                page: filters.page,
                limit: filters.limit,
            };

            return ApiResponse.success('Priority leads retrieved successfully', response);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve priority leads');
        }
    }

    async findOne(id: number, organisationSlug?: string): Promise<ApiResponse<Lead>> {
        const methodName = 'findOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { leadId: id, organisationSlug },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {
                id,
            };

            // Add organisation filter if provided
            if (organisationSlug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            const lead = await this.prisma.lead.findFirst({
                where: whereCondition,
                include: {
                    organisation: {
                        select: { id: true, name: true, slug: true }
                    },
                    agents: {
                        select: { id: true, name: true, slug: true }
                    },
                    conversations: {
                        select: { id: true, name: true, type: true, created_at: true }
                    }
                }
            });

            if (!lead) {
                throw new NotFoundException('Lead not found');
            }

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: lead.id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead retrieved successfully', lead);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve lead');
        }
    }

    async update(id: number, updateLeadDto: UpdateLeadDto, organisationSlug?: string): Promise<ApiResponse<Lead>> {
        const methodName = 'update';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { leadId: id, updateLeadDto, organisationSlug },
            }),
            methodName,
        );

        try {
            let orgId: number | undefined;

            // Use organisationSlug from DTO if provided, otherwise use the parameter
            const orgSlug = organisationSlug;

            if (orgSlug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: orgSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                orgId = organization.id;
            }

            // Verify organization exists and lead exists
            const existingLead = await this.prisma.lead.findFirst({
                where: {
                    id,
                    organisation_id: orgId,
                    organisation: {
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                }
            });

            if (!existingLead) {
                throw new NotFoundException('Lead not found');
            }

            // Check for duplicate email or phone if provided
            if (updateLeadDto.email || updateLeadDto.phone_number) {
                const duplicateCheck: Prisma.LeadWhereInput = {
                    id: { not: id },
                    OR: []
                };

                if (orgId) {
                    duplicateCheck.organisation_id = orgId;
                }

                if (updateLeadDto.email) {
                    (duplicateCheck.OR as Prisma.LeadWhereInput[]).push({ email: updateLeadDto.email });
                }
                if (updateLeadDto.phone_number) {
                    (duplicateCheck.OR as Prisma.LeadWhereInput[]).push({ phone_number: updateLeadDto.phone_number });
                }

                const duplicateLead = await this.prisma.lead.findFirst({
                    where: duplicateCheck
                });

                if (duplicateLead) {
                    throw new BadRequestException('Lead with this email or phone number already exists');
                }
            }

            const { ...updateDataWithoutSlug } = updateLeadDto;
            const updateData: any = {
                ...updateDataWithoutSlug,
                next_follow_up: updateLeadDto.next_follow_up ? new Date(updateLeadDto.next_follow_up) : undefined,
            };

            if (orgId) {
                updateData.organisation_id = orgId;
            }

            const lead = await this.prisma.lead.update({
                where: { id },
                data: updateData,
                include: {
                    organisation: {
                        select: { id: true, name: true, slug: true }
                    },
                    agents: {
                        select: { id: true, name: true, slug: true }
                    }
                }
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: lead.id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead updated successfully', lead);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to update lead');
        }
    }

    async remove(id: number, organisationSlug?: string): Promise<ApiResponse<null>> {
        const methodName = 'remove';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { organisationSlug, leadId: id },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {
                id,
            };

            // Add organisation filter if provided
            if (organisationSlug) {
                // Verify organization exists
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
                whereCondition.organisation = {
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            // Verify lead exists
            const existingLead = await this.prisma.lead.findFirst({
                where: whereCondition
            });

            if (!existingLead) {
                throw new NotFoundException('Lead not found');
            }

            await this.prisma.lead.delete({
                where: { id }
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead deleted successfully', null);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to delete lead');
        }
    }

    async markInProcess(id: number, organisationSlug?: string): Promise<ApiResponse<Lead>> {
        const methodName = 'markInProcess';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { leadId: id, organisationSlug },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {
                id,
            };

            // Add organisation filter if provided
            if (organisationSlug) {
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            const existingLead = await this.prisma.lead.findFirst({
                where: whereCondition,
            });

            if (!existingLead) {
                throw new NotFoundException('Lead not found');
            }

            const updatedLead = await this.prisma.lead.update({
                where: { id },
                data: { in_process: 1 },
                include: {
                    organisation: {
                        select: { id: true, name: true, slug: true }
                    },
                    agents: {
                        select: { id: true, name: true, slug: true }
                    }
                }
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead marked as in process', updatedLead);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to mark lead as in process');
        }
    }

    async unmarkInProcess(id: number, organisationSlug?: string): Promise<ApiResponse<Lead>> {
        const methodName = 'unmarkInProcess';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { leadId: id, organisationSlug },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.LeadWhereInput = {
                id,
            };

            // Add organisation filter if provided
            if (organisationSlug) {
                const organization = await this.prisma.organisation.findFirst({
                    where: {
                        slug: organisationSlug,
                        is_deleted: 0,
                        is_disabled: 0,
                    }
                });

                if (!organization) {
                    throw new NotFoundException('Organization not found');
                }

                whereCondition.organisation_id = organization.id;
            }

            const existingLead = await this.prisma.lead.findFirst({
                where: whereCondition,
            });

            if (!existingLead) {
                throw new NotFoundException('Lead not found');
            }

            const updatedLead = await this.prisma.lead.update({
                where: { id },
                data: { in_process: 0 },
                include: {
                    organisation: {
                        select: { id: true, name: true, slug: true }
                    },
                    agents: {
                        select: { id: true, name: true, slug: true }
                    }
                }
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { leadId: id },
                }),
                methodName,
            );

            return ApiResponse.success('Lead unmarked from process', updatedLead);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to unmark lead from process');
        }
    }
}