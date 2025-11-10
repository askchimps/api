import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

export class FastifyIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    // For Fastify, we need to create the server without binding to HTTP
    const server = new Server({
      cors: {
        origin: process.env.FRONTEND_URL || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      ...options,
    });

    return server;
  }
}