import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@modules/common/config/config.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { User, UserOrganisation } from '@prisma/public-client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';

interface JwtPayload {
  sub: string;
}

interface JwtUser extends User {
  user_organisations: UserOrganisation[];
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser | null> {
    this.logger.log(`JWT validation attempt for user ID: ${payload.sub}`, 'SupabaseStrategy');
    
    try {
      // TODO: add caching
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, is_deleted: 0, is_disabled: 0 },
        include: { user_organisations: true },
      });

      if (!user) {
        this.logger.warn(`User not found or disabled for ID: ${payload.sub}`, 'SupabaseStrategy');
        return null;
      }

      this.logger.log(`JWT validation successful for user: ${user.email}`, 'SupabaseStrategy');
      return user;
    } catch (error) {
      this.logger.error(`Error during JWT validation for user ${payload.sub}`, error.stack, 'SupabaseStrategy');
      return null;
    }
  }
}
