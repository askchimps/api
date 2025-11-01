import { Module } from '@nestjs/common';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { RoleGuard } from '@guards/role.guard';
import { SupabaseStrategy } from '@strategies/supabase.strategy';
import { CreditHistoryModule } from '@modules/credit-history/credit-history.module';

@Module({
    imports: [CreditHistoryModule],
    controllers: [OrganisationController],
    providers: [OrganisationService, JwtAuthGuard, RoleGuard, SupabaseStrategy],
})
export class OrganisationModule { }
