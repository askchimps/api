import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import pretty from 'pino-pretty';
import { PinoLoggerService } from './pinoLogger.service';

const stream = pretty({
  colorize: true,
  levelFirst: true,
  translateTime: 'SYS:standard',
  ignore: 'pid',
});

declare module 'http' {
  interface IncomingMessage {
    requestId: string;
  }
}

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: [
        {
          name: 'NHS API',
          level: 'trace',
          transport: {
            target: 'pino-pretty',
          },
          serializers: {
            req: (req) => {
              // Retain only the logging_id header
              const headers = {
                logging_id: req.headers.logging_id,
              };
              return {
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                headers,
                remoteAddress: req.remoteAddress,
                remotePort: req.remotePort,
              };
            },
            res: (res) => {
              // Redact all headers in the response
              res.headers = {};
              return res;
            },
          },
          useLevel: 'trace',
        },
        stream,
      ],
    }),
  ],
  providers: [PinoLoggerService],
  exports: [PinoLoggerService],
})
export class LoggerModule {}
