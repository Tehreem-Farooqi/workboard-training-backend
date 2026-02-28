# Day 10: Cross-cutting NestJS Patterns

## Overview
Implemented centralized cross-cutting concerns using NestJS patterns: timing interceptor, optional response envelope, query parameter parsing pipe, and enhanced validation error mapping.

## Features Implemented

### 1. Timing Interceptor
Measures request duration and adds `X-Response-Time` header to all responses.

**Location**: `src/common/interceptors/timing.interceptor.ts`

**Usage**: Applied globally in `main.ts`

**Example Response Header**:
```
X-Response-Time: 45ms
```

### 2. Response Envelope Interceptor (Optional)
Wraps successful responses in a consistent envelope structure.

**Location**: `src/common/interceptors/response-envelope.interceptor.ts`

**Configuration**: Set `ENABLE_ENVELOPE=true` in `.env` to enable

**Envelope Structure**:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-02-28T15:30:00.000Z",
  "path": "/events"
}
```

**Opt-out**: Use `@NoEnvelope()` decorator on specific endpoints

```typescript
@Get()
@NoEnvelope()
findAll() {
  return this.service.findAll();
}
```

### 3. Parse Query Pipe
Validates and transforms query parameters using class-validator.

**Location**: `src/common/pipes/parse-query.pipe.ts`

**Usage**: Apply to query parameter DTOs

```typescript
@Get()
findAll(@Query(ParseQueryPipe) query: QueryEventsDto) {
  return this.service.findAll(query);
}
```

**Benefits**:
- Automatic type transformation
- Validation with detailed error messages
- Consistent error format

### 4. Enhanced Exception Filter
Improved validation error mapping with structured error responses.

**Location**: `src/common/filters/http-exception.filter.ts`

**Features**:
- Structured validation errors
- Request ID in error responses
- Success flag for consistency
- Nested validation error support

**Error Response Format**:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-02-28T15:30:00.000Z",
  "path": "/events",
  "method": "POST",
  "message": "Validation failed",
  "requestId": "abc-123-def",
  "errors": [
    {
      "field": "title",
      "constraints": {
        "isNotEmpty": "title should not be empty",
        "minLength": "title must be longer than or equal to 3 characters"
      }
    }
  ]
}
```

## NestJS Request Lifecycle

Understanding the order of execution is critical for debugging and proper implementation.

### Request Flow (Incoming)

```
1. Middleware (RequestIdMiddleware)
   ↓
2. Guards (JwtAuthGuard, RolesGuard)
   ↓
3. Interceptors - Before (TimingInterceptor, LoggingInterceptor)
   ↓
4. Pipes (ValidationPipe, ParseQueryPipe)
   ↓
5. Controller Handler
   ↓
6. Service Layer
```

### Response Flow (Outgoing)

```
6. Service Layer
   ↓
7. Controller Handler
   ↓
8. Interceptors - After (ResponseEnvelopeInterceptor, LoggingInterceptor, TimingInterceptor)
   ↓
9. Exception Filter (if error occurred)
   ↓
10. Response sent to client
```

### Detailed Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Incoming Request                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. MIDDLEWARE (app.use)                                      │
│    - RequestIdMiddleware: Generate/extract x-request-id     │
│    - Runs for every request                                  │
│    - Can modify req/res objects                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GUARDS (@UseGuards)                                       │
│    - JwtAuthGuard: Validate JWT token                       │
│    - RolesGuard: Check user roles                           │
│    - Return true/false (allow/deny)                         │
│    - Can throw UnauthorizedException (401)                  │
│    - Can throw ForbiddenException (403)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. INTERCEPTORS - BEFORE (useGlobalInterceptors)            │
│    - TimingInterceptor: Start timer                         │
│    - LoggingInterceptor: Log request start                  │
│    - Can transform request                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PIPES (@Body, @Query, @Param)                            │
│    - ValidationPipe: Validate DTOs                          │
│    - ParseQueryPipe: Transform & validate query params      │
│    - Can throw BadRequestException (400)                    │
│    - Transform data types                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER HANDLER                                        │
│    - Execute controller method                               │
│    - Extract parameters (@Body, @Query, @Param, @User)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SERVICE LAYER                                             │
│    - Business logic                                          │
│    - Database operations                                     │
│    - Can throw any exception                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. INTERCEPTORS - AFTER (reverse order)                     │
│    - ResponseEnvelopeInterceptor: Wrap response             │
│    - LoggingInterceptor: Log response                       │
│    - TimingInterceptor: Calculate duration, add header      │
│    - Can transform response                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. EXCEPTION FILTER (if error occurred at any stage)        │
│    - HttpExceptionFilter: Format error response             │
│    - Catches all exceptions                                  │
│    - Returns consistent error format                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Response to Client                       │
└─────────────────────────────────────────────────────────────┘
```

## Execution Order in Our App

### Global Level (main.ts)
```typescript
1. ValidationPipe (global)
2. HttpExceptionFilter (global)
3. TimingInterceptor (global)
4. LoggingInterceptor (global)
5. ResponseEnvelopeInterceptor (global, optional)
```

### Controller Level
```typescript
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)  // Applied to all routes
export class EventsController {
  
