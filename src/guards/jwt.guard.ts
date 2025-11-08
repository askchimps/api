import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      this.logger.error(`JWT Authentication failed for ${request.url}:`, {
        error: err?.message,
        info: info?.message,
        hasAuthHeader: !!request.headers.authorization,
        userAgent: request.headers['user-agent']
      });
      
      // Provide more specific error messages
      if (!request.headers.authorization) {
        throw new UnauthorizedException('No authorization token provided');
      }
      if (info?.message) {
        throw new UnauthorizedException(`Token validation failed: ${info.message}`);
      }
      throw new UnauthorizedException('Authentication failed');
    }
    
    this.logger.log(`JWT Authentication successful for user: ${user.email}`);
    return user;
  }
}
