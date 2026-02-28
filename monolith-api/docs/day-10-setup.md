# Day 10 Setup: Cross-cutting NestJS Patterns

## Prerequisites
- App running from previous days
- Database seeded with test data

## What's New

### 1. Timing Interceptor
- Adds `X-Response-Time` header to all responses
- Measures request duration in milliseconds

### 2. Response Envelope (Optional)
- Wraps responses in consistent structure
- Disabled by default
- Enable with `ENABLE_ENVELOPE=true` in `.env`

### 3. Enhanced Validation Errors
- Structured error format
- Field-level constraint details
- Request ID included in errors

### 4. Query Parameter Pipe
- Validates query parameters
- Transforms types automatically
- Consistent error messages

## Setup Steps

### 1. No migration needed
All changes are code-only, no database changes.

### 2. Restart the app
```powershell
npm run start:dev
```

### 3. Test timing header
```powershell
curl -I http://localhost:3000/events
```

Look for `X-Response-Time` header in response.

### 4. Test validation errors
```powershell
curl -X POST http://localhost:3000/events `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{\"title\":\"\"}'
```

Should return structured validation errors:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "constraints": {
        "isNotEmpty": "title should not be empty"
      }
    }
  ]
}
```

### 5. (Optional) Enable response envelope
```powershell
# Add to .env
ENABLE_ENVELOPE=true
```

Restart app and test:
```powershell
curl http://localhost:3000/health
```

Response will be wrapped:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-28T15:30:00.000Z"
  },
  "timestamp": "2026-02-28T15:30:00.000Z",
  "path": "/health"
}
```

## Testing

Use `test/day-10.http` to test:

1. Timing headers on all endpoints
2. Validation error structure
3. Query parameter validation
4. Request ID in errors
5. Response envelope (if enabled)

## Key Files

### New Files
- `src/common/interceptors/timing.interceptor.ts`
- `src/common/interceptors/response-envelope.interceptor.ts`
- `src/common/pipes/parse-query.pipe.ts`
- `src/common/decorators/no-envelope.decorator.ts`
- `src/common/interceptors/index.ts`
- `src/common/pipes/index.ts`
- `src/common/decorators/index.ts`

### Modified Files
- `src/main.ts` - Added new interceptors
- `src/common/filters/http-exception.filter.ts` - Enhanced error mapping
- `src/config/app.config.ts` - Added envelope config
- `.env.example` - Added ENABLE_ENVELOPE

## Request Lifecycle

Understanding the order helps with debugging:

```
1. Middleware (RequestIdMiddleware)
2. Guards (JwtAuthGuard, RolesGuard)
3. Interceptors - Before (TimingInterceptor, LoggingInterceptor)
4. Pipes (ValidationPipe, ParseQueryPipe)
5. Controller Handler
6. Service Layer
7. Interceptors - After (ResponseEnvelopeInterceptor, LoggingInterceptor, TimingInterceptor)
8. Exception Filter (if error)
9. Response
```

See `docs/day-10.md` for detailed lifecycle diagram.

## Verification Checklist

✅ App starts without errors
✅ `X-Response-Time` header present in responses
✅ Validation errors are structured with field details
✅ Query parameter validation works
✅ Error responses include `success: false`
✅ Request ID appears in error responses
✅ Response envelope works when enabled
✅ All existing tests still pass

## Common Issues

### Issue: TypeScript errors in interceptors
**Solution**: Restart TypeScript server in VS Code (Ctrl+Shift+P → "TypeScript: Restart TS Server")

### Issue: Envelope not working
**Solution**: Check `ENABLE_ENVELOPE=true` in `.env` and restart app

### Issue: Validation errors not structured
**Solution**: Ensure `HttpExceptionFilter` is applied globally in `main.ts`

## Next Steps

Day 10 is complete! The app now has:
- Centralized cross-cutting concerns
- Consistent error and success responses
- Performance monitoring (timing header)
- Optional response envelope
- Enhanced validation error details
- Well-documented request lifecycle
