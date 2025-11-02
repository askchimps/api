import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { ApiResponse } from '@helpers/api-response.helper';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { GetCostsQueryDto } from './dto/get-costs.dto';
import { Prisma, Cost } from '@prisma/client';

@Injectable()
export class CostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {}

  async create(createCostDto: CreateCostDto): Promise<ApiResponse<Cost>> {
    const methodName = 'create';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: createCostDto,
      }),
      methodName,
    );

    try {
      // Validate organisation exists
      const organisation = await this.prisma.organisation.findFirst({
        where: {
          slug: createCostDto.organisation,
          is_deleted: 0,
          is_disabled: 0,
        },
      });

      if (!organisation) {
        throw new NotFoundException('Organisation not found');
      }

      // Validate conversation exists if provided
      if (createCostDto.conversation_id) {
        const conversation = await this.prisma.conversation.findFirst({
          where: {
            id: createCostDto.conversation_id,
            organisation_id: organisation.id,
            is_deleted: 0,
            is_disabled: 0,
          },
        });

        if (!conversation) {
          throw new NotFoundException('Conversation not found');
        }
      }

      const { organisation: _, ...rest } = createCostDto;

      const cost = await this.prisma.cost.create({
        data: {
          ...rest,
          organisation_id: organisation.id,
          conversation_id: createCostDto.conversation_id,
        },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: cost,
        }),
        methodName,
      );

      return ApiResponse.success('Cost created successfully', cost);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message,
        }),
        methodName,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Failed to create cost');
    }
  }

  async findAll(query: GetCostsQueryDto): Promise<
    ApiResponse<{
      costs: Cost[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const methodName = 'findAll';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: query,
      }),
      methodName,
    );

    try {
      const {
        page = 1,
        limit = 20,
        organisation_id,
        conversation_id,
        type,
        start_date,
        end_date,
      } = query;
      const skip = (page - 1) * limit;

      const whereCondition: Prisma.CostWhereInput = {};

      if (organisation_id) {
        whereCondition.organisation_id = organisation_id;
      }

      if (conversation_id) {
        whereCondition.conversation_id = conversation_id;
      }

      if (type) {
        whereCondition.type = type;
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

      const [costs, total] = await Promise.all([
        this.prisma.cost.findMany({
          where: whereCondition,
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            conversation: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.cost.count({
          where: whereCondition,
        }),
      ]);

      const result = {
        costs,
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

      return ApiResponse.success('Costs retrieved successfully', result);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message,
        }),
        methodName,
      );

      throw new BadRequestException('Failed to retrieve costs');
    }
  }

  async findOne(id: number): Promise<ApiResponse<Cost>> {
    const methodName = 'findOne';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id },
      }),
      methodName,
    );

    try {
      const cost = await this.prisma.cost.findUnique({
        where: { id },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!cost) {
        throw new NotFoundException('Cost not found');
      }

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: cost,
        }),
        methodName,
      );

      return ApiResponse.success('Cost retrieved successfully', cost);
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

      throw new BadRequestException('Failed to retrieve cost');
    }
  }

  async update(
    id: number,
    updateCostDto: UpdateCostDto,
  ): Promise<ApiResponse<Cost>> {
    const methodName = 'update';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id, updateCostDto },
      }),
      methodName,
    );

    try {
      const existingCost = await this.prisma.cost.findUnique({
        where: { id },
      });

      if (!existingCost) {
        throw new NotFoundException('Cost not found');
      }

      // Validate conversation exists if provided
      if (updateCostDto.conversation_id) {
        const conversation = await this.prisma.conversation.findFirst({
          where: {
            id: updateCostDto.conversation_id,
            organisation_id: existingCost.organisation_id,
            is_deleted: 0,
            is_disabled: 0,
          },
        });

        if (!conversation) {
          throw new NotFoundException('Conversation not found');
        }
      }

      const cost = await this.prisma.cost.update({
        where: { id },
        data: updateCostDto,
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: cost,
        }),
        methodName,
      );

      return ApiResponse.success('Cost updated successfully', cost);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error?.message,
        }),
        methodName,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Failed to update cost');
    }
  }

  async remove(id: number): Promise<ApiResponse<{ id: number }>> {
    const methodName = 'remove';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { id },
      }),
      methodName,
    );

    try {
      const existingCost = await this.prisma.cost.findUnique({
        where: { id },
      });

      if (!existingCost) {
        throw new NotFoundException('Cost not found');
      }

      await this.prisma.cost.delete({
        where: { id },
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: { id },
        }),
        methodName,
      );

      return ApiResponse.success('Cost deleted successfully', { id });
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

      throw new BadRequestException('Failed to delete cost');
    }
  }
}
