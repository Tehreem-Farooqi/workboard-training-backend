# NestJS Request Lifecycle Reference

## Quick Reference

```
Request → Middleware → Guards → Interceptors(before) → Pipes → Handler → Service
                                                                            ↓
Response ← Exception Filter ← Interceptors(after) ←─────────────────────────┘
```

## Detailed Flow

### 1. Middleware
- **When**: First thing to run
- **Purpose**: Request/response manipulation
- **Can**: Modify req/res, call next(), end request
- **Examples**: CORS, logging, compression, request ID
- **Our Implementation**: `RequestIdMiddleware`

```typescript
// Runs for every request
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuid();
    next();
  }
}
```

### 2. Guards
- **When**: After middleware, before interceptors
- **Purpose**: Authentication and authorization
- **Can**: Return true/false, throw exceptions
- **Examples**: JWT validation, role checks, rate limiting
- **Our Implementation**: `JwtAuthGuard`, `RolesGuard`

```typescript
// Determines if request can proceed
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Return true to allow, false to deny (401)
    // Throw ForbiddenException for 403
  }
}
```

**Execution Order**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)  // Left to right
```

### 3. Interceptors (Before)
- **When**: After guards, before pipes
- **Purpose**: Transform request, add logic before handler
- **Can**: Transform request, bind extra logic, override handler
- **Examples**: Logging, caching, timing start
- **Our Implementation**: `TimingInterceptor`, `LoggingInterceptor`

```typescript
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        // Add timing header
      })
    );
  }
}
```

**Execution Order**:
```typescript
app.useGlobalInterceptors(
  new TimingInterceptor(),      // 1st before, 3rd after
  new LoggingInterceptor(),     // 2nd before, 2nd after
  new EnvelopeInterceptor(),    // 3rd before, 1st after
);
```

### 4. Pipes
- **When**: After interceptors, before handler
- **Purpose**: Validation and transformation
- **Can**: Transform value, throw exceptions
- **Examples**: Validation, type conversion, sanitization
- **Our Implementation**: `ValidationPipe`, `ParseQueryPipe`

```typescript
@Get()
findAll(
  @Query(ParseQueryPipe) query: QueryDto,  // Pipe applied here
  @Body(ValidationPipe) body: CreateDto,   // And here
) { }
```

**Execution Order**:
```typescript
// Global pipes run first
app.useGlobalPipes(new ValidationPipe());

// Then parameter-level pipes
@Query(ParseQueryPipe) query: QueryDto
```

### 5. Controller Handler
- **When**: After pipes
- **Purpose**: Route handling
- **Can**: Call services, return data, throw exceptions

```typescript
@Get()
async findAll(@Query() query: QueryDto) {
  return this.service.findAll(query);
}
```

### 6. Service Layer
- **When**: Called by controller
- **Purpose**: Business logic
- **Can**: Database operations, external calls, throw exceptions

```typescript
@Injectable()
export class EventsService {
  async findAll(query: QueryDto) {
    return this.prisma.event.findMany();
  }
}
```

### 7. Interceptors (After)
- **When**: After handler returns, before response
- **Purpose**: Transform response, add logic after handler
- **Can**: Transform response, add headers, wrap data
- **Examples**: Response envelope, logging, timing end
- **Our Implementation**: `ResponseEnvelopeInterceptor`

```typescript
return next.handle().pipe(
  map(data => ({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }))
);
```

**Execution Order**: Reverse of "before" phase
```
Before: Timing → Logging → Envelope
After:  Envelope → Logging → Timing
```

### 8. Exception Filter
- **When**: If any exception is thrown
- **Purpose**: Error handling
- **Can**: Format error response, log errors
- **Examples**: HTTP exception handling, validation errors
- **Our Implementation**: `HttpExceptionFilter`

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Format and return error response
  }
}
```

## Complete Example

### Request: `POST /events`

```
1. RequestIdMiddleware
   - Generate x-request-id: "abc-123"
   
2. JwtAuthGuard
   - Validate JWT token
   - Extract user from token
   - Attach user to request
   
3. RolesGuard
   - Check if user has required role
   - Allow if role matches
   
4. TimingInterceptor (before)
   - Start timer: startTime = Date.now()
   
5. LoggingInterceptor (before)
   - Log: "POST /events started"
   
6. ValidationPipe
   - Validate CreateEventDto
   - Transform dates to Date objects
   - Throw BadRequestException if invalid
   
7. EventsController.create()
   - Extract @Body() createEventDto
   - Extract @CurrentUser() user
   - Call service
   
8. EventsService.create()
   - Validate business rules
   - Save to database
   - Return event
   
9. LoggingInterceptor (after)
   - Log: "POST /events completed"
   
10. TimingInterceptor (after)
    - Calculate duration: Date.now() - startTime
    - Add header: X-Response-Time: 45ms
    
11. ResponseEnvelopeInterceptor (after) [if enabled]
    - Wrap response in envelope
    
12. Send response to client
```

