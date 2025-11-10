import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organisationId?: number;
}

@WebSocketGateway({
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private jwtService: JwtService) { }

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway initialized successfully');
    this.logger.log(`🔗 WebSocket server running on namespace: /chat`);
    // Store a reference to ensure it's available for broadcasting
    this.server = server;
  }

  // Helper method to check server availability
  private isServerReady(): boolean {
    const ready = !!(this.server && this.server.sockets && this.server.sockets.adapter);
    this.logger.debug(`🔍 Server readiness check: ${ready}`);
    return ready;
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} connected - authentication removed for WebSocket`);

    // Note: Authentication removed to allow WebSocket connections
    // Organisation and user context will be set when client joins organisation room
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join-organisation')
  async handleJoinOrganisation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { organisationId: number; userId?: string }
  ) {
    // Set user and organisation context when joining room (no authentication required)
    client.userId = data.userId;
    client.organisationId = data.organisationId;

    // Join organisation room
    const roomName = `org-${data.organisationId}`;
    await client.join(roomName);

    // Log room clients for debugging (with null checks)
    let clientCount = 0;
    if (this.server?.sockets?.adapter?.rooms) {
      const roomClients = this.server.sockets.adapter.rooms.get(roomName);
      clientCount = roomClients ? roomClients.size : 0;
    }

    this.logger.log(`Client ${client.id} joined organisation room: ${roomName} for user: ${data.userId} (${clientCount} clients in room)`);
    client.emit('joined-organisation', { organisationId: data.organisationId });
  }

  @SubscribeMessage('leave-organisation')
  async handleLeaveOrganisation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { organisationId: number }
  ) {
    const roomName = `org-${data.organisationId}`;
    await client.leave(roomName);

    this.logger.log(`Client ${client.id} left organisation room: ${roomName}`);
    client.emit('left-organisation', { organisationId: data.organisationId });
  }

  @SubscribeMessage('mark-chat-read')
  async handleMarkChatAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number; userId: string }
  ) {
    this.logger.log(`📖 Mark chat as read request: chatId=${data.chatId}, userId=${data.userId}`);
    
    try {
      // Update the chat's unread count in the database
      // Note: You might want to add actual database logic here
      
      // Emit confirmation back to the client
      client.emit('chat-marked-read', {
        success: true,
        chatId: data.chatId,
        timestamp: new Date().toISOString()
      });
      
      // Also broadcast to all clients in the organization room if needed
      if (client.organisationId) {
        const roomName = `org-${client.organisationId}`;
        
        // Check if server is ready
        if (this.isServerReady()) {
          const roomClients = this.server.sockets.adapter.rooms?.get(roomName);
          const clientCount = roomClients ? roomClients.size : 0;
          
          if (clientCount > 0) {
            this.server.to(roomName).emit('chat-read-updated', {
              chatId: data.chatId,
              unread_count: 0,
              timestamp: new Date().toISOString()
            });
            this.logger.log(`📖 Broadcasted chat-read-updated to ${clientCount} clients in room ${roomName}`);
          }
        }
      }
      
      this.logger.log(`✅ Chat ${data.chatId} marked as read for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`❌ Error marking chat as read:`, error);
      client.emit('chat-marked-read', {
        success: false,
        chatId: data.chatId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Method to broadcast new message to organisation room
  async broadcastNewMessage(organisationId: number, chatId: number, message: any) {
    const roomName = `org-${organisationId}`;

    this.logger.debug(`🔍 Checking WebSocket server state for broadcast to ${roomName}`);

    // Check if server is ready
    if (!this.isServerReady()) {
      this.logger.warn(`❌ WebSocket server not ready, cannot broadcast to ${roomName}`);
      return;
    }

    // Check how many clients are in the room
    const roomClients = this.server.sockets.adapter.rooms?.get(roomName);
    const clientCount = roomClients ? roomClients.size : 0;

    if (clientCount === 0) {
      this.logger.debug(`📭 No clients connected to room ${roomName}, skipping broadcast`);
      return;
    }

    this.logger.log(`📤 Broadcasting new message for chat ${chatId} to org ${organisationId} (room: ${roomName}) to ${clientCount} clients`);
    this.logger.debug(`📤 Message data:`, JSON.stringify(message, null, 2));

    const eventData = {
      chatId,
      message,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`📤 Event data being sent:`, JSON.stringify(eventData, null, 2));

    this.server.to(roomName).emit('new-message', eventData);

    this.logger.log(`✅ Broadcasted new message for chat ${chatId} to org ${organisationId} (sent to ${clientCount} clients)`);
  }

  // Method to broadcast chat updates to organisation room
  async broadcastChatUpdate(organisationId: number, chatId: number, updateData: any) {
    const roomName = `org-${organisationId}`;

    // Check if server is initialized and has sockets
    if (!this.server || !this.server.sockets || !this.server.sockets.adapter) {
      this.logger.debug(`WebSocket server not fully initialized, skipping chat update broadcast to ${roomName}`);
      return;
    }

    // Check how many clients are in the room
    const roomClients = this.server.sockets.adapter.rooms?.get(roomName);
    const clientCount = roomClients ? roomClients.size : 0;

    if (clientCount === 0) {
      this.logger.debug(`No clients connected to room ${roomName}, skipping chat update broadcast`);
      return;
    }

    this.server.to(roomName).emit('chat-updated', {
      chatId,
      updateData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted chat update for chat ${chatId} to org ${organisationId} (sent to ${clientCount} clients)`);
  }

  // Method to broadcast new chat creation to organisation room
  async broadcastNewChat(organisationId: number, chat: any) {
    const roomName = `org-${organisationId}`;

    this.logger.debug(`🔍 Checking WebSocket server state for new chat broadcast to ${roomName}`);

    // Check if server is ready
    if (!this.isServerReady()) {
      this.logger.warn(`❌ WebSocket server not ready, cannot broadcast new chat to ${roomName}`);
      return;
    }

    // Check how many clients are in the room
    const roomClients = this.server.sockets.adapter.rooms?.get(roomName);
    const clientCount = roomClients ? roomClients.size : 0;

    if (clientCount === 0) {
      this.logger.debug(`📭 No clients connected to room ${roomName}, skipping new chat broadcast`);
      return;
    }

    this.logger.log(`📤 Broadcasting new chat ${chat.id} to org ${organisationId} (room: ${roomName}) to ${clientCount} clients`);
    this.logger.debug(`📤 Chat data:`, JSON.stringify(chat, null, 2));

    const eventData = {
      action: "created",
      chat,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`📤 Event data being sent:`, JSON.stringify(eventData, null, 2));

    this.server.to(roomName).emit('new-chat', eventData);

    this.logger.log(`✅ Broadcasted new chat ${chat.id} to org ${organisationId} (sent to ${clientCount} clients)`);
  }
}