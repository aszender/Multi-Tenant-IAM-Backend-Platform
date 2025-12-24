import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.originalUrl ?? request.url;

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      const message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as any)?.message
            ? Array.isArray((responseBody as any).message)
              ? (responseBody as any).message.join('; ')
              : String((responseBody as any).message)
            : exception.message;

      const error =
        typeof responseBody === 'object' && (responseBody as any)?.error
          ? String((responseBody as any).error)
          : exception.name;

      const body: ErrorResponseBody = {
        statusCode,
        error,
        message,
        path,
        timestamp,
      };

      response.status(statusCode).json(body);
      return;
    }

    const body: ErrorResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred.',
      path,
      timestamp,
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
