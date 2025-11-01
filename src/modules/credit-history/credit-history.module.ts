import { Module } from '@nestjs/common';
import { CreditHistoryService } from './credit-history.service';
import { CreditHistoryController } from './credit-history.controller';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { LoggerModule } from '@modules/common/logger/logger.module';

@Module({
    imports: [PrismaModule, LoggerModule],
    controllers: [CreditHistoryController],
    providers: [CreditHistoryService],
    exports: [CreditHistoryService],
})
export class CreditHistoryModule {}