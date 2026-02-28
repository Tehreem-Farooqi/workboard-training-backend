# Day 2: DTOs, Validation, and Consistent Errors

**Date**: February 16, 2026  
**Status**:  Complete

##  Goals

- Add global ValidationPipe with transform and whitelist
- Add global exception filter with consistent error response
- Add Swagger base configuration
- Add sample endpoint to verify validation

##  Definition of Done

- [x] Invalid payload returns 400 with details
- [x] Unknown fields are rejected (forbidNonWhitelisted)
- [x] Error shape matches documented format
- [x] Swagger loads and shows at least one route

##  What Was Built

### 1. Dependencies Installed

```bash
npm install --save @nestjs/swagger
```

**Note**: `class-validator` and `class-transformer` were already installed on Day 1.

### 2. Global Exception Filter

**File**: `src/common/filters/http-exception.filter.ts`

Created a consistent error response format:

```json
{
  "statusCode": 400,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/sample",
  "method": "POST",
  "message": ["name should not be empty", "email must be an email"],
  "errors": {...}
}
```

**Features**:
- Catches all exceptions (HTTP and unexpected)
- Provides consistent error structure
- Includes timestamp, path, and method
- Handles validation errors from class-validator

### 3. Global Validation Pipe

**File**: `src/main.ts`

Enhanced with:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject unknown properties
    transform: true,            // Auto-transform payloads to DTO instances
  }),
);
```

**Behavior**:
- `whitelist: true` - Removes properties not in DTO
- `forbidNonWhitelisted: true` - Returns 400 if unknown properties sent
- `transform: true` - Converts plain objects to DTO class instances

### 4. Swagger Configuration

**File**: `src/main.ts`

```typescript
const config = new DocumentBuilder()
  .setTitle('EventBoard Monolith API')
  .setDescription('A production-ready NestJS backend for managing events')
  .setVersion('0.0.1')
  .addTag('app', 'Application endpoints')
  .addTag('health', 'Health check endpoints')
  .build();

SwaggerModule.setup('api', app, document);
```

**Access**: `http://localhost:3000/api`

### 5. Sample DTO with Validation

**File**: `src/common/dto/create-sample.dto.ts`

```typescript
export class CreateSampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @Min(1)
  @Max(120)
  age: number;
}
```

**Validation Rules**:
- `name`: Required string
- `email`: Required valid email format
- `age`: Integer between 1 and 120

### 6. Sample Endpoint

**File**: `src/app.controller.ts`

```typescript
@Post('sample')
@ApiOperation({ summary: 'Test validation with sample endpoint' })
createSample(@Body() createSampleDto: CreateSampleDto) {
  return {
    success: true,
    message: 'Validation passed',
    data: createSampleDto,
  };
}
```

**Endpoint**: `POST /sample`

### 7. Swagger Decorators

Added Swagger decorators to all endpoints:
- `@ApiTags()` - Groups endpoints
- `@ApiOperation()` - Describes operation
- `@ApiResponse()` - Documents responses
- `@ApiProperty()` - Documents DTO properties

##  Testing

### Test 1: Valid Payload 

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Validation passed",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25
  }
}
```

### Test 2: Invalid Email ❌

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "invalid-email",
    "age": 25
  }'
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/sample",
  "method": "POST",
  "message": ["email must be an email"]
}
```

### Test 3: Missing Required Fields ❌

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25
  }'
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/sample",
  "method": "POST",
  "message": [
    "name should not be empty",
    "name must be a string",
    "email should not be empty",
    "email must be an email"
  ]
}
```

### Test 4: Unknown Fields (forbidNonWhitelisted) ❌

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "unknownField": "should be rejected"
  }'
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/sample",
  "method": "POST",
  "message": ["property unknownField should not exist"]
}
```

### Test 5: Invalid Age Range ❌

```bash
curl -X POST http://localhost:3000/sample \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 150
  }'
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/sample",
  "method": "POST",
  "message": ["age must not be greater than 120"]
}
```

