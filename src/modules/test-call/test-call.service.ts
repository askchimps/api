import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTestCallDto } from './dto/create-test-call.dto';
import { UpdateTestCallDto } from './dto/update-test-call.dto';
import { GetTestCallsQueryDto } from './dto/get-test-calls.dto';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { ApiResponse } from '@helpers/api-response.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestCallService {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createTestCallDto: CreateTestCallDto) {
    const methodName = 'create';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: createTestCallDto,
      }),
      methodName,
    );

    try {
      const { organisation: organisation_slug, costs, ...testCallData } = createTestCallDto;

      // Find organisation by ID or slug
      const orgId = Number(organisation_slug);

      const organisation = await this.prisma.organisation.findFirst({
        where: {
          OR: [
            { id: isNaN(orgId) ? undefined : orgId },
            { slug: organisation_slug }
          ],
          is_deleted: 0,
          is_disabled: 0,
        },
      });

      if (!organisation) {
        throw new NotFoundException('Organisation not found');
      }

      // Use Prisma transaction to create test call and costs together
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the test call first
        const testCall = await prisma.testCall.create({
          data: {
            ...testCallData,
            organisation_id: organisation.id,
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

        // Create all costs for the test call if provided
        let createdCosts: any[] = [];
        if (costs && costs.length > 0) {
          createdCosts = await Promise.all(
            costs.map((costData) =>
              prisma.cost.create({
                data: {
                  ...costData,
                  organisation_id: organisation.id,
                  test_call_id: testCall.id,
                },
              }),
            ),
          );
        }

        // Calculate total cost from individual costs if not provided
        let finalTotalCost = testCallData.total_cost;
        if (!finalTotalCost && createdCosts.length > 0) {
          finalTotalCost = createdCosts.reduce(
            (sum, cost) => sum + cost.amount,
            0,
          );
        }

        // Update the test call with total cost if calculated from costs
        const updatedTestCall = await prisma.testCall.update({
          where: { id: testCall.id },
          data: {
            total_cost: finalTotalCost,
          },
          include: {
            organisation: {
              select: { id: true, name: true, slug: true },
            },
            costs: {
              select: {
                id: true,
                type: true,
                amount: true,
                summary: true,
                created_at: true,
              },
              orderBy: { created_at: 'desc' },
            },
          },
        });

        return updatedTestCall;
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: { 
            testCallId: result.id,
            costCount: costs?.length || 0,
            totalCost: result.total_cost,
          },
        }),
        methodName,
      );

      return ApiResponse.success('Test call created successfully', result);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
        methodName,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create test call');
    }
  }

  async findAll(query: GetTestCallsQueryDto) {
    const methodName = 'findAll';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: query,
      }),
      methodName,
    );

    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      // Build where condition
      const where: Prisma.TestCallWhereInput = {};

      // Filter by organisation if provided
      if (query.organisation) {
        const orgId = Number(query.organisation);
        const orgSlug = query.organisation;

        const organisation = await this.prisma.organisation.findFirst({
          where: {
            OR: [
              { id: isNaN(orgId) ? undefined : orgId },
              { slug: orgSlug }
            ],
            is_deleted: 0,
            is_disabled: 0,
          },
        });

        if (!organisation) {
          throw new NotFoundException('Organisation not found');
        }

        where.organisation_id = organisation.id;
      }

      // Add search filter
      if (query.search) {
        where.OR = [
          { first_name: { contains: query.search, mode: 'insensitive' } },
          { last_name: { contains: query.search, mode: 'insensitive' } },
          { phone_number: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Add date filters
      if (query.startDate || query.endDate) {
        where.created_at = {};
        
        if (query.startDate) {
          const startDate = new Date(query.startDate);
          startDate.setUTCHours(0, 0, 0, 0);
          where.created_at.gte = startDate;
        }

        if (query.endDate) {
          const endDate = new Date(query.endDate);
          endDate.setUTCHours(23, 59, 59, 999);
          where.created_at.lte = endDate;
        }
      }

      // Get total count
      const totalCount = await this.prisma.testCall.count({ where });

      // Get test calls
      const testCalls = await this.prisma.testCall.findMany({
        where,
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          costs: {
            select: {
              id: true,
              type: true,
              amount: true,
              summary: true,
              created_at: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        testCalls,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          organisation: query.organisation,
          search: query.search,
          startDate: query.startDate,
          endDate: query.endDate,
        },
      };

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: {
            testCallCount: testCalls.length,
            totalCount,
            page,
          },
        }),
        methodName,
      );

      return ApiResponse.success('Test calls retrieved successfully', result);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
        methodName,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve test calls');
    }
  }

  async findOne(id: number) {
    const methodName = 'findOne';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id },
      }),
      methodName,
    );

    try {
      const testCall = await this.prisma.testCall.findUnique({
        where: { id },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          costs: {
            select: {
              id: true,
              type: true,
              amount: true,
              summary: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!testCall) {
        throw new NotFoundException('Test call not found');
      }

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: { testCallId: testCall.id },
        }),
        methodName,
      );

      return ApiResponse.success('Test call retrieved successfully', testCall);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
        methodName,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve test call');
    }
  }

  async update(id: number, updateTestCallDto: UpdateTestCallDto) {
    const methodName = 'update';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id, updateData: updateTestCallDto },
      }),
      methodName,
    );

    try {
      // Check if test call exists
      const existingTestCall = await this.prisma.testCall.findUnique({
        where: { id },
        include: {
          organisation: true,
        },
      });

      if (!existingTestCall) {
        throw new NotFoundException('Test call not found');
      }

      const { costs, ...testCallData } = updateTestCallDto;

      // Use Prisma transaction to update test call and costs together
      const result = await this.prisma.$transaction(async (prisma) => {
        // Update the test call
        const updatedTestCall = await prisma.testCall.update({
          where: { id },
          data: testCallData,
        });

        // Handle costs if provided
        let createdCosts: any[] = [];
        if (costs !== undefined) {
          // Delete existing costs for this test call
          await prisma.cost.deleteMany({
            where: { test_call_id: id },
          });

          // Create new costs if provided
          if (costs.length > 0) {
            createdCosts = await Promise.all(
              costs.map((costData) =>
                prisma.cost.create({
                  data: {
                    ...costData,
                    organisation_id: existingTestCall.organisation_id,
                    test_call_id: id,
                  },
                }),
              ),
            );
          }

          // Calculate total cost from individual costs if not explicitly provided
          let finalTotalCost = testCallData.total_cost;
          if (finalTotalCost === undefined && createdCosts.length > 0) {
            finalTotalCost = createdCosts.reduce(
              (sum, cost) => sum + cost.amount,
              0,
            );
          }

          // Update total cost if calculated from costs
          if (finalTotalCost !== undefined && finalTotalCost !== updatedTestCall.total_cost) {
            await prisma.testCall.update({
              where: { id },
              data: { total_cost: finalTotalCost },
            });
          }
        }

        // Return the final updated test call with all relationships
        return await prisma.testCall.findUnique({
          where: { id },
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            costs: {
              select: {
                id: true,
                type: true,
                amount: true,
                summary: true,
                created_at: true,
              },
              orderBy: { created_at: 'desc' },
            },
          },
        });
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: { 
            testCallId: result!.id,
            costCount: costs?.length || 0,
            totalCost: result!.total_cost,
          },
        }),
        methodName,
      );

      return ApiResponse.success('Test call updated successfully', result);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
        methodName,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update test call');
    }
  }

  async remove(id: number) {
    const methodName = 'remove';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id },
      }),
      methodName,
    );

    try {
      // Check if test call exists
      const existingTestCall = await this.prisma.testCall.findUnique({
        where: { id },
      });

      if (!existingTestCall) {
        throw new NotFoundException('Test call not found');
      }

      await this.prisma.testCall.delete({
        where: { id },
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: { testCallId: id },
        }),
        methodName,
      );

      return ApiResponse.success('Test call deleted successfully', { id });
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
        methodName,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete test call');
    }
  }
}