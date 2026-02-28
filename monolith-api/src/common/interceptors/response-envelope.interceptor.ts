import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const NO_ENVELOPE_KEY = 'noEnvelope';

export interface EnvelopedResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const noEnvelope = this.reflector.getAllAndOverride<boolean>(
      NO_ENVELOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (noEnvelope) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path,
      })),
    );
  }
}
