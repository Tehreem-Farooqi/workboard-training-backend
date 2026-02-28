# EventBoard Microservices Architecture

## Overview
This is the microservices version of the EventBoard application, split from the modular monolith (Days 1-12) into independent services.

## Architecture

```
Client → API Gateway → Auth Service
                    → Events Service
                         ↓
                    PostgreSQL
```

## Services

### 1. API Gateway (Port 3000)
- HTTP entry point for all client requests
- Routes requests to appropriate microservices
- Handles authentication and authorization
- Returns HTTP responses to clients

### 2. Auth Service (Port 3001)
- User authentication and management
- JWT token generation
- Password hashing
- Communicates via TCP

### 3. Events Service (Port 3002)
- Event CRUD operations
- Event lifecycle management
- State transitions
- Communicates via TCP

## Quick Start

### Prerequisites
- Node.js 20.x
- Docker Desktop
- npm or yarn

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.microservices.yml up --build

# Services will be available at:
# - API Gateway: http://localhost:3000
# - Auth Service: http://localhost:3001 (TCP)
# - Events Service: http://localhost:3002 (TCP)
# - PostgreSQL: localhost:5432
# - Swagger: http://localhost:3000/api
```

### Option 2: Local Development

```bash
# Terminal 1: Start PostgreSQL
cd monolith-api
docker compose up -d

# Terminal 2: Auth Service
cd auth-service
npm install
npm run start:dev

# Terminal 3: Events Service
cd events-service
npm install
npm run start:dev

# Terminal 4: API Gateway
cd api-gateway
npm install
npm run start:dev
```

## Testing

### 1. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!"}'
```

### 2. List Events
```bash
curl http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create Event
```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -H "X-Correlation-ID: trace-123" \
  -d '{"title":"Test Event","description":"Test","startDate":"2026-06-01T10:00:00Z","endDate":"2026-06-01T16:00:00Z"}'
```

## Project Structure

```
.
├── api-gateway/           # HTTP gateway service
├── auth-service/          # Authentication microservice
├── events-service/        # Events microservice
├── monolith-api/          # Original monolith (reference)
└── docker-compose.microservices.yml
```

## Documentation

- **Day 13 Guide**: `monolith-api/docs/day-13.md` - Microservices split
- **Day 14 Guide**: `monolith-api/docs/day-14.md` - Production readiness
- **Setup Instructions**: `monolith-api/docs/day-13-setup.md` and `day-14-setup.md`
- **Summary**: `monolith-api/docs/day-13-summary.md` and `day-14-summary.md`
- **Quick Reference**: `monolith-api/docs/microservices-quick-reference.md`
- **Production Runbook**: `PRODUCTION-RUNBOOK.md`
- **Demo Checklist**: `DEMO-CHECKLIST.md`

## Key Features

✅ Independent service deployment
✅ TCP-based inter-service communication
✅ Shared database (can be split later)
✅ Docker Compose orchestration
✅ Health checks per service
✅ JWT authentication
✅ Role-based authorization
✅ Event lifecycle management
✅ **Timeouts and retry strategy**
✅ **Correlation ID propagation**
✅ **Idempotency handling**
✅ **Structured logging**

## Technology Stack

- **Framework**: NestJS
- **Transport**: TCP (NestJS Microservices)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Containerization**: Docker

## Production Features

### Timeouts
- Auth operations: 5 seconds
- Read operations: 5-10 seconds
- Write operations: 10 seconds
- Prevents hanging requests

### Retry Strategy
- Exponential backoff (1s, 2s, 4s)
- Retryable errors: ECONNREFUSED, ETIMEDOUT, 503, 504
- Configurable max attempts (1-3)
- Non-retryable errors fail immediately

### Correlation IDs
- Generated at gateway or from `X-Correlation-ID` header
- Propagated to all services
- Logged at each service boundary
- Returned in response headers
- Enables end-to-end request tracing

### Idempotency
- Client sends `Idempotency-Key` header
- Service caches response for 24 hours
- Duplicate requests return cached response
- Applies to: create, submit, approve, reject events

### Structured Logging
- All logs include correlation IDs
- Easy to trace requests across services
- Format: `[correlation-id] operation - details`

## Development Workflow

1. Make changes to service code
2. Service auto-reloads (in dev mode)
3. Test via API Gateway
4. Check logs for errors
5. Iterate

## Monitoring

### Health Checks
```bash
# Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Events Service
curl http://localhost:3002/health
```

### Logs
```bash
# View all logs
docker-compose -f docker-compose.microservices.yml logs -f

# View specific service
docker-compose -f docker-compose.microservices.yml logs -f api-gateway
```

## Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.microservices.yml down

# Stop and remove volumes
docker-compose -f docker-compose.microservices.yml down -v
```

## Troubleshooting

### Services won't start
- Check if ports 3000, 3001, 3002, 5432 are available
- Check Docker Desktop is running
- Check logs: `docker-compose logs`

### Can't connect to database
- Ensure PostgreSQL container is running
- Check DATABASE_URL environment variable
- Verify database credentials

### Gateway can't reach services
- Ensure all services are running
- Check service health endpoints
- Verify TCP ports are open

## Next Steps

- [ ] Add distributed tracing
- [ ] Add service discovery
- [ ] Add circuit breakers
- [ ] Split database per service
- [ ] Add message queue
- [ ] Deploy to Kubernetes

## Resources

- [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Microservices Patterns](https://microservices.io/patterns/)

## License

UNLICENSED - Private project

## Support

For issues or questions, refer to the documentation in `monolith-api/docs/`.
