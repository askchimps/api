import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { UncaughtErrorException } from '@filters/uncaught-exception.filter';
import { GlobalExceptionFilter } from '@filters/global-exception.filter';
import { ConfigService } from '@modules/common/config/config.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { FastifyIoAdapter } from './adapters/fastify-io.adapter';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { ResponseInterceptor } from '@interceptors/response.interceptor';

declare const module: any;

async function bootstrap() {
  const fastifyAdapter = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
    }),
    { bufferLogs: true },
  );

  const configService = fastifyAdapter.get(ConfigService);
  const port = configService.get('PORT', { infer: true }) || 4022;

  const logger = fastifyAdapter.get(PinoLoggerService);
  logger.setContext(bootstrap.name);

  // ==================================================
  // configureWebSocketAdapter
  // ==================================================
  fastifyAdapter.useWebSocketAdapter(new IoAdapter(fastifyAdapter));

  // Initialize WebSocket server manually for testing
  const { Server } = require('socket.io');
  const socketServer = new Server(4023, {
    transports: ['websocket', 'polling'],
  });

  // Store connected clients for debugging
  const connectedClients = new Map();

  socketServer.on('connection', (socket: any) => {
    logger.log(`🔗 Manual WebSocket client connected: ${socket.id}`);
    connectedClients.set(socket.id, socket);

    socket.on('join-organisation', (data: any) => {
      logger.log(`📤 Manual join-organisation: ${JSON.stringify(data)}`);
      socket.join(`org-${data.organisationId}`);
      socket.emit('joined-organisation', { organisationId: data.organisationId });

      // Store organisation context on socket
      socket.organisationId = data.organisationId;
      socket.userId = data.userId;

      // Log room info
      const room = socketServer.sockets.adapter.rooms.get(`org-${data.organisationId}`);
      logger.log(`👥 Room org-${data.organisationId} now has ${room ? room.size : 0} clients`);
    });

    socket.on('mark-chat-read', (data: any) => {
      logger.log(`📖 Manual mark-chat-read: ${JSON.stringify(data)}`);
      
      // Emit confirmation back to client
      socket.emit('chat-marked-read', {
        success: true,
        chatId: data.chatId,
        timestamp: new Date().toISOString()
      });

      // Broadcast to all clients in the organisation room
      if (socket.organisationId) {
        const roomName = `org-${socket.organisationId}`;
        const room = socketServer.sockets.adapter.rooms.get(roomName);
        const clientCount = room ? room.size : 0;

        if (clientCount > 0) {
          socketServer.to(roomName).emit('chat-read-updated', {
            chatId: data.chatId,
            unread_count: 0,
            timestamp: new Date().toISOString()
          });
          logger.log(`📖 Manual server broadcasted chat-read-updated to ${clientCount} clients in room ${roomName}`);
        }
      }
    });

    socket.on('disconnect', () => {
      logger.log(`❌ Manual WebSocket client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });

    socket.on('error', (error: any) => {
      logger.error(`🚨 Manual WebSocket client error: ${error}`);
    });
  });

  // Add a method to broadcast messages from the manual server
  (socketServer as any).broadcastNewMessage = (organisationId: number, chatId: number, message: any) => {
    const roomName = `org-${organisationId}`;
    const room = socketServer.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;

    logger.log(`📤 Manual server broadcasting to room ${roomName} (${clientCount} clients)`);

    if (clientCount > 0) {
      socketServer.to(roomName).emit('new-message', {
        chatId,
        message,
        timestamp: new Date().toISOString(),
      });
      logger.log(`✅ Manual server broadcasted message to ${clientCount} clients`);
    } else {
      logger.log(`📭 Manual server: No clients in room ${roomName}`);
    }
  };

  // Add a method to broadcast new chat creation from the manual server
  (socketServer as any).broadcastNewChat = (organisationId: number, chat: any) => {
    const roomName = `org-${organisationId}`;
    const room = socketServer.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;

    logger.log(`📤 Manual server broadcasting new chat ${chat.id} to room ${roomName} (${clientCount} clients)`);

    if (clientCount > 0) {
      socketServer.to(roomName).emit('new-chat', {
        action: "created",
        chat,
        timestamp: new Date().toISOString(),
      });
      logger.log(`✅ Manual server broadcasted new chat to ${clientCount} clients`);
    } else {
      logger.log(`📭 Manual server: No clients in room ${roomName}`);
    }
  };

  // Add a method to broadcast chat updates from the manual server
  (socketServer as any).broadcastChatUpdate = (organisationId: number, chatId: number, updateData: any) => {
    const roomName = `org-${organisationId}`;
    const room = socketServer.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;

    logger.log(`📤 Manual server broadcasting chat update ${chatId} to room ${roomName} (${clientCount} clients)`);

    if (clientCount > 0) {
      socketServer.to(roomName).emit('chat-updated', {
        chatId,
        updateData,
        timestamp: new Date().toISOString(),
      });
      logger.log(`✅ Manual server broadcasted chat update to ${clientCount} clients`);
    } else {
      logger.log(`📭 Manual server: No clients in room ${roomName}`);
    }
  };

  logger.log(`🚀 Manual WebSocket server started on port ${port}`);

  // Assign the manual Socket.IO server instance to ChatGateway so broadcasts use it
  try {
    const chatGateway = fastifyAdapter.get(ChatGateway);
    if (chatGateway) {
      // @ts-ignore - assign runtime server instance
      chatGateway.server = socketServer;

      // Override the broadcastNewMessage method to use manual server
      chatGateway.broadcastNewMessage = (organisationId: number, chatId: number, message: any) => {
        return (socketServer as any).broadcastNewMessage(organisationId, chatId, message);
      };

      // Override the broadcastNewChat method to use manual server
      chatGateway.broadcastNewChat = (organisationId: number, chat: any) => {
        return (socketServer as any).broadcastNewChat(organisationId, chat);
      };

      // Override the broadcastChatUpdate method to use manual server
      chatGateway.broadcastChatUpdate = (organisationId: number, chatId: number, updateData: any) => {
        return (socketServer as any).broadcastChatUpdate(organisationId, chatId, updateData);
      };

      logger.log('🔗 Assigned manual Socket.IO server and broadcast methods to ChatGateway');
    } else {
      logger.warn('⚠️ ChatGateway instance not found to assign Socket.IO server');
    }
  } catch (err) {
    logger.error('Error assigning manual Socket.IO server to ChatGateway', err);
  }

  // ==================================================
  // configureNestAPIVersioning
  // ==================================================
  fastifyAdapter.enableVersioning();

  // ==================================================
  // configureFastifySettings
  // ==================================================

  if (configService.IS_PRODUCTION) {
    // Initialize security middleware module 'fastify-helmet'
    fastifyAdapter.register(fastifyHelmet);
  }
  fastifyAdapter.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
  }); // Initialize fastify-compress to better handle high-level traffic

  // Configure multipart for file uploads
  fastifyAdapter.register(fastifyMultipart, {
    attachFieldsToBody: false, // Important: Keep this false for NestJS compatibility
    sharedSchemaId: 'MultipartFileSchema',
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000, // Max field value size in bytes  
      fields: 10, // Max number of non-file fields
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 10, // Max number of file fields
      headerPairs: 2000 // Max number of header key=>value pairs
    },
  }); // Enable multipart data support with proper limits

  // Add request logging middleware
  fastifyAdapter.register(async (fastify) => {
    fastify.addHook('onRequest', async (request, reply) => {
      logger.log(`=== INCOMING REQUEST ===`);
      logger.log(`${request.method} ${request.url}`);
      logger.log(`Headers: ${JSON.stringify(request.headers)}`);
      logger.log(`Content-Type: ${request.headers['content-type']}`);
      logger.log(`Content-Length: ${request.headers['content-length']}`);
      if (request.url.includes('/upload')) {
        logger.log(`=== UPLOAD REQUEST DETECTED ===`);
        logger.log(`Raw request available: ${!!request.raw}`);
      }
    });
  });

  fastifyAdapter.enableCors({ origin: true });

  // ==================================================
  // configureNestGlobals
  // ==================================================

  // Add global exception filter for better error logging
  fastifyAdapter.useGlobalFilters(new GlobalExceptionFilter());
  fastifyAdapter.useGlobalFilters(new UncaughtErrorException(logger));

  fastifyAdapter.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );

  fastifyAdapter.useGlobalInterceptors(new ResponseInterceptor());

  // ==================================================
  // configureStaticFiles
  // ==================================================

  // Serve uploaded files statically
  await fastifyAdapter.register(require('@fastify/static'), {
    root: require('path').join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
  });

  // ==================================================
  // configurePinoLogger
  // ==================================================

  fastifyAdapter.useLogger(logger);

  // ==================================================
  // configureHotReload
  // ==================================================

  await fastifyAdapter.listen(port, '0.0.0.0');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => fastifyAdapter.close());
  }

  logger.log(
    `Environment: ${configService.get('NODE_ENV', { infer: true })}`,
    `Server running on ${await fastifyAdapter.getUrl()}`,
  );
}

(async () => await bootstrap())();
