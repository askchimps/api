import { Module } from '@nestjs/common';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { JwtAuthGuard } from '@guards/jwt.guard';
import { SupabaseStrategy } from '@strategies/supabase.strategy';

@Module({
    controllers: [OrganisationController],
    providers: [OrganisationService, JwtAuthGuard, SupabaseStrategy],
    exports: [OrganisationService],
})
export class OrganisationModule { }