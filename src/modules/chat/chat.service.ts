import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatGateway } from './chat.gateway';

export interface CreateMessageDto {
  chatId: number;
  role: 'user' | 'assistant' | 'bot';
  content: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_cost?: number;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createMessage(createMessageData: CreateMessageDto) {
    // First, verify the chat exists and get organisation details
    const chat = await this.prisma.chat.findUnique({
      where: { 
        id: createMessageData.chatId,
        is_deleted: 0 
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        organisation_id: chat.organisation_id,
        agent_id: chat.agent_id,
        chat_id: createMessageData.chatId,
        role: createMessageData.role,
        content: createMessageData.content,
        prompt_tokens: createMessageData.prompt_tokens || 0,
        completion_tokens: createMessageData.completion_tokens || 0,
        total_cost: createMessageData.total_cost,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update chat's updated_at timestamp
    await this.prisma.chat.update({
      where: { id: createMessageData.chatId },
      data: { updated_at: new Date() },
    });

    // Broadcast the new message via WebSocket
    await this.chatGateway.broadcastNewMessage(
      chat.organisation_id,
      createMessageData.chatId,
      {
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
        agent: message.agent,
        chat: {
          id: chat.id,
          status: chat.status,
          source: chat.source,
          organisation: chat.organisation,
          lead: chat.lead,
        },
      }
    );

    return {
      success: true,
      message: 'Message created successfully',
      data: {
        message,
        chat: {
          id: chat.id,
          status: chat.status,
          source: chat.source,
          organisation: chat.organisation,
          agent: chat.agent,
          lead: chat.lead,
        },
      },
    };
  }

  async getChatMessages(chatId: number, organisationId?: number) {
    // Verify chat exists and belongs to organisation if provided
    const whereCondition: any = {
      id: chatId,
      is_deleted: 0,
    };

    if (organisationId) {
      whereCondition.organisation_id = organisationId;
    }

    const chat = await this.prisma.chat.findUnique({
      where: whereCondition,
      include: {
        messages: {
          where: { is_deleted: 0 },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
        organisation: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return {
      success: true,
      message: 'Chat messages retrieved successfully',
      data: chat,
    };
  }
}