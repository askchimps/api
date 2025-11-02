import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  private readonly REQUIRED_HEADER = 'x-api-key';
  private readonly EXPECTED_VALUE: string;

  constructor(private readonly configService: ConfigService) {
    // Try to get from environment variable, fallback to default
    this.EXPECTED_VALUE =
      this.configService.get<string>('API_SECRET_KEY') ||
      'askchimps-api-secret';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerValue = request.headers[this.REQUIRED_HEADER];

    if (!headerValue || headerValue !== this.EXPECTED_VALUE) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
