import { Module } from '@nestjs/common';
import { CostService } from './cost.service';
import { CostController } from './cost.controller';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { LoggerModule } from '@modules/common/logger/logger.module';

@Module({
    imports: [PrismaModule, LoggerModule],
    controllers: [CostController],
    providers: [CostService],
    exports: [CostService],
})
export class CostModule {}