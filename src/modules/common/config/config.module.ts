import { ConfigModule as NestJsConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { validationSchema } from './config.validation';
import { app, database, jwt, openai, supabase, websocket } from './variables';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestJsConfigModule.forRoot({
      load: [app, database, jwt, openai, supabase, websocket],
      cache: true,
      isGlobal: true,
      expandVariables: true,
      validationSchema: validationSchema,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
