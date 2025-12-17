import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/public-client';
import { CreditHistoryFilterParams, CreditHistoryEntry } from './types/service-interfaces';

@Injectable()
export class CreditHistoryService {
    constructor(private readonly prisma: PrismaService) { }

    private async resolveOrganisationId(organisationIdOrSlug: string): Promise<number> {
        const organisation = await this.prisma.organisation.findFirst({
            where: {
                OR: [
                    { id: isNaN(parseInt(organisationIdOrSlug)) ? undefined : parseInt(organisationIdOrSlug) },
                    { slug: organisationIdOrSlug }
                ],
                is_deleted: 0,
                is_disabled: 0
            }
        });

        if (!organisation) {
            throw new NotFoundException('Organisation not found');
        }

        return organisation.id;
    }

    async getAllCreditHistory(filters: CreditHistoryFilterParams) {
        const {
            page,
            limit,
            org,
            change_type,
            change_field,
            start_date,
            end_date
        } = filters;

        let organisationId: number | undefined;
        if (org) {
            organisationId = await this.resolveOrganisationId(org);
        }

        const whereCondition: Prisma.CreditHistoryWhereInput = {
            is_deleted: 0,
            ...(organisationId && { organisation_id: organisationId }),
            ...(change_type && { change_type }),
            ...(change_field && { change_field }),
            ...(start_date || end_date) && {
                created_at: {
                    ...(start_date && { gte: new Date(start_date) }),
                    ...(end_date && { lte: new Date(end_date) })
                }
            }
        };

        const [creditHistories, total] = await Promise.all([
            this.prisma.creditHistory.findMany({
                where: whereCondition,
                include: {
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
            }),
            this.prisma.creditHistory.count({
                where: whereCondition
            })
        ]);

        return {
            data: creditHistories,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getCreditHistoryById(id: number) {
        const creditHistory = await this.prisma.creditHistory.findFirst({
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
                }
            }
        });

        if (!creditHistory) {
            throw new NotFoundException('Credit history entry not found');
        }

        return creditHistory;
    }

    async createSingleCreditHistory(createData: {
        org: string;
        change_amount: number;
        change_type: string;
        change_field: string;
        prev_value: number;
        new_value: number;
        reason: string;
    }) {
        const organisationId = await this.resolveOrganisationId(createData.org);

        const creditHistory = await this.prisma.creditHistory.create({
            data: {
                organisation_id: organisationId,
                change_amount: createData.change_amount,
                change_type: createData.change_type,
                change_field: createData.change_field,
                prev_value: createData.prev_value,
                new_value: createData.new_value,
                reason: createData.reason
            },
            include: {
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        return {
            message: 'Credit history entry created successfully',
            data: creditHistory
        };
    }

    async createBulkCreditHistory(createData: {
        org: string;
        entries: CreditHistoryEntry[];
    }) {
        const organisationId = await this.resolveOrganisationId(createData.org);

        // Use transaction to ensure all entries are created or none are
        const creditHistories = await this.prisma.$transaction(async (prisma) => {
            const createdEntries: any[] = [];
            for (const entry of createData.entries) {
                const creditHistory = await prisma.creditHistory.create({
                    data: {
                        organisation_id: organisationId,
                        change_amount: entry.change_amount,
                        change_type: entry.change_type,
                        change_field: entry.change_field,
                        prev_value: entry.prev_value,
                        new_value: entry.new_value,
                        reason: entry.reason
                    },
                    include: {
                        organisation: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        }
                    }
                });
                createdEntries.push(creditHistory);
            }
            return createdEntries;
        });

        return {
            message: `${creditHistories.length} credit history entries created successfully`,
            data: creditHistories,
            count: creditHistories.length
        };
    }

    async updateCreditHistory(id: number, updateData: {
        org?: string;
        change_amount?: number;
        change_type?: string;
        change_field?: string;
        prev_value?: number;
        new_value?: number;
        reason?: string;
        is_deleted?: number;
    }) {
        // Check if credit history exists
        const existingCreditHistory = await this.prisma.creditHistory.findFirst({
            where: {
                id,
                is_deleted: 0
            }
        });

        if (!existingCreditHistory) {
            throw new NotFoundException('Credit history entry not found');
        }

        let organisationId = existingCreditHistory.organisation_id;
        if (updateData.org) {
            organisationId = await this.resolveOrganisationId(updateData.org);
        }

        const updatedCreditHistory = await this.prisma.creditHistory.update({
            where: { id },
            data: {
                organisation_id: organisationId,
                ...(updateData.change_amount !== undefined && { change_amount: updateData.change_amount }),
                ...(updateData.change_type && { change_type: updateData.change_type }),
                ...(updateData.change_field && { change_field: updateData.change_field }),
                ...(updateData.prev_value !== undefined && { prev_value: updateData.prev_value }),
                ...(updateData.new_value !== undefined && { new_value: updateData.new_value }),
                ...(updateData.reason && { reason: updateData.reason }),
                ...(updateData.is_deleted !== undefined && { is_deleted: updateData.is_deleted }),
                updated_at: new Date()
            },
            include: {
                organisation: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        return {
            message: 'Credit history entry updated successfully',
            data: updatedCreditHistory
        };
    }

    async deleteCreditHistory(id: number) {
        // Check if credit history exists
        const existingCreditHistory = await this.prisma.creditHistory.findFirst({
            where: {
                id,
                is_deleted: 0
            }
        });

        if (!existingCreditHistory) {
            throw new NotFoundException('Credit history entry not found');
        }

        await this.prisma.creditHistory.update({
            where: { id },
            data: {
                is_deleted: 1,
                updated_at: new Date()
            }
        });

        return {
            message: 'Credit history entry deleted successfully'
        };
    }
}