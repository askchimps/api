import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { UncaughtErrorException } from '@filters/uncaught-exception.filter';
import { GlobalExceptionFilter } from '@filters/global-exception.filter';
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

  // Configure multipart for file uploads
  fastifyAdapter.register(fastifyMultipart, {
    attachFieldsToBody: false, // Important: Keep this false for NestJS compatibility
    sharedSchemaId: 'MultipartFileSchema',
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000, // Max field value size in bytes  
      fields: 10, // Max number of non-file fields
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 10, // Max number of file fields
      headerPairs: 2000 // Max number of header key=>value pairs
    },
  }); // Enable multipart data support with proper limits

  // Add request logging middleware
  fastifyAdapter.register(async (fastify) => {
    fastify.addHook('onRequest', async (request, reply) => {
      logger.log(`=== INCOMING REQUEST ===`);
      logger.log(`${request.method} ${request.url}`);
      logger.log(`Headers: ${JSON.stringify(request.headers)}`);
      logger.log(`Content-Type: ${request.headers['content-type']}`);
      logger.log(`Content-Length: ${request.headers['content-length']}`);
      if (request.url.includes('/upload')) {
        logger.log(`=== UPLOAD REQUEST DETECTED ===`);
        logger.log(`Raw request available: ${!!request.raw}`);
      }
    });
  });

  fastifyAdapter.enableCors({ origin: true });

  // ==================================================
  // configureNestGlobals
  // ==================================================

  // Add global exception filter for better error logging
  fastifyAdapter.useGlobalFilters(new GlobalExceptionFilter());
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
  // configureStaticFiles
  // ==================================================

  // Serve uploaded files statically
  await fastifyAdapter.register(require('@fastify/static'), {
    root: require('path').join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
  });

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
