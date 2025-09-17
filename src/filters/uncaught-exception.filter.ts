import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  type LoggerService,
} from '@nestjs/common';

import { STATUS_CODES } from 'http';
import { FastifyReply } from 'fastify';

@Catch(InternalServerErrorException)
export class UncaughtErrorException implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();

    this.logger.error(exception.stack, UncaughtErrorException.name);
    const status = response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    response?.status(status).send({
      statusCode: status,
      message: STATUS_CODES[status],
    });
  }
}
