import { Global, Module } from '@nestjs/common';
import { PrismaService, PublicPrismaService } from './prisma.service';
import { MagpiePrismaService } from './magpie-prisma.service';
import { SunroofPrismaService } from './sunroof-prisma.service';

@Global()
@Module({
  providers: [
    PublicPrismaService,
    PrismaService, // Alias for backward compatibility
    MagpiePrismaService,
    SunroofPrismaService,
  ],
  exports: [
    PublicPrismaService,
    PrismaService, // Alias for backward compatibility
    MagpiePrismaService,
    SunroofPrismaService,
  ],
})
export class PrismaModule {}
