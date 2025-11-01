import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { LoggerModule } from '@modules/common/logger/logger.module';

@Module({
    imports: [PrismaModule, LoggerModule],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}