### Test 6: Swagger UI 

Open browser: `http://localhost:3000/api`

**Expected**:
- Swagger UI loads
- Shows "EventBoard Monolith API" title
- Shows version 0.0.1
- Lists endpoints grouped by tags (app, health)
- Shows POST /sample with request/response schemas

##  Error Response Format

All errors follow this consistent structure:

```typescript
{
  statusCode: number;        // HTTP status code
  timestamp: string;         // ISO 8601 timestamp
  path: string;              // Request path
  method: string;            // HTTP method
  message: string | string[]; // Error message(s)
  errors?: any;              // Optional additional error details
}
```

## � Key Learnings

### ValidationPipe Options

| Option | Effect |
|--------|--------|
| `whitelist: true` | Strips properties not in DTO |
| `forbidNonWhitelisted: true` | Throws error if unknown properties |
| `transform: true` | Converts plain objects to DTO instances |

### class-validator Decorators

| Decorator | Purpose |
|-----------|---------|
| `@IsString()` | Must be string |
| `@IsEmail()` | Must be valid email |
| `@IsInt()` | Must be integer |
| `@IsNotEmpty()` | Cannot be empty |
| `@Min(n)` | Minimum value |
| `@Max(n)` | Maximum value |

### Swagger Decorators

| Decorator | Purpose |
|-----------|---------|
| `@ApiTags()` | Group endpoints |
| `@ApiOperation()` | Describe operation |
| `@ApiResponse()` | Document responses |
| `@ApiProperty()` | Document DTO properties |

##  Best Practices Applied

1. **Consistent Error Format**: All errors follow the same structure
2. **Fail Fast**: Validation happens before business logic
3. **Clear Messages**: Validation errors are descriptive
4. **API Documentation**: Swagger auto-generates from decorators
5. **Type Safety**: DTOs provide compile-time type checking
6. **Security**: Unknown fields are rejected to prevent injection

##  Common Validation Patterns

### Email Validation
```typescript
@IsEmail()
@IsNotEmpty()
email: string;
```

### Number Range
```typescript
@IsInt()
@Min(1)
@Max(100)
score: number;
```

### Optional Field
```typescript
@IsString()
@IsOptional()
middleName?: string;
```

### Array Validation
```typescript
@IsArray()
@IsString({ each: true })
tags: string[];
```

### Nested Object
```typescript
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

##  References

- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [class-validator](https://github.com/typestack/class-validator)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Exception Filters](https://docs.nestjs.com/exception-filters)

##  Next Steps (Day 3)

**Planned Tasks**:
1. Set up Prisma ORM
2. Configure PostgreSQL database
3. Create User and Organization models
4. Implement database migrations
5. Add database health check
6. Create repository pattern for data access

**Deliverables**:
- Working database connection
- User and Organization tables
- Prisma Client configured
- Database seeding script

## � Reflection

Day 2 established a solid foundation for API validation and error handling. The global ValidationPipe ensures all incoming data is validated automatically. The exception filter provides consistent error responses across the entire API.

Swagger documentation is now auto-generated from decorators, making it easy to keep docs in sync with code. The sample endpoint demonstrates that validation works correctly for all edge cases.

**What went well**:
- Validation works seamlessly with minimal code
- Error responses are consistent and informative
- Swagger UI provides interactive API testing
- forbidNonWhitelisted prevents security issues

**What to improve**:
- Consider adding custom validation decorators for business rules
- Add request/response logging interceptor
- Consider adding rate limiting
- Add API versioning strategy

---

**Commit Message**:
```
feat(day-02): add DTOs, validation, and Swagger

- Add global ValidationPipe with whitelist and transform
- Add global HttpExceptionFilter for consistent errors
- Configure Swagger with base setup
- Add sample endpoint with validation
- Add CreateSampleDto with class-validator decorators
- Document all endpoints with Swagger decorators
- Add comprehensive Day 2 documentation
```
