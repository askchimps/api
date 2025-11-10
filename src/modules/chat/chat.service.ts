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

export interface CreateChatDto {
  organisation: string; // Can be organisation slug or ID
  agent: string; // Can be agent slug or ID
  lead?: string; // Can be lead phone number or ID (optional)
  source: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
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
  }

  async createChat(createChatData: CreateChatDto) {
    const chatId = Math.random().toString(36).substring(7);
    this.logger.log(`[${chatId}] Creating new chat - Org: ${createChatData.organisation}, Agent: ${createChatData.agent}, Source: ${createChatData.source}`);
    this.logger.debug(`[${chatId}] Chat data: ${JSON.stringify(createChatData)}`);

    try {
      // Resolve organisation slug to ID
      this.logger.debug(`[${chatId}] Looking up organisation: ${createChatData.organisation}`);
      const organisation = await this.prisma.organisation.findFirst({
        where: {
          OR: [
            { slug: createChatData.organisation },
            { id: isNaN(parseInt(createChatData.organisation)) ? undefined : parseInt(createChatData.organisation) }
          ],
          is_deleted: 0,
          is_disabled: 0
        },
        select: {
          id: true,
          name: true,
          slug: true,
        }
      });

      if (!organisation) {
        this.logger.error(`[${chatId}] Organisation not found: ${createChatData.organisation}`);
        throw new NotFoundException('Organisation not found');
      }

      // Resolve agent slug to ID and verify it belongs to the organisation
      this.logger.debug(`[${chatId}] Looking up agent: ${createChatData.agent}`);
      const agent = await this.prisma.agent.findFirst({
        where: {
          OR: [
            { slug: createChatData.agent },
            { id: isNaN(parseInt(createChatData.agent)) ? undefined : parseInt(createChatData.agent) }
          ],
          organisation_id: organisation.id,
          is_deleted: 0,
          is_disabled: 0 
        },
        select: {
          id: true,
          name: true,
          slug: true,
        }
      });

      if (!agent) {
        this.logger.error(`[${chatId}] Agent not found or doesn't belong to organisation: ${createChatData.agent}`);
        throw new NotFoundException('Agent not found or does not belong to organisation');
      }

      // If lead is provided, resolve lead phone number or ID
      let lead: any = null;
      if (createChatData.lead) {
        this.logger.debug(`[${chatId}] Looking up lead: ${createChatData.lead}`);
        lead = await this.prisma.lead.findFirst({
          where: {
            OR: [
              { phone_number: createChatData.lead },
              { id: createChatData.lead.length > 8 ? undefined : parseInt(createChatData.lead) }
            ],
            is_deleted: 0 
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            status: true,
          }
        });

        if (!lead) {
          this.logger.error(`[${chatId}] Lead not found: ${createChatData.lead}`);
          throw new NotFoundException('Lead not found');
        }
      }

      // Create the chat
      this.logger.debug(`[${chatId}] Creating chat in database`);
      const chat = await this.prisma.chat.create({
        data: {
          organisation_id: organisation.id,
          agent_id: agent.id,
          lead_id: lead?.id || null,
          source: createChatData.source,
          status: createChatData.status,
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
              slug: true,
            },
          },
          lead: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              phone_number: true,
              email: true,
              status: true,
            },
          },
        },
      });

      this.logger.debug(`[${chatId}] Chat created in database: ${chat.id}`);

      this.logger.debug(`[${chatId}] Broadcasting new chat via WebSocket`);
      // Broadcast the new chat via WebSocket
      await this.chatGateway.broadcastNewChat(
        organisation.id,
        {
          id: chat.id,
          status: chat.status,
          source: chat.source,
          unread_messages: chat.unread_messages,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          organisation: chat.organisation,
          agent: chat.agent,
          lead: chat.lead,
          // Include first two messages (will be empty for new chat)
          messages: [],
        }
      );

      this.logger.log(`[${chatId}] Chat created successfully: ${chat.id}`);
      return {
        success: true,
        message: 'Chat created successfully',
        data: {
          chat: {
            id: chat.id,
            status: chat.status,
            source: chat.source,
            unread_messages: chat.unread_messages,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            organisation: chat.organisation,
            agent: chat.agent,
            lead: chat.lead,
          },
        },
      };
    } catch (error) {
      this.logger.error(`[${chatId}] Chat creation failed:`, error?.stack || error);
      throw error;
    }
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