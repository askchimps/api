import { Global, Module } from '@nestjs/common';
import Axios from 'axios';

import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { HttpService } from './http.service';

export const AXIOS_INSTANCE_TOKEN = 'AXIOS_INSTANCE_TOKEN';

@Global()
@Module({
  imports: [NestHttpModule],
  providers: [
    HttpService,
    {
      provide: AXIOS_INSTANCE_TOKEN,
      useValue: Axios,
    },
  ],
  exports: [HttpService],
})
export class HttpModule extends NestHttpModule {
  // @TODO : Add interceptors to log request and response of all http requests
}
