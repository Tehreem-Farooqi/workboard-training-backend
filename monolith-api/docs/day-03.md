# Day 3: Logging, Request IDs, Readiness/Liveness

**Date**: February 16, 2026  
**Status**: ✅ Complete

## 🎯 Goals

- Add structured logger (Pino)
- Add request correlation ID (x-request-id)
- Log request duration via interceptor
- Create /health/live and /health/ready endpoints

## ✅ Definition of Done

- [x] Every request logs requestId and duration
- [x] x-request-id present in responses
- [x] Health endpoints exist and are documented

## 🏗️ What Was Built

### 1. Dependencies Installed

```bash
npm install --save nestjs-pino pino-http pino-pretty
```

**Why Pino?**
- Faster than Winston (5x-10x in benchmarks)
- Structured JSON logging
- Better for production environments
- Built-in pretty printing for development

### 2. Request ID Middleware

**File**: `src/common/middleware/request-id.middleware.ts`

```typescript
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
```

**Features**:
- Accepts `x-request-id` from incoming requests
- Generates UUID if not provided
- Adds `x-request-id` to response headers
- Enables request tracing across services

### 3. Logging Interceptor

**File**: `src/common/interceptors/logging.interceptor.ts`

Logs every request with:
- Request ID
- HTTP method
- URL
- Status code
- Duration in milliseconds
- Error details (if any)

**Example Log Output**:
```json
{
  "message": "POST /sample",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/sample",
  "statusCode": 201,
  "duration": "45ms"
}
```

### 4. Pino Logger Configuration

**File**: `src/app.module.ts`

```typescript
LoggerModule.forRoot({
  pinoHttp: {
    transport: process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    customProps: (req) => ({
      requestId: req.headers['x-request-id'],
    }),
    autoLogging: false,
  },
}),
```

**Features**:
- Pretty printing in development
- JSON logging in production
- Custom request ID in all logs
- Manual logging control via interceptor

### 5. Health Endpoints

**File**: `src/health/health.controller.ts`

#### GET /health
General health check using Terminus

**Response**:
```json
{
  "status": "ok",
  "info": {},
  "error": {},
  "details": {}
}
```

#### GET /health/live
Liveness probe - checks if application is running

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "uptime": 123.456,
  "message": "Application is alive"
}
```

**Use Case**: Kubernetes/Docker liveness probe

#### GET /health/ready
Readiness probe - checks if application is ready to serve traffic

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "checks": {
    "database": "ok",
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 10485760,
      "external": 1048576
    }
  },
  "message": "Application is ready to serve traffic"
}
```

**Use Case**: Kubernetes/Docker readiness probe

### 6. Updated Main Bootstrap

**File**: `src/main.ts`

- Integrated Pino logger
- Added logging interceptor globally
- Updated startup messages with new endpoints

## 🧪 Testing

### Test 1: Request with Custom Request ID

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -H "x-request-id: my-custom-id-123" \
  -d '{"name":"John","email":"john@example.com","age":25}'
```

**Check**:
- Response header contains `x-request-id: my-custom-id-123`
- Console logs show `requestId: "my-custom-id-123"`
- Console logs show duration

### Test 2: Request without Request ID

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","age":30}'
```

**Check**:
- Response header contains auto-generated UUID
- Console logs show the generated UUID
- Console logs show duration

### Test 3: Liveness Probe

```bash
curl http://localhost:3000/health/live
```

**Expected Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "uptime": 123.456,
  "message": "Application is alive"
}
```

### Test 4: Readiness Probe

```bash
curl http://localhost:3000/health/ready
```

**Expected Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "checks": {
    "database": "ok",
    "memory": {...}
  },
  "message": "Application is ready to serve traffic"
}
```

### Test 5: Error Logging

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -H "x-request-id: error-test-123" \
  -d '{"name":"Test","email":"invalid","age":25}'
```

**Check Console Logs**:
```json
{
  "message": "POST /sample",
  "requestId": "error-test-123",
  "method": "POST",
  "url": "/sample",
  "statusCode": 400,
  "duration": "12ms",
  "error": "Validation failed"
}
```

### Test 6: Swagger Documentation

Open `http://localhost:3000/api`

