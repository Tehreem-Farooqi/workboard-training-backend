# Day 3 Setup Instructions

## Step 1: Install Dependencies

Run this command in the `monolith-api` directory:

```bash
npm install --save nestjs-pino pino-http pino-pretty
```

## Step 2: Start the Application

```bash
npm run start:dev
```

Wait for the message:
```
🚀 EventBoard API is running on: http://localhost:3000
📋 Health check: http://localhost:3000/health
📋 Liveness: http://localhost:3000/health/live
📋 Readiness: http://localhost:3000/health/ready
📚 Swagger docs: http://localhost:3000/api
```

## Step 3: Test the Implementation

### Option A: Using Browser

1. **Liveness Probe**: Open `http://localhost:3000/health/live`
   - Should return status, timestamp, uptime

2. **Readiness Probe**: Open `http://localhost:3000/health/ready`
   - Should return status, checks, memory info

3. **Swagger UI**: Open `http://localhost:3000/api`
   - Verify /health/live and /health/ready are documented

### Option B: Using curl (Command Line)

#### Test 1: Request with Custom Request ID
```bash
curl -v -X POST http://localhost:3000/sample -H "Content-Type: application/json" -H "x-request-id: my-test-id-123" -d "{\"name\":\"John\",\"email\":\"john@example.com\",\"age\":25}"
```

**Check**:
- Response headers contain `x-request-id: my-test-id-123`
- Console shows log with requestId and duration

#### Test 2: Request without Request ID (auto-generated)
```bash
curl -v http://localhost:3000
```

**Check**:
- Response headers contain auto-generated UUID
- Console shows log with generated requestId

#### Test 3: Liveness Probe
```bash
curl http://localhost:3000/health/live
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T...",
  "uptime": 123.456,
  "message": "Application is alive"
}
```

#### Test 4: Readiness Probe
```bash
curl http://localhost:3000/health/ready
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T...",
  "checks": {
    "database": "ok",
    "memory": {...}
  },
  "message": "Application is ready to serve traffic"
}
```

### Option C: Using test-day-03.http File

If you have REST Client extension in VS Code:
1. Open `test-day-03.http`
2. Click "Send Request" above each test
3. Check response headers for `x-request-id`

## Step 4: Verify Console Logs

Watch the console output. You should see structured logs like:

```
[10:30:00.000] INFO: POST /sample
  requestId: "550e8400-e29b-41d4-a716-446655440000"
  method: "POST"
  url: "/sample"
  statusCode: 201
  duration: "45ms"
```

## Step 5: Verify Definition of Done

- [ ] Every request logs requestId and duration (check console)
- [ ] x-request-id present in response headers (use curl -v or browser dev tools)
- [ ] /health/live endpoint exists and returns proper response
- [ ] /health/ready endpoint exists and returns proper response
- [ ] Health endpoints are documented in Swagger

## What Was Implemented

### Files Created:
- `src/common/middleware/request-id.middleware.ts` - Request ID middleware
- `src/common/interceptors/logging.interceptor.ts` - Logging interceptor
- `src/common/middleware/index.ts` - Middleware barrel export
- `src/common/interceptors/index.ts` - Interceptor barrel export
- `docs/day-03.md` - Day 3 documentation
- `test-day-03.http` - HTTP test file

### Files Modified:
- `src/main.ts` - Added Pino logger and logging interceptor
- `src/app.module.ts` - Added LoggerModule and RequestIdMiddleware
- `src/health/health.controller.ts` - Added /live and /ready endpoints
- `README.md` - Updated roadmap

### Features:
1. ✅ Pino structured logger with pretty printing
2. ✅ Request ID middleware (accepts or generates UUID)
3. ✅ Logging interceptor (logs every request with duration)
4. ✅ Liveness probe at /health/live
5. ✅ Readiness probe at /health/ready
6. ✅ x-request-id in all response headers
7. ✅ Swagger documentation for health endpoints

## How It Works

### Request Flow:
1. Request arrives → RequestIdMiddleware adds/generates x-request-id
2. Request processed → LoggingInterceptor starts timer
3. Response sent → LoggingInterceptor logs duration and details
4. Response includes x-request-id header

### Log Structure:
```json
{
  "message": "POST /sample",
  "requestId": "uuid-here",
  "method": "POST",
  "url": "/sample",
  "statusCode": 201,
  "duration": "45ms"
}
```

## Troubleshooting

### Issue: "Cannot find module 'nestjs-pino'"
**Solution**: Run `npm install --save nestjs-pino pino-http pino-pretty`

### Issue: Logs not showing in console
**Solution**: 
- Check LoggingInterceptor is registered in main.ts
- Verify RequestIdMiddleware is applied in app.module.ts

### Issue: x-request-id not in response headers
**Solution**: 
- Ensure RequestIdMiddleware is applied to all routes
- Check middleware is configured in app.module.ts

### Issue: Logs not pretty formatted
**Solution**: 
- Ensure NODE_ENV is not set to 'production'
- Check pino-pretty is installed

## Next Steps

After verifying Day 3 is complete, you can proceed to Day 4:
- Prisma ORM setup
- PostgreSQL database configuration
- Database migrations
- User and Organization models
- Update readiness probe with database check
