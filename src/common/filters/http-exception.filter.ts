import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract message with proper typing
    const message = this.extractMessage(exceptionResponse);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
    };

    // Log the error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse.message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    // Handle object responses with proper type checking
    if (response && typeof response === 'object' && 'message' in response) {
      const messageValue = (response as { message: unknown }).message;
      return typeof messageValue === 'string'
        ? messageValue
        : JSON.stringify(response);
    }

    return JSON.stringify(response);
  }
}
