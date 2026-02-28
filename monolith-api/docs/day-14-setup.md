# Day 14 Setup: Production Readiness

## Prerequisites
- Day 13 microservices completed
- Docker Desktop running
- Services can start successfully

## Step-by-Step Implementation

### Step 1: Add Correlation ID Interceptor

Create `api-gateway/src/common/interceptors/correlation-id.interceptor.ts`:
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const correlationId =
      request.headers['x-correlation-id'] || randomUUID();

    request.correlationId = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle().pipe(
      tap(() => {
        console.log(
          `[${correlationId}] ${request.method} ${request.url} completed`,
        );
      }),
    );
  }
}
```

### Step 2: Add Retry Utility

Create `api-gateway/src/common/utils/retry.util.ts`:
```typescript
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';

export interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export function retryWithBackoff(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  } = config;

  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const attempt = index + 1;

            const isRetryable =
              retryableErrors.some((code) => error.code === code) ||
              error.status === 503 ||
              error.status === 504;

            if (attempt >= maxAttempts || !isRetryable) {
              console.error(
                `[Retry] Max attempts (${maxAttempts}) reached`,
                error,
              );
              return throwError(() => error);
            }

            const delay = delayMs * Math.pow(backoffMultiplier, index);
            console.log(
              `[Retry] Attempt ${attempt}/${maxAttempts} - retrying in ${delay}ms`,
            );

            return timer(delay);
          }),
        ),
      ),
    );
}
```

### Step 3: Add Idempotency Service

Create `events-service/src/common/services/idempotency.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';

interface IdempotencyRecord {
  key: string;
  response: any;
  timestamp: number;
}

@Injectable()
export class IdempotencyService {
  private readonly cache = new Map<string, IdempotencyRecord>();
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  async checkAndStore(
    key: string | undefined,
    operation: () => Promise<any>,
  ): Promise<any> {
    if (!key) {
      return operation();
    }

    const existing = this.cache.get(key);
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.ttlMs) {
        console.log(`[Idempotency] Returning cached response for key: ${key}`);
        return existing.response;
      } else {
        this.cache.delete(key);
      }
    }

    const response = await operation();

    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
    });

    this.cleanupExpired();

    return response;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now - record.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### Step 4: Update Gateway Main

Update `api-gateway/src/main.ts`:
```typescript
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Add correlation ID interceptor
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  // ... rest of setup
}
```

### Step 5: Update Gateway Controllers

Update `api-gateway/src/auth/auth.controller.ts`:
```typescript
import { timeout } from 'rxjs/operators';
import { retryWithBackoff } from '../common/utils/retry.util';

@Post('login')
async login(@Body() loginDto: any, @Req() req: any) {
  return firstValueFrom(
    this.authClient
      .send(
        { cmd: 'auth.login' },
        { ...loginDto, correlationId: req.correlationId },
      )
      .pipe(timeout(5000), retryWithBackoff({ maxAttempts: 2 })),
  );
}
```

Update `api-gateway/src/events/events.controller.ts`:
```typescript
import { Headers, Req } from '@nestjs/common';
import { timeout } from 'rxjs/operators';
import { retryWithBackoff } from '../common/utils/retry.util';

@Post()
async create(
  @Body() createEventDto: any,
  @CurrentUser() user: any,
  @Req() req: any,
  @Headers('idempotency-key') idempotencyKey?: string,
) {
  return firstValueFrom(
    this.eventsClient
      .send(
        { cmd: 'events.create' },
        {
          dto: createEventDto,
          userId: user.id,
          organizationId: user.organizationId,
          correlationId: req.correlationId,
          idempotencyKey,
        },
      )
      .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
  );
}
```

### Step 6: Update Service Controllers

Update `auth-service/src/auth/auth.controller.ts`:
```typescript
import { Payload } from '@nestjs/microservices';

@MessagePattern({ cmd: 'auth.login' })
async login(@Payload() data: any) {
  const { correlationId, ...loginDto } = data;
  console.log(`[${correlationId || 'N/A'}] auth.login - email: ${loginDto.email}`);
  return this.authService.login(loginDto);
}
```

Update `events-service/src/app.module.ts`:
```typescript
import { IdempotencyService } from './common/services/idempotency.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, PrismaService, IdempotencyService],
})
export class AppModule {}
```

Update `events-service/src/events/events.controller.ts`:
```typescript
import { Payload } from '@nestjs/microservices';
import { IdempotencyService } from '../common/services/idempotency.service';

constructor(
  private readonly eventsService: EventsService,
  private readonly idempotencyService: IdempotencyService,
) {}

@MessagePattern({ cmd: 'events.submit' })
async submit(@Payload() data: any) {
  const { correlationId, idempotencyKey } = data;
  console.log(`[${correlationId || 'N/A'}] events.submit - eventId: ${data.id}`);

  return this.idempotencyService.checkAndStore(idempotencyKey, async () => {
    return this.eventsService.submit(data.id, data.organizationId, data.userId);
  });
}
```

## Testing

### Test Correlation IDs
```powershell
# Send request with correlation ID
curl -X POST http://localhost:3000/auth/login `
  -H "X-Correlation-ID: test-123" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@acme.com\",\"password\":\"Password123!\"}'

# Check logs
docker-compose -f docker-compose.microservices.yml logs | Select-String "test-123"
```

### Test Idempotency
```powershell
# Login
$response = curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@acme.com\",\"password\":\"Password123!\"}' | ConvertFrom-Json

$token = $response.accessToken

# Create event
$event = curl -X POST http://localhost:3000/events `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Test\",\"description\":\"Test\",\"startDate\":\"2026-06-01T10:00:00Z\",\"endDate\":\"2026-06-01T16:00:00Z\"}' | ConvertFrom-Json

# Submit with idempotency key (first time)
curl -X POST "http://localhost:3000/events/$($event.id)/submit" `
  -H "Authorization: Bearer $token" `
  -H "Idempotency-Key: submit-123"

# Submit again (returns cached response)
curl -X POST "http://localhost:3000/events/$($event.id)/submit" `
  -H "Authorization: Bearer $token" `
  -H "Idempotency-Key: submit-123"
```

### Test Timeouts
```powershell
# Stop events service
docker-compose -f docker-compose.microservices.yml stop events-service

# Try to list events (should timeout)
curl http://localhost:3000/events `
  -H "Authorization: Bearer $token"

# Restart service
docker-compose -f docker-compose.microservices.yml start events-service
```

## Verification

✅ Correlation IDs in response headers
✅ Correlation IDs in all service logs
✅ Idempotency prevents duplicate operations
✅ Timeouts prevent hanging requests
✅ Retries handle transient failures
✅ System runs with one command
✅ Logs are searchable by correlation ID

## Next Steps

1. Add distributed tracing (Jaeger)
2. Replace in-memory cache with Redis
3. Add circuit breakers
4. Add health checks with dependencies
5. Set up centralized logging
6. Add metrics collection

Day 14 complete! System is production-ready.
