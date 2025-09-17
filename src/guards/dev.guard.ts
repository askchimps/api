import { ConfigService } from '@modules/common/config/config.service';
import { Injectable, CanActivate } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DevGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(): boolean | Promise<boolean> | Observable<boolean> {
    return !this.configService.IS_PRODUCTION;
  }
}
