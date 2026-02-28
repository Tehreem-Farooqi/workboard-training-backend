import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  constraints: Record<string, string>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errors = responseObj.errors;

        // Enhanced validation error mapping
        if (exception instanceof BadRequestException && Array.isArray(message)) {
          // Transform class-validator errors into structured format
          errors = this.formatValidationErrors(message);
          message = 'Validation failed';
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
      ...(request.headers['x-request-id'] && {
        requestId: request.headers['x-request-id'],
      }),
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(messages: any[]): ValidationError[] {
    return messages.map((msg) => {
      if (typeof msg === 'string') {
        return { field: 'unknown', constraints: { error: msg } };
      }

      if (msg.property && msg.constraints) {
        return {
          field: msg.property,
          constraints: msg.constraints,
        };
      }

      // Handle nested validation errors
      if (msg.children && msg.children.length > 0) {
        return {
          field: msg.property,
          constraints: this.extractNestedConstraints(msg.children),
        };
      }

      return msg;
    });
  }

  private extractNestedConstraints(children: any[]): Record<string, string> {
    const constraints: Record<string, string> = {};
    children.forEach((child) => {
      if (child.constraints) {
        Object.assign(constraints, child.constraints);
      }
    });
    return constraints;
  }
}
