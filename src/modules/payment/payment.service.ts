import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { ApiResponse } from '@helpers/api-response.helper';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentsQueryDto } from './dto/get-payments.dto';
import { Prisma, Payment, User } from '@prisma/client';

@Injectable()
export class PaymentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLoggerService,
    ) { }

    async create(user: User, createPaymentDto: CreatePaymentDto): Promise<ApiResponse<Payment>> {
        const methodName = 'create';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, createPaymentDto },
            }),
            methodName,
        );

        try {
            // Validate organisation exists and user has access
            const organisation = await this.prisma.organisation.findFirst({
                where: {
                    slug: createPaymentDto.organisation,
                    is_deleted: 0,
                    is_disabled: 0,
                    ...(user.is_super_admin ? {} : {
                        user_organisations: {
                            some: {
                                user_id: user.id,
                                role: {
                                    in: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
                                }
                            },
                        },
                    }),
                },
            });

            if (!organisation) {
                throw new NotFoundException('Organisation not found or access denied');
            }

            const payment = await this.prisma.payment.create({
                data: {
                    ...createPaymentDto,
                    organisation: {
                        connect: { id: organisation.id },
                    }
                },
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
                    data: payment,
                }),
                methodName,
            );

            return ApiResponse.success('Payment created successfully', payment);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException('Failed to create payment');
        }
    }

    async findAll(user: User, query: GetPaymentsQueryDto): Promise<ApiResponse<{
        payments: Payment[];
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
            const { page = 1, limit = 20, organisation_id, currency, start_date, end_date } = query;
            const skip = (page - 1) * limit;

            const whereCondition: Prisma.PaymentWhereInput = {};

            // Organization filter
            if (organisation_id) {
                whereCondition.organisation_id = organisation_id;
            }

            // User access control - non-super-admin users can only see payments from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                            role: {
                                in: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
                            }
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            if (currency) {
                whereCondition.currency = currency;
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

            const [payments, total] = await Promise.all([
                this.prisma.payment.findMany({
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
                this.prisma.payment.count({
                    where: whereCondition,
                }),
            ]);

            const result = {
                payments,
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

            return ApiResponse.success('Payments retrieved successfully', result);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            throw new BadRequestException('Failed to retrieve payments');
        }
    }

    async findOne(user: User, id: number): Promise<ApiResponse<Payment>> {
        const methodName = 'findOne';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, id },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.PaymentWhereInput = {
                id,
            };

            // User access control - non-super-admin users can only see payments from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                            role: {
                                in: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
                            }
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            const payment = await this.prisma.payment.findFirst({
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

            if (!payment) {
                throw new NotFoundException('Payment not found or access denied');
            }

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: payment,
                }),
                methodName,
            );

            return ApiResponse.success('Payment retrieved successfully', payment);
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

            throw new BadRequestException('Failed to retrieve payment');
        }
    }

    async update(user: User, id: number, updatePaymentDto: UpdatePaymentDto): Promise<ApiResponse<Payment>> {
        const methodName = 'update';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, id, updatePaymentDto },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.PaymentWhereInput = {
                id,
            };

            // User access control - non-super-admin users can only update payments from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                            role: {
                                in: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
                            }
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            const existingPayment = await this.prisma.payment.findFirst({
                where: whereCondition,
            });

            if (!existingPayment) {
                throw new NotFoundException('Payment not found or access denied');
            }

            const payment = await this.prisma.payment.update({
                where: { id },
                data: updatePaymentDto,
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
                    data: payment,
                }),
                methodName,
            );

            return ApiResponse.success('Payment updated successfully', payment);
        } catch (error) {
            this.logger.error(
                JSON.stringify({
                    title: `${methodName} - error`,
                    error: error?.message,
                }),
                methodName,
            );

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException('Failed to update payment');
        }
    }

    async remove(user: User, id: number): Promise<ApiResponse<{ id: number }>> {
        const methodName = 'remove';
        this.logger.log(
            JSON.stringify({
                title: `${methodName} - start`,
                data: { user: user.id, id },
            }),
            methodName,
        );

        try {
            const whereCondition: Prisma.PaymentWhereInput = {
                id,
            };

            // User access control - non-super-admin users can only delete payments from their organizations
            if (!user.is_super_admin) {
                whereCondition.organisation = {
                    user_organisations: {
                        some: {
                            user_id: user.id,
                            role: {
                                in: ['ADMIN', 'OWNER', 'SUPER_ADMIN']
                            }
                        },
                    },
                    is_deleted: 0,
                    is_disabled: 0,
                };
            }

            const existingPayment = await this.prisma.payment.findFirst({
                where: whereCondition,
            });

            if (!existingPayment) {
                throw new NotFoundException('Payment not found or access denied');
            }

            await this.prisma.payment.delete({
                where: { id },
            });

            this.logger.log(
                JSON.stringify({
                    title: `${methodName} - success`,
                    data: { id },
                }),
                methodName,
            );

            return ApiResponse.success('Payment deleted successfully', { id });
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

            throw new BadRequestException('Failed to delete payment');
        }
    }
}