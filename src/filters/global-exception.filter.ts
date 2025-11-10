import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // Log the error with detailed information
    this.logger.error(
      `HTTP ${status} Error on ${request.method} ${request.url}`,
      {
        error: exception.message,
        stack: exception.stack,
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }
    );

    // Special handling for file upload errors
    if (request.url?.includes('/upload')) {
      this.logger.error('=== UPLOAD ERROR DETAILS ===');
      this.logger.error(`Upload endpoint: ${request.method} ${request.url}`);
      this.logger.error(`Content-Type: ${request.headers['content-type']}`);
      this.logger.error(`Content-Length: ${request.headers['content-length']}`);
      this.logger.error(`Request raw: ${request.raw}`);
      this.logger.error(`Exception: ${exception.constructor.name}`);
      this.logger.error(`Exception message: ${exception.message}`);
      this.logger.error(`Exception stack: ${exception.stack}`);
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).send(errorResponse);
  }
}