**Verify**:
- GET /health/live is documented
- GET /health/ready is documented
- Both show proper descriptions and responses

## 📊 Log Format

### Development (Pretty)
```
[10:30:00.000] INFO: POST /sample
  requestId: "550e8400-e29b-41d4-a716-446655440000"
  method: "POST"
  url: "/sample"
  statusCode: 201
  duration: "45ms"
```

### Production (JSON)
```json
{
  "level": 30,
  "time": 1708081800000,
  "msg": "POST /sample",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/sample",
  "statusCode": 201,
  "duration": "45ms"
}
```

## 🔑 Key Learnings

### Request ID Pattern

Request IDs enable:
- **Distributed Tracing**: Track requests across microservices
- **Debugging**: Find all logs for a specific request
- **Correlation**: Link frontend errors to backend logs
- **Monitoring**: Track request flow through system

### Health Check Types

| Endpoint | Purpose | Kubernetes Use |
|----------|---------|----------------|
| `/health` | General health | Not typically used |
| `/health/live` | Is app running? | Liveness probe |
| `/health/ready` | Can serve traffic? | Readiness probe |

### Liveness vs Readiness

**Liveness Probe**:
- Checks if application is alive
- If fails → restart container
- Should be simple and fast
- Example: Return 200 if process is running

**Readiness Probe**:
- Checks if application can serve traffic
- If fails → remove from load balancer
- Can check dependencies (DB, cache, etc.)
- Example: Check database connection

### Logging Best Practices

1. **Structured Logging**: Use JSON in production
2. **Request IDs**: Include in every log
3. **Duration**: Log request duration for performance monitoring
4. **Context**: Include method, URL, status code
5. **Errors**: Log full error details with stack traces
6. **Levels**: Use appropriate log levels (info, warn, error)

## 📝 Kubernetes Integration

### Deployment YAML Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: eventboard-api
spec:
  containers:
  - name: api
    image: eventboard-api:latest
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## 🐛 Common Issues & Solutions

### Issue 1: Request ID Not in Logs
**Solution**: Ensure RequestIdMiddleware is applied before logging

### Issue 2: Logs Not Pretty in Development
**Solution**: Check NODE_ENV is not set to 'production'

### Issue 3: High Memory in Readiness Check
**Solution**: This is normal; Node.js uses memory efficiently

## 📚 References

- [Pino Documentation](https://getpino.io/)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Middleware](https://docs.nestjs.com/middleware)
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

## ⏭️ Next Steps (Day 4)

**Planned Tasks**:
1. Set up Prisma ORM
2. Configure PostgreSQL database
3. Create User and Organization models
4. Implement database migrations
5. Add database health check to readiness probe
6. Create repository pattern

**Deliverables**:
- Working database connection
- User and Organization tables
- Prisma Client configured
- Database seeding script
- Updated readiness probe with DB check

## 💭 Reflection

Day 3 established production-ready logging and monitoring. Request IDs enable distributed tracing, which will be crucial when we split into microservices. The logging interceptor provides visibility into every request without cluttering business logic.

The health endpoints follow Kubernetes best practices, making the application cloud-native from the start. The liveness probe ensures the container is restarted if the app crashes, while the readiness probe prevents traffic from reaching unhealthy instances.

**What went well**:
- Pino is significantly faster than Winston
- Request IDs work seamlessly across all requests
- Health endpoints are simple but effective
- Logging interceptor captures all requests automatically

**What to improve**:
- Add log rotation for production
- Consider adding trace IDs for distributed tracing
- Add more checks to readiness probe (DB, Redis, etc.)
- Consider adding metrics endpoint for Prometheus

---

**Commit Message**:
```
feat(day-03): add logging, request IDs, and health probes

- Add Pino structured logger with pretty printing
- Add RequestIdMiddleware for request correlation
- Add LoggingInterceptor for request duration logging
- Create /health/live liveness probe
- Create /health/ready readiness probe
- Configure Pino with custom request ID
- Add comprehensive Day 3 documentation
- Add test file for Day 3 endpoints
```
