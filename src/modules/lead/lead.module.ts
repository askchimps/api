import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { LoggerModule } from '@modules/common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
