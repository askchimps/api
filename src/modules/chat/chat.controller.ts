import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { HeaderAuthGuard } from '../../guards/header-auth.guard';
import { ChatService, CreateMessageDto as ServiceCreateMessageDto } from './chat.service';
import { CreateMessageDto, ChatParamDto } from './dto';

@Controller({
  path: 'chat',
  version: '1',
})
@UseGuards(HeaderAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':id/message')
  async createMessage(
    @Param() params: ChatParamDto,
    @Body() createMessageDto: CreateMessageDto
  ) {
    const chatId = parseInt(params.id);
    
    const serviceDto: ServiceCreateMessageDto = {
      chatId,
      role: createMessageDto.role,
      content: createMessageDto.content,
      prompt_tokens: createMessageDto.prompt_tokens,
      completion_tokens: createMessageDto.completion_tokens,
      total_cost: createMessageDto.total_cost,
    };
    
    return this.chatService.createMessage(serviceDto);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param() params: ChatParamDto
  ) {
    const chatId = parseInt(params.id);
    
    return this.chatService.getChatMessages(chatId);
  }
}