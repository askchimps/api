import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/public-client';

@Injectable()
export class PublicPrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// Keep PrismaService as an alias for backward compatibility
@Injectable()
export class PrismaService extends PublicPrismaService {}
