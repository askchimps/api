import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { ApiResponse } from '@helpers/api-response.helper';
import { CreateCreditHistoryDto } from './dto/create-credit-history.dto';
import { GetCreditHistoryQueryDto } from './dto/get-credit-history.dto';
import { Prisma, CreditHistory, User } from '@prisma/client';

@Injectable()
export class CreditHistoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLoggerService,
    ) {}

    async create(createCreditHistoryDto: CreateCreditHistoryDto): Promise<CreditHistory> {
        const methodName = 'create';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: createCreditHistoryDto,
            }),
            methodName,
        );

        try {
            const creditHistory = await this.prisma.creditHistory.create({
                data: createCreditHistoryDto,
                include: {
                    organisation: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: creditHistory,
                }),
                methodName,
            );

            return creditHistory;
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            throw new BadRequestException('Failed to create credit history');
        }
    }

    async findAll(user: User, query: GetCreditHistoryQueryDto): Promise<ApiResponse<{
        creditHistory: CreditHistory[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>> {
        const methodName = 'findAll';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, query },
            }),
            methodName,
        );

        try {
            const { page = 1, limit = 20, organisation_id, change_type, change_field, start_date, end_date } = query;
            const skip = (page - 1) * limit;

            const whereCondition: Prisma.CreditHistoryWhereInput = {};

            if (organisation_id) {
                whereCondition.organisation_id = organisation_id;
            }

            // User access control - non-super-admin users can only see credit history from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            if (change_type) {
                whereCondition.change_type = change_type;
            }

            if (change_field) {
                whereCondition.change_field = change_field;
            }

            if (start_date || end_date) {
                whereCondition.created_at = {};
                if (start_date) {
                    whereCondition.created_at.gte = new Date(start_date);
                }
                if (end_date) {
                    whereCondition.created_at.lte = new Date(end_date);
                }
            }

            const [creditHistory, total] = await Promise.all([
                this.prisma.creditHistory.findMany({
                    where: whereCondition,
                    include: {
                        organisation: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                    skip,
                    take: limit,
                }),
                this.prisma.creditHistory.count({
                    where: whereCondition,
                }),
            ]);

            const result = {
                creditHistory,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { total, page, limit },
                }),
                methodName,
            );

            return ApiResponse.success('Credit history retrieved successfully', result);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            throw new BadRequestException('Failed to retrieve credit history');
        }
    }

    async findOne(user: User, id: number): Promise<ApiResponse<CreditHistory>> {
        const methodName = 'findOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, id },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.CreditHistoryWhereInput = {
                id,
            };

            // User access control - non-super-admin users can only see credit history from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            const creditHistory = await this.prisma.creditHistory.findFirst({
                where: whereCondition,
                include: {
                    organisation: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });

            if (!creditHistory) {
                throw new NotFoundException('Credit history not found or access denied');
            }

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: creditHistory,
                }),
                methodName,
            );

            return ApiResponse.success('Credit history retrieved successfully', creditHistory);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new BadRequestException('Failed to retrieve credit history');
        }
    }
}