import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || response.error || message;
        error = response.error || error;
        details = response.details || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    console.error(`[${requestId}] ${status} ${request.method} ${request.url}`, {
      error: exception,
      stack: exception instanceof Error ? exception.stack : undefined,
      requestId,
      timestamp: new Date().toISOString(),
    });

    // Send response
    response.status(status).json({
      success: false,
      error: {
        code: error,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        path: request.url,
      },
    });
  }
}