import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { MESSAGE_TYPE } from '@prisma/client';

export interface CreateMessageDto {
  chatId: number;
  role: 'user' | 'assistant' | 'bot';
  content?: string;
  message_type?: MESSAGE_TYPE;
  attachments?: CreateAttachmentData[];
  prompt_tokens?: number;
  completion_tokens?: number;
  total_cost?: number;
}

export interface CreateAttachmentData {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createMessage(createMessageData: CreateMessageDto) {
    const messageId = Math.random().toString(36).substring(7);
    this.logger.log(`[${messageId}] Creating message - ChatId: ${createMessageData.chatId}, Role: ${createMessageData.role}, Type: ${createMessageData.message_type}`);
    this.logger.debug(`[${messageId}] Message data: ${JSON.stringify({ 
      ...createMessageData, 
      attachments: createMessageData.attachments?.length || 0 
    })}`);

    try {
      // First, verify the chat exists and get organisation details
      this.logger.debug(`[${messageId}] Looking up chat: ${createMessageData.chatId}`);
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
        this.logger.error(`[${messageId}] Chat not found: ${createMessageData.chatId}`);
        throw new NotFoundException('Chat not found');
      }

      this.logger.debug(`[${messageId}] Chat found: ${chat.id} (org: ${chat.organisation_id}, agent: ${chat.agent_id})`);

      // Create the message with attachments
      this.logger.debug(`[${messageId}] Creating message in database`);
      const message = await this.prisma.message.create({
        data: {
          organisation_id: chat.organisation_id,
          agent_id: chat.agent_id,
          chat_id: createMessageData.chatId,
          role: createMessageData.role,
          content: createMessageData.content,
          message_type: createMessageData.message_type || 'TEXT',
          prompt_tokens: createMessageData.prompt_tokens || 0,
          completion_tokens: createMessageData.completion_tokens || 0,
          total_cost: createMessageData.total_cost,
          attachments: createMessageData.attachments ? {
            create: createMessageData.attachments.map(attachment => ({
              file_url: attachment.file_url,
              file_name: attachment.file_name,
              file_size: attachment.file_size,
              file_type: attachment.file_type,
              width: attachment.width,
              height: attachment.height,
              duration: attachment.duration,
              thumbnail_url: attachment.thumbnail_url,
            }))
          } : undefined,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
      });

      this.logger.debug(`[${messageId}] Message created in database: ${message.id}`);

      // Update chat's updated_at timestamp
      this.logger.debug(`[${messageId}] Updating chat timestamp`);
      await this.prisma.chat.update({
        where: { id: createMessageData.chatId },
        data: { updated_at: new Date() },
      });

      this.logger.debug(`[${messageId}] Broadcasting message via WebSocket`);
      // Broadcast the new message via WebSocket
      await this.chatGateway.broadcastNewMessage(
        chat.organisation_id,
        createMessageData.chatId,
        {
        action: "created", // Add action field that frontend expects
        id: message.id,
        role: message.role,
        content: message.content,
        message_type: message.message_type,
        attachments: message.attachments,
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

    this.logger.log(`[${messageId}] Message created successfully: ${message.id}`);
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
    } catch (error) {
      this.logger.error(`[${messageId}] Message creation failed:`, error?.stack || error);
      throw error;
    }
  }  async getChatMessages(chatId: number, organisationId?: number) {
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
            attachments: true,
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