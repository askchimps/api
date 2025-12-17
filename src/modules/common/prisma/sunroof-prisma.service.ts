import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/sunroof-client';

@Injectable()
export class SunroofPrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