### If Error Occurs at Step 6 (Validation)

```
6. ValidationPipe
   - Validation fails
   - Throw BadRequestException
   
→ Skip steps 7-11
   
12. HttpExceptionFilter
    - Catch BadRequestException
    - Format error response
    - Return 400 with structured errors
    
13. Send error response to client
```

## Comparison Table

| Component | Runs On | Can Modify Request | Can Modify Response | Can Stop Request | Async |
|-----------|---------|-------------------|---------------------|------------------|-------|
| Middleware | Every request | ✅ | ✅ | ✅ | ✅ |
| Guard | Per route | ❌ | ❌ | ✅ | ✅ |
| Interceptor | Per route | ✅ | ✅ | ✅ | ✅ |
| Pipe | Per parameter | ✅ (transform) | ❌ | ✅ (throw) | ✅ |
| Filter | On exception | ❌ | ✅ | N/A | ❌ |

## When to Use What

### Use Middleware When:
- Need to run on every request
- Need to modify req/res objects
- Need to run before routing
- Examples: CORS, compression, request ID

### Use Guards When:
- Need authentication
- Need authorization
- Need to allow/deny access
- Examples: JWT validation, role checks

### Use Interceptors When:
- Need to transform request/response
- Need to add cross-cutting logic
- Need to measure performance
- Examples: logging, caching, timing, response envelope

### Use Pipes When:
- Need to validate input
- Need to transform input types
- Need to sanitize data
- Examples: validation, type conversion, parsing

### Use Filters When:
- Need to handle exceptions
- Need to format error responses
- Need to log errors
- Examples: HTTP exception handling, validation errors

## Common Patterns

### Pattern 1: Optional Interceptor
```typescript
if (config.enableFeature) {
  app.useGlobalInterceptors(new FeatureInterceptor());
}
```

### Pattern 2: Decorator-based Opt-out
```typescript
@NoEnvelope()
@Get()
findAll() { }
```

### Pattern 3: Conditional Guard
```typescript
@Public()  // Skip authentication
@Get()
publicEndpoint() { }
```

### Pattern 4: Multiple Guards
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Get()
protectedEndpoint() { }
```

## Debugging Tips

### 1. Add Logging
```typescript
console.log('Guard: Checking authentication');
console.log('Pipe: Validating input');
console.log('Interceptor: Transforming response');
```

### 2. Check Execution Order
```typescript
// Add timestamps to see order
const timestamp = Date.now();
console.log(`[${timestamp}] Guard executed`);
```

### 3. Inspect Context
```typescript
const request = context.switchToHttp().getRequest();
console.log('Method:', request.method);
console.log('URL:', request.url);
console.log('Headers:', request.headers);
```

### 4. Test Each Layer
```typescript
// Test guard in isolation
const guard = new JwtAuthGuard();
const result = await guard.canActivate(mockContext);

// Test pipe in isolation
const pipe = new ValidationPipe();
const result = await pipe.transform(mockValue, mockMetadata);
```

## Performance Considerations

1. **Middleware**: Keep lightweight, runs on every request
2. **Guards**: Cache expensive checks (e.g., role lookups)
3. **Interceptors**: Avoid heavy computation in "before" phase
4. **Pipes**: Use `transform: true` for automatic type conversion
5. **Filters**: Log errors asynchronously

## Our Implementation Summary

```typescript
// main.ts
app.use(RequestIdMiddleware);                    // 1. Middleware
app.useGlobalFilters(new HttpExceptionFilter()); // 8. Filter
app.useGlobalPipes(new ValidationPipe());        // 4. Pipe
app.useGlobalInterceptors(
  new TimingInterceptor(),                       // 3. Interceptor
  new LoggingInterceptor(),                      // 3. Interceptor
  new ResponseEnvelopeInterceptor(),             // 7. Interceptor
);

// Controller
@UseGuards(JwtAuthGuard, RolesGuard)             // 2. Guards
@Controller('events')
export class EventsController { }
```

This creates a robust, maintainable request pipeline with proper separation of concerns.
