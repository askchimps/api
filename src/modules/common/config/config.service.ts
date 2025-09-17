import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import ConfigDto from './dto';

@Injectable()
export class ConfigService extends NestConfigService<ConfigDto> {
  constructor() {
    super();
  }

  get IS_PRODUCTION(): boolean {
    return this.get('NODE_ENV', { infer: true }) === 'production';
  }
}