  @Get()
  @Roles(UserRole.ADMIN)  // Additional role check
  findAll(@Query(ParseQueryPipe) query: QueryEventsDto) {
    // Handler
  }
}
```

### Execution Flow Example

For `GET /events?page=1&limit=10`:

```
1. RequestIdMiddleware → Generate x-request-id
2. JwtAuthGuard → Validate JWT token
3. RolesGuard → Check if user has required role
4. TimingInterceptor (before) → Start timer
5. LoggingInterceptor (before) → Log request
6. ParseQueryPipe → Validate & transform query params
7. ValidationPipe → Validate QueryEventsDto
8. EventsController.findAll() → Execute handler
9. EventsService.findAllPaginated() → Business logic
10. LoggingInterceptor (after) → Log response
11. TimingInterceptor (after) → Add X-Response-Time header
12. ResponseEnvelopeInterceptor (after) → Wrap response (if enabled)
13. Send response to client
```

## Best Practices

### 1. Middleware
- Use for request/response manipulation
- Keep it simple and fast
- Examples: logging, CORS, compression

### 2. Guards
- Use for authentication and authorization
- Should return boolean or throw exception
- Keep logic focused on access control

### 3. Interceptors
- Use for cross-cutting concerns
- Can transform request/response
- Examples: logging, caching, timing, response transformation

### 4. Pipes
- Use for validation and transformation
- Should transform or throw exception
- Examples: validation, type conversion, sanitization

### 5. Exception Filters
- Use for error handling
- Centralize error response format
- Log errors appropriately

## Configuration

### Enable Response Envelope
```bash
# .env
ENABLE_ENVELOPE=true
```

### Disable Envelope for Specific Endpoints
```typescript
@Get()
@NoEnvelope()
healthCheck() {
  return { status: 'ok' };
}
```

## Testing

### Test Timing Header
```bash
curl -I http://localhost:3000/events
# Look for: X-Response-Time: 45ms
```

### Test Validation Errors
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
# Returns structured validation errors
```

### Test Response Envelope
```bash
# Enable in .env: ENABLE_ENVELOPE=true
curl http://localhost:3000/events
# Response wrapped in envelope
```

## Performance Considerations

1. **Interceptor Order**: Place expensive operations last
2. **Pipe Validation**: Use `transform: true` for automatic type conversion
3. **Guard Caching**: Cache role checks when possible
4. **Middleware**: Keep middleware lightweight

## Common Patterns

### Pattern 1: Conditional Interceptor
```typescript
// Apply envelope only when enabled
if (enableEnvelope) {
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(reflector));
}
```

### Pattern 2: Decorator-based Opt-out
```typescript
// Skip envelope for specific endpoints
@NoEnvelope()
@Get()
findAll() { }
```

### Pattern 3: Structured Error Responses
```typescript
// Consistent error format across all endpoints
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [...]
}
```

## Definition of Done

 Timing interceptor adds X-Response-Time header
 Response envelope is optional and configurable
 Query parameter pipe validates and transforms
 Validation errors are structured and detailed
 Error responses include request ID
 All cross-cutting logic is centralized
 Request lifecycle is documented
 Execution order is clear and predictable
