import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, User, Conversation, Lead } from '@prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ApiResponse } from '@helpers/api-response.helper';

@Injectable()
export class ConversationService {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async getAll() {
    const methodName = 'getAll';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
      }),
    );

    const conversations = await this.prisma.conversation.findMany();

    this.logger.log(
      JSON.stringify({
        title: `${methodName} - end`,
        data: conversations,
      }),
    );

    return conversations;
  }

  async getOne(user: User, org_id: number, agent_id: number, idOrName: string) {
    const methodName = 'getOne';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { user, org_id, agent_id, idOrName },
      }),
      methodName,
    );

    const id = Number(idOrName);
    const name = idOrName;

    const whereCondition: Prisma.ConversationWhereInput = {
      organisation_id: org_id,
      agent_id,
      OR: [{ id: isNaN(id) ? undefined : id }, { name: name }],
    };

    if (!user.is_super_admin) {
      whereCondition.is_deleted = 0;
      whereCondition.is_disabled = 0;
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: whereCondition,
      include: {
        messages: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    this.logger.log(
      JSON.stringify({
        title: `${methodName} - end`,
        data: conversation,
      }),
      methodName,
    );

    return conversation;
  }

  async getAllMessages(
    user: User,
    org_id: number,
    agent_id: number,
    idOrName: string,
  ) {
    const methodName = 'getAllMessages';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { user, org_id, agent_id, idOrName },
      }),
      methodName,
    );

    const id = Number(idOrName);
    const name = idOrName;

    const whereCondition: Prisma.MessageWhereInput = {
      organisation_id: org_id,
      agent_id,
      conversation: {
        OR: [{ id: isNaN(id) ? undefined : id }, { name: name }],
      },
    };

    if (!user.is_super_admin) {
      whereCondition.is_deleted = 0;
      whereCondition.is_disabled = 0;
    }

    const messages = await this.prisma.message.findMany({
      where: whereCondition,
      orderBy: {
        created_at: 'asc',
      },
    });

    this.logger.log(
      JSON.stringify({
        title: `${methodName} - end`,
        data: messages,
      }),
      methodName,
    );

    return messages;
  }

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ApiResponse<Conversation>> {
    const methodName = 'create';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data: { createConversationDto },
      }),
      methodName,
    );

    try {
      const {
        organisation: organisation_slug,
        agent: agent_slug,
        lead,
        messages,
        costs,
        ...conversationData
      } = createConversationDto;

      // Verify organisation exists and is active
      const organisation = await this.prisma.organisation.findFirst({
        where: {
          slug: organisation_slug,
          is_deleted: 0,
          is_disabled: 0,
        },
      });

      if (!organisation) {
        throw new NotFoundException('Organization not found or inactive');
      }

      // Verify agent exists, is active, and belongs to the organisation
      const agent = await this.prisma.agent.findFirst({
        where: {
          slug: agent_slug,
          organisation_id: organisation.id,
          is_deleted: 0,
          is_disabled: 0,
        },
      });

      if (!agent) {
        throw new NotFoundException(
          'Agent not found, inactive, or does not belong to the organisation',
        );
      }

      const whereCondition: Prisma.LeadWhereInput = {
        OR: [],
        organisation: {
          slug: organisation_slug,
        },
      };

      // Try to parse as ID if it's numeric
      if (lead) {
        if (lead.length < 8) {
          const numericId = parseInt(lead);
          (whereCondition.OR as Prisma.LeadWhereInput[]).push({
            id: numericId,
          });
        } else {
          // Always search by phone number as well
          (whereCondition.OR as Prisma.LeadWhereInput[]).push({
            phone_number: lead,
          });
        }
      }

      // Verify lead exists if lead_id is provided
      let leadData: Lead | null = null;
      if (lead) {
        leadData = await this.prisma.lead.findFirst({
          where: whereCondition,
        });

        if (!leadData) {
          throw new NotFoundException(
            'Lead not found or does not belong to the organisation',
          );
        }
      }

      // Check if conversation name is unique within the organisation
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          name: createConversationDto.name,
          organisation_id: organisation.id,
        },
      });

      if (existingConversation) {
        throw new BadRequestException(
          'Conversation with this name already exists in the organisation',
        );
      }

      // Use a transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the conversation
        const conversation = await prisma.conversation.create({
          data: {
            ...conversationData,
            organisation_id: organisation.id,
            agent_id: agent.id,
            lead_id: leadData?.id,
          },
          include: {
            organisation: {
              select: { id: true, name: true, slug: true },
            },
            agent: {
              select: { id: true, name: true, slug: true },
            },
            lead: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
              },
            },
            messages: {
              orderBy: { created_at: 'asc' },
            },
          },
        });

        // Create all messages for the conversation
        const createdMessages = await Promise.all(
          messages.map((messageData) =>
            prisma.message.create({
              data: {
                ...messageData,
                organisation_id: organisation.id,
                agent_id: agent.id,
                conversation_id: conversation.id,
              },
            }),
          ),
        );

        // Create all costs for the conversation if provided
        let createdCosts: any[] = [];
        if (costs && costs.length > 0) {
          createdCosts = await Promise.all(
            costs.map((costData) =>
              prisma.cost.create({
                data: {
                  ...costData,
                  organisation_id: organisation.id,
                  conversation_id: conversation.id,
                },
              }),
            ),
          );
        }

        // Update conversation with total token counts from messages
        const totalPromptTokens =
          conversation.prompt_tokens +
          createdMessages.reduce((sum, msg) => sum + msg.prompt_tokens, 0);
        const totalCompletionTokens =
          conversation.completion_tokens +
          createdMessages.reduce((sum, msg) => sum + msg.completion_tokens, 0);

        // Calculate total cost from individual costs if not provided
        let finalTotalCost = conversationData.total_cost;
        if (!finalTotalCost && createdCosts.length > 0) {
          finalTotalCost = createdCosts.reduce(
            (sum, cost) => sum + cost.amount,
            0,
          );
        }

        // Update the conversation with aggregated token counts and total cost
        const updatedConversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            prompt_tokens: totalPromptTokens,
            completion_tokens: totalCompletionTokens,
            total_cost: finalTotalCost,
          },
          include: {
            organisation: {
              select: { id: true, name: true, slug: true },
            },
            agent: {
              select: { id: true, name: true, slug: true },
            },
            lead: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
              },
            },
            messages: {
              orderBy: { created_at: 'asc' },
            },
            cost: true,
          },
        });

        return updatedConversation;
      });

      this.logger.log(
        JSON.stringify({
          title: `${methodName} - success`,
          data: {
            conversationId: result.id,
            messageCount: messages?.length || 0,
            costCount: costs?.length || 0,
            totalPromptTokens: result.prompt_tokens,
            totalCompletionTokens: result.completion_tokens,
            totalCost: result.total_cost,
          },
        }),
        methodName,
      );

      return ApiResponse.success(
        'Conversation created successfully',
        result,
        201,
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          title: `${methodName} - error`,
          error: error.message,
          stack: error.stack,
        }),
        methodName,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Failed to create conversation');
    }
  }
}
