import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get request ID from header or generate new one
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Set request ID in request headers
    req.headers['x-request-id'] = requestId;

    // Set request ID in response headers
    res.setHeader('x-request-id', requestId);

    next();
  }
}
