# Day 14: Microservices Production Readiness

## Overview
Enhanced the microservices architecture with production-ready features including timeouts, retries, correlation IDs, and idempotency handling.

## Features Implemented

### 1. Timeouts and Retry Strategy

#### Gateway-Level Timeouts
All microservice calls from the gateway now have configurable timeouts:
- Auth operations: 5 seconds
- Read operations (GET): 5-10 seconds
- Write operations (POST/PATCH/DELETE): 10 seconds

#### Exponential Backoff Retry
Implemented intelligent retry logic with:
- Configurable max attempts (1-3 based on operation)
- Exponential backoff (1s, 2s, 4s, etc.)
- Retryable error detection (ECONNREFUSED, ETIMEDOUT, 503, 504)
- Non-retryable errors fail immediately

```typescript
// Example usage
this.eventsClient
  .send({ cmd: 'events.create' }, data)
  .pipe(
    timeout(10000),
    retryWithBackoff({ maxAttempts: 1 })
  )
```

### 2. Correlation ID Propagation

#### Request Tracking
Every request gets a unique correlation ID that flows through all services:
- Generated at gateway if not provided
- Propagated to all downstream services
- Logged at each service boundary
- Returned in response headers

#### Benefits
- End-to-end request tracing
- Distributed debugging
- Performance analysis
- Error correlation

```
Client Request → Gateway [abc-123] → Auth Service [abc-123] → Database
                                   → Events Service [abc-123] → Database
```

### 3. Idempotency Handling

#### Idempotent Operations
State-changing operations support idempotency keys:
- Create event
- Submit event
- Approve event
- Reject event

#### Implementation
- Client sends `Idempotency-Key` header
- Service caches response for 24 hours
- Duplicate requests return cached response
- Prevents duplicate state changes

```bash
# First request - executes
curl -X POST http://localhost:3000/events/:id/submit \
  -H "Idempotency-Key: unique-key-123" \
  -H "Authorization: Bearer TOKEN"

# Second request - returns cached response
curl -X POST http://localhost:3000/events/:id/submit \
  -H "Idempotency-Key: unique-key-123" \
  -H "Authorization: Bearer TOKEN"
```

### 4. Enhanced Logging

#### Structured Logging
All services log with correlation IDs:
```
[abc-123] events.create - userId: user-456
[abc-123] events.submit - eventId: event-789, userId: user-456
[abc-123] POST /events completed
```

#### Log Correlation
Search logs across all services using correlation ID:
```bash
docker-compose logs | grep "abc-123"
```

## Architecture Changes

### Gateway Layer
```
┌─────────────────────────────────────┐
│         API Gateway                 │
│  - Correlation ID generation        │
│  - Timeout enforcement              │
│  - Retry with backoff               │
│  - Idempotency key forwarding       │
└─────────────────────────────────────┘
           ↓ (with correlation ID)
┌─────────────────────────────────────┐
│      Microservices                  │
│  - Correlation ID logging           │
│  - Idempotency checking             │
│  - Business logic execution         │
└─────────────────────────────────────┘
```

## Files Created/Modified

### New Files
- `api-gateway/src/common/interceptors/correlation-id.interceptor.ts`
- `api-gateway/src/common/interceptors/timeout.interceptor.ts`
- `api-gateway/src/common/utils/retry.util.ts`
- `events-service/src/common/services/idempotency.service.ts`

### Modified Files
- `api-gateway/src/main.ts` - Added correlation ID interceptor
- `api-gateway/src/auth/auth.controller.ts` - Added timeouts, retries, correlation IDs
- `api-gateway/src/events/events.controller.ts` - Added timeouts, retries, correlation IDs, idempotency
- `auth-service/src/auth/auth.controller.ts` - Added correlation ID logging
- `events-service/src/app.module.ts` - Added idempotency service
- `events-service/src/events/events.controller.ts` - Added correlation ID logging, idempotency

## Configuration

### Environment Variables
No new environment variables required. All features work with defaults.

### Timeout Configuration
Adjust timeouts in gateway controllers:
```typescript
.pipe(timeout(5000)) // 5 seconds
```

### Retry Configuration
Adjust retry behavior:
```typescript
retryWithBackoff({
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT']
})
```

### Idempotency TTL
Adjust cache TTL in `IdempotencyService`:
```typescript
private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours
```

## Testing

### Test Correlation IDs
```bash
# Send request with correlation ID
curl -X POST http://localhost:3000/auth/login \
  -H "X-Correlation-ID: test-123" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!"}'

# Check response headers
# X-Correlation-ID: test-123

# Check logs
docker-compose logs | grep "test-123"
```

### Test Idempotency
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@acme.com","password":"Password123!"}' \
  | jq -r '.accessToken')

# Create event
EVENT_ID=$(curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","startDate":"2026-06-01T10:00:00Z","endDate":"2026-06-01T16:00:00Z"}' \
  | jq -r '.id')

# Submit with idempotency key (first time)
curl -X POST http://localhost:3000/events/$EVENT_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: submit-123"

# Submit again with same key (returns cached response)
curl -X POST http://localhost:3000/events/$EVENT_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: submit-123"
```

### Test Timeouts
```bash
# Simulate slow service by stopping events-service
docker-compose stop events-service

# Try to list events (should timeout after 10s)
curl http://localhost:3000/events \
  -H "Authorization: Bearer $TOKEN"

# Response: 408 Request Timeout
```

### Test Retries
```bash
# Check logs for retry attempts
docker-compose logs api-gateway | grep "Retry"
```

## Production Considerations

### Timeouts
- Set based on p99 latency + buffer
- Different timeouts for read vs write
- Consider downstream dependencies

### Retries
- Only retry idempotent operations
- Limit max attempts to avoid cascading failures
- Use exponential backoff to reduce load
- Monitor retry rates

### Correlation IDs
- Use UUID v4 for uniqueness
- Include in all logs
- Forward to external services
- Store in error tracking systems

### Idempotency
- Use persistent cache (Redis) in production
- Set appropriate TTL based on business needs
- Handle cache failures gracefully
- Document idempotency guarantees

### Monitoring
- Track timeout rates
- Monitor retry success/failure rates
- Alert on high error rates
- Trace requests end-to-end

## Next Steps

1. Add distributed tracing (Jaeger/Zipkin)
2. Replace in-memory idempotency cache with Redis
3. Add circuit breakers
4. Implement rate limiting
5. Add health checks with dependencies
6. Set up centralized logging (ELK/Loki)
7. Add metrics (Prometheus)
8. Implement graceful shutdown

## Definition of Done

 Timeouts configured on all gateway calls
 Retry strategy with exponential backoff
 Correlation IDs propagated across services
 Idempotency handling for state-changing operations
 Structured logging with correlation IDs
 System runs reliably with one command
 Logs can correlate requests across services
 Documentation complete

## Resources

- [Microservices Patterns: Timeouts](https://microservices.io/patterns/reliability/timeout.html)
- [Idempotency in APIs](https://stripe.com/docs/api/idempotent_requests)
- [Distributed Tracing](https://opentelemetry.io/docs/concepts/observability-primer/#distributed-traces)
- [Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
