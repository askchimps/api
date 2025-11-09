import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.organisationId = payload.organisation_id;

      this.logger.log(`Client ${client.id} connected for user ${client.userId}, org ${client.organisationId}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join-organisation')
  async handleJoinOrganisation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { organisationId: number }
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join organisation room
    const roomName = `org-${data.organisationId}`;
    await client.join(roomName);
    
    this.logger.log(`Client ${client.id} joined organisation room: ${roomName}`);
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

  // Method to broadcast new message to organisation room
  async broadcastNewMessage(organisationId: number, chatId: number, message: any) {
    const roomName = `org-${organisationId}`;
    
    this.server.to(roomName).emit('new-message', {
      chatId,
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted new message for chat ${chatId} to org ${organisationId}`);
  }

  // Method to broadcast chat updates to organisation room
  async broadcastChatUpdate(organisationId: number, chatId: number, updateData: any) {
    const roomName = `org-${organisationId}`;
    
    this.server.to(roomName).emit('chat-updated', {
      chatId,
      updateData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted chat update for chat ${chatId} to org ${organisationId}`);
  }
}