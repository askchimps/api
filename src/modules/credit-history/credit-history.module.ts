import { Module } from '@nestjs/common';
import { CreditHistoryController } from './credit-history.controller';
import { CreditHistoryService } from './credit-history.service';

@Module({
    controllers: [CreditHistoryController],
    providers: [CreditHistoryService],
    exports: [CreditHistoryService]
})
export class CreditHistoryModule { }