import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MESSAGE_TYPE } from '@prisma/client';

export interface CreateMessageDto {
  organisation: string;
  chatId: string;
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
  name?: string;
  source: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
  instagram_id?: string; // Unique Instagram chat identifier
  whatsapp_id?: string; // Unique WhatsApp chat identifier  
  human_handled?: number; // 0 or 1 to indicate if human handled
}

export interface UpdateChatDto {
  lead?: string; // Can be lead phone number or ID
  status?: string;
  instagram_id?: string; // Unique Instagram chat identifier
  whatsapp_id?: string; // Unique WhatsApp chat identifier
  human_handled?: number; // 0 or 1 to indicate if human handled
  unread_messages?: number; // Count of unread messages
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

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
      const chat = await this.prisma.chat.findFirst({
        where: {
          OR: [
            { id: createMessageData.chatId.length > 7 ? undefined : parseInt(createMessageData.chatId) },
            { instagram_id: createMessageData.chatId },
            { whatsapp_id: createMessageData.chatId }
          ],
          is_deleted: 0,
          organisation: {
            slug: createMessageData.organisation,
            is_deleted: 0,
            is_disabled: 0
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
          chat_id: chat.id,
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
        where: { id: chat.id },
        data: { updated_at: new Date(), unread_messages: chat.unread_messages + 1 },
      });

      this.logger.log(`[${messageId}] Message created successfully`);

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
          name: createChatData.name || null,
          source: createChatData.source,
          status: createChatData.status,
          instagram_id: createChatData.instagram_id || null,
          whatsapp_id: createChatData.whatsapp_id || null,
          human_handled: createChatData.human_handled || 0,
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

      this.logger.log(`[${chatId}] Chat created successfully: ${chat.id}`);
      return {
        success: true,
        message: 'Chat created successfully',
        data: {
          chat: {
            id: chat.id,
            status: chat.status,
            source: chat.source,
            name: chat.name,
            human_handled: chat.human_handled,
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

  async getChatMessages(chatId: number, organisation: string) {
    // Verify chat exists and belongs to organisation if provided
    const whereCondition: any = {
      id: chatId,
      is_deleted: 0,
    };

    if (organisation) {
      whereCondition.organisation = {
        slug: organisation
      };
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

  async getChatById(idOrExternalId: string, organisation: string) {
    this.logger.log(`Getting chat by ID: ${idOrExternalId}`);

    try {
      // Try to find chat by regular ID first, then by instagram_id, then by whatsapp_id
      let whereCondition: any;

      // If it's a number, search by regular ID
      if (idOrExternalId.length < 7) {
        whereCondition = {
          id: parseInt(idOrExternalId),
          is_deleted: 0,
          organisation: {
            slug: organisation
          }
        };
      } else {
        // If it's not a number, search by external IDs
        whereCondition = {
          OR: [
            { instagram_id: idOrExternalId },
            { whatsapp_id: idOrExternalId }
          ],
          is_deleted: 0,
          organisation: {
            slug: organisation
          }
        };
      }

      const chat = await this.prisma.chat.findFirst({
        where: whereCondition,
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

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      this.logger.log(`Chat found: ${chat.id}`);
      return {
        success: true,
        message: 'Chat retrieved successfully',
        data: chat,
      };
    } catch (error) {
      this.logger.error(`Failed to get chat by ID ${idOrExternalId}:`, error?.stack || error);
      throw error;
    }
  }

  async updateChat(idOrExternalId: string, updateData: any) {
    this.logger.log(`Updating chat by ID: ${idOrExternalId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateData)}`);

    try {
      // First, find the chat to make sure it exists
      const existingChat = await this.getChatById(idOrExternalId, updateData.organisation);
      if (!existingChat.success) {
        throw new NotFoundException('Chat not found');
      }

      const chatId = existingChat.data.id;
      const originalHumanHandled = existingChat.data.human_handled;

      // If lead is provided in update data, resolve it
      let leadId: number | null = null;
      if (updateData.lead) {
        const lead = await this.prisma.lead.findFirst({
          where: {
            OR: [
              { phone_number: updateData.lead },
              { id: updateData.lead.length > 8 ? undefined : parseInt(updateData.lead) }
            ],
            is_deleted: 0
          },
        });

        if (!lead) {
          throw new NotFoundException('Lead not found');
        }
        leadId = lead.id;
      }

      // Prepare update data
      const updatePayload: any = {};
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.instagram_id !== undefined) updatePayload.instagram_id = updateData.instagram_id;
      if (updateData.whatsapp_id !== undefined) updatePayload.whatsapp_id = updateData.whatsapp_id;
      if (updateData.human_handled !== undefined) updatePayload.human_handled = updateData.human_handled;
      if (updateData.unread_messages !== undefined) updatePayload.unread_messages = updateData.unread_messages;
      if (leadId !== null) updatePayload.lead_id = leadId;

      // Update the chat
      const updatedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data: updatePayload,
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

      this.logger.log(`Chat updated successfully: ${chatId}`);

      this.logger.log(`Chat update completed for chat ${chatId}`);

      return {
        success: true,
        message: 'Chat updated successfully',
        data: updatedChat,
      };
    } catch (error) {
      this.logger.error(`Failed to update chat ${idOrExternalId}:`, error?.stack || error);
      throw error;
    }
  }
}