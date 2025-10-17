import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@modules/common/config/config.module';
import { HttpModule } from '@modules/common/http/http.module';
import { JwtModule } from '@modules/common/jwt/jwt.module';
import { LoggerModule } from '@modules/common/logger/logger.module';
import { PrismaModule } from '@modules/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { OrganisationModule } from '@modules/organisation/organisation.module';
// import { AgentModule } from '@modules/agent/agent.module';
// import { ConversationModule } from '@modules/conversation/conversation.module';

type NestModuleImport =
  | Type<any>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<any>;

// SubModule used by the server
const appModules: NestModuleImport[] = [
  AuthModule,
  UserModule,
  OrganisationModule,
  // AgentModule,
  // ConversationModule
];

// Infrastructure Modules (DB, config) used by the server
const infrastructureModules: NestModuleImport[] = [
  PassportModule,
  ConfigModule,
  HttpModule,
  JwtModule,
  LoggerModule,
  PrismaModule,
];


@Module({
  imports: [...infrastructureModules, ...appModules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
