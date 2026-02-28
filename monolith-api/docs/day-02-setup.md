# Day 2 Setup Instructions

## Step 1: Install Dependencies

Run this command in the `monolith-api` directory:

```bash
npm install --save @nestjs/swagger
```

## Step 2: Start the Application

```bash
npm run start:dev
```

Wait for the message:
```
🚀 EventBoard API is running on: http://localhost:3000
📋 Health check: http://localhost:3000/health
📚 Swagger docs: http://localhost:3000/api
```

## Step 3: Test the Implementation

### Option A: Using Browser

1. **Swagger UI**: Open `http://localhost:3000/api`
   - You should see the Swagger documentation
   - Try the POST /sample endpoint with the "Try it out" button

2. **Health Check**: Open `http://localhost:3000/health`
   - Should return `{"status":"ok",...}`

### Option B: Using curl (Command Line)

#### Test 1: Valid Payload ✅
```bash
curl -X POST http://localhost:3000/sample -H "Content-Type: application/json" -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"age\":25}"
```

Expected: Success response with data

#### Test 2: Invalid Email ❌
```bash
curl -X POST http://localhost:3000/sample -H "Content-Type: application/json" -d "{\"name\":\"John Doe\",\"email\":\"invalid-email\",\"age\":25}"
```

Expected: 400 error with message "email must be an email"

#### Test 3: Unknown Fields ❌
```bash
curl -X POST http://localhost:3000/sample -H "Content-Type: application/json" -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"age\":25,\"unknownField\":\"test\"}"
```

Expected: 400 error with message "property unknownField should not exist"

#### Test 4: Missing Fields ❌
```bash
curl -X POST http://localhost:3000/sample -H "Content-Type: application/json" -d "{\"age\":25}"
```

Expected: 400 error listing missing fields

### Option C: Using test-day-02.http File

If you have REST Client extension in VS Code:
1. Open `test-day-02.http`
2. Click "Send Request" above each test

## Step 4: Verify Definition of Done

- [ ] Invalid payload returns 400 with details
- [ ] Unknown fields are rejected (forbidNonWhitelisted)
- [ ] Error shape includes: statusCode, timestamp, path, method, message
- [ ] Swagger loads at http://localhost:3000/api
- [ ] Swagger shows POST /sample route
- [ ] Swagger shows GET /health route

## What Was Implemented

### Files Created:
- `src/common/filters/http-exception.filter.ts` - Global exception filter
- `src/common/dto/create-sample.dto.ts` - Sample DTO with validation
- `src/common/dto/index.ts` - DTO barrel export
- `docs/day-02.md` - Day 2 documentation
- `test-day-02.http` - HTTP test file

### Files Modified:
- `src/main.ts` - Added Swagger config and exception filter
- `src/app.controller.ts` - Added sample endpoint with Swagger decorators
- `src/health/health.controller.ts` - Added Swagger decorators
- `README.md` - Updated roadmap

### Features:
1. ✅ Global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
2. ✅ Global Exception Filter (consistent error format)
3. ✅ Swagger UI with base configuration
4. ✅ Sample endpoint with validation
5. ✅ DTO with class-validator decorators
6. ✅ Swagger decorators on all endpoints

## Troubleshooting

### Issue: "Cannot find module '@nestjs/swagger'"
**Solution**: Run `npm install --save @nestjs/swagger`

### Issue: Port 3000 already in use
**Solution**: 
- Stop other processes using port 3000
- Or change PORT in `.env` file

### Issue: Validation not working
**Solution**: 
- Ensure ValidationPipe is registered in main.ts
- Check that DTO has proper decorators
- Verify class-validator is installed

## Next Steps

After verifying Day 2 is complete, you can proceed to Day 3:
- Prisma ORM setup
- PostgreSQL database configuration
- Database migrations
- User and Organization models
