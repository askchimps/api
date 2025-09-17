import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { UncaughtErrorException } from '@filters/uncaught-exception.filter';
import { ConfigService } from '@modules/common/config/config.service';
import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import { ResponseInterceptor } from '@interceptors/response.interceptor';

declare const module: any;

async function bootstrap() {
  const fastifyAdapter = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
    }),
    { bufferLogs: true },
  );

  const configService = fastifyAdapter.get(ConfigService);
  const port = configService.get('PORT', { infer: true }) || 4022;

  const logger = fastifyAdapter.get(PinoLoggerService);
  logger.setContext(bootstrap.name);

  // ==================================================
  // configureNestAPIVersioning
  // ==================================================
  fastifyAdapter.enableVersioning();

  // ==================================================
  // configureFastifySettings
  // ==================================================

  if (configService.IS_PRODUCTION) {
    // Initialize security middleware module 'fastify-helmet'
    fastifyAdapter.register(fastifyHelmet);
  }
  fastifyAdapter.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
  }); // Initialize fastify-compress to better handle high-level traffic
  fastifyAdapter.register(fastifyMultipart, {
    attachFieldsToBody: true,
  }); // Enable multipart data support
  fastifyAdapter.enableCors({ origin: true });

  // ==================================================
  // configureNestGlobals
  // ==================================================

  fastifyAdapter.useGlobalFilters(new UncaughtErrorException(logger));

  fastifyAdapter.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );

  fastifyAdapter.useGlobalInterceptors(new ResponseInterceptor());

  // ==================================================
  // configurePinoLogger
  // ==================================================

  fastifyAdapter.useLogger(logger);

  // ==================================================
  // configureHotReload
  // ==================================================

  await fastifyAdapter.listen(port, '0.0.0.0');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => fastifyAdapter.close());
  }

  logger.log(
    `Environment: ${configService.get('NODE_ENV', { infer: true })}`,
    `Server running on ${await fastifyAdapter.getUrl()}`,
  );
}

(async () => await bootstrap())();
