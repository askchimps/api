import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe, UploadedFiles, BadRequestException, Logger } from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { ChatService, CreateMessageDto as ServiceCreateMessageDto } from './chat.service';
import { CreateMessageDto, CreateMediaMessageDto, ChatParamDto } from './dto';
import { UploadService, MultipartFile } from '../upload/upload.service';
import { MESSAGE_TYPE } from '@prisma/client';

@Controller({
  path: 'chat',
  version: '1',
})
@UseGuards(HeaderAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly uploadService: UploadService,
  ) {}

  @Post(':id/message')
  async createMessage(
    @Param() params: ChatParamDto,
    @Body() createMessageDto: CreateMessageDto
  ) {
    const chatId = parseInt(params.id);
    this.logger.log(`Creating message for chat: ${chatId}`);
    this.logger.debug(`Message data: ${JSON.stringify(createMessageDto)}`);
    
    try {
      const serviceDto: ServiceCreateMessageDto = {
        chatId,
        role: createMessageDto.role,
        content: createMessageDto.content,
        message_type: createMessageDto.message_type,
        attachments: createMessageDto.attachments,
        prompt_tokens: createMessageDto.prompt_tokens,
        completion_tokens: createMessageDto.completion_tokens,
        total_cost: createMessageDto.total_cost,
      };
      
      const result = await this.chatService.createMessage(serviceDto);
      this.logger.log(`Message created successfully for chat: ${chatId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create message for chat ${chatId}:`, error?.stack || error);
      throw error;
    }
  }

  @Post(':id/message/media')
  async createMediaMessage(
    @Param() params: ChatParamDto,
    @Body() createMessageDto: CreateMediaMessageDto,
    @UploadedFiles() files?: any[]
  ) {
    const chatId = parseInt(params.id);
    this.logger.log(`Creating media message for chat: ${chatId}`);
    this.logger.debug(`Media message data: ${JSON.stringify(createMessageDto)}`);
    this.logger.debug(`Files provided: ${files?.length || 0}`);
    
    if (!files || files.length === 0) {
      this.logger.error('No files provided for media message');
      throw new BadRequestException('No files provided for media message');
    }

    try {
      // Determine category based on message type
      let category: 'image' | 'video' | 'audio' | 'document';
      switch (createMessageDto.message_type) {
        case MESSAGE_TYPE.IMAGE:
        case MESSAGE_TYPE.GIF:
          category = 'image';
          break;
        case MESSAGE_TYPE.VIDEO:
          category = 'video';
          break;
        case MESSAGE_TYPE.AUDIO:
          category = 'audio';
          break;
        case MESSAGE_TYPE.FILE:
          category = 'document';
          break;
        default:
          this.logger.error(`Invalid message type for media message: ${createMessageDto.message_type}`);
          throw new BadRequestException('Invalid message type for media message');
      }

      this.logger.debug(`Using category: ${category} for message type: ${createMessageDto.message_type}`);

      // Convert and upload files
      const multipartFiles: MultipartFile[] = [];
      for (const file of files) {
        multipartFiles.push({
          buffer: await file.toBuffer(),
          filename: file.filename,
          mimetype: file.mimetype,
          encoding: file.encoding,
          size: file.file.bytesRead || 0,
        });
      }

      this.logger.debug(`Uploading ${multipartFiles.length} files`);
      const uploadResults = await this.uploadService.uploadMultipleFiles(
        multipartFiles,
        category,
        `chat-${chatId}`
      );
      this.logger.debug(`Upload completed: ${uploadResults.length} files uploaded`);

      // Create message with attachments
      const serviceDto: ServiceCreateMessageDto = {
        chatId,
        role: createMessageDto.role,
        content: createMessageDto.content,
        message_type: createMessageDto.message_type,
        attachments: uploadResults,
        prompt_tokens: createMessageDto.prompt_tokens,
        completion_tokens: createMessageDto.completion_tokens,
        total_cost: createMessageDto.total_cost,
      };
      
      const result = await this.chatService.createMessage(serviceDto);
      this.logger.log(`Media message created successfully for chat: ${chatId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create media message for chat ${chatId}:`, error?.stack || error);
      throw error;
    }
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param() params: ChatParamDto
  ) {
    const chatId = parseInt(params.id);
    
    return this.chatService.getChatMessages(chatId);
  }
}