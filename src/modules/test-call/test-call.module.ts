import { Module } from '@nestjs/common';
import { TestCallService } from './test-call.service';
import { TestCallController } from './test-call.controller';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { LoggerModule } from '@modules/common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [TestCallController],
  providers: [TestCallService],
  exports: [TestCallService],
})
export class TestCallModule {}