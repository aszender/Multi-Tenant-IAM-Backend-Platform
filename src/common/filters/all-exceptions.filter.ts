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

function extractHttpExceptionMessage(responseBody: unknown, fallback: string): string {
  if (typeof responseBody === 'string') {
    return responseBody;
  }

  if (typeof responseBody === 'object' && responseBody !== null) {
    const maybe = responseBody as Record<string, unknown>;
    const message = maybe.message;

    if (Array.isArray(message)) {
      return message.map((m) => String(m)).join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function extractHttpExceptionError(responseBody: unknown, fallback: string): string {
  if (typeof responseBody === 'object' && responseBody !== null) {
    const maybe = responseBody as Record<string, unknown>;
    const error = maybe.error;
    if (typeof error === 'string') {
      return error;
    }
  }
  return fallback;
}

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

      const message = extractHttpExceptionMessage(responseBody, exception.message);
      const error = extractHttpExceptionError(responseBody, exception.name);

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
