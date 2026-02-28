# EventBoard Demo Checklist

## Pre-Demo Setup

### 1. Environment Check
- [ ] Docker Desktop is running
- [ ] Ports 3000, 3001, 3002, 5432 are available
- [ ] Node.js 20.x installed
- [ ] Git repository is clean

### 2. Start Services
```bash
cd E:\Backend
docker-compose -f docker-compose.microservices.yml up -d
```

- [ ] All containers started successfully
- [ ] Database is healthy
- [ ] Auth service is running
- [ ] Events service is running
- [ ] API Gateway is running

### 3. Verify Health
```bash
curl http://localhost:3000/health
```
- [ ] Gateway responds with 200 OK

### 4. Prepare Test Data
Database should be seeded with:
- [ ] 2 organizations (ACME Corp, TechStart Inc)
- [ ] 4 users (admin, moderator, user, user2)
- [ ] 3 sample events

## Demo Flow

### Part 1: Authentication (2 minutes)

#### 1.1 Login as Admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!"}'
```
- [ ] Returns access token
- [ ] Returns user details with ADMIN role
- [ ] Response includes X-Correlation-ID header

#### 1.2 Get Current User
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"
```
- [ ] Returns user profile
- [ ] Includes organization details

### Part 2: Event Management (5 minutes)

#### 2.1 Create Event
```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-create-1" \
  -d '{
    "title":"Demo Event",
    "description":"Testing event creation",
    "startDate":"2026-06-01T10:00:00Z",
    "endDate":"2026-06-01T16:00:00Z",
    "location":"Conference Room A"
  }'
```
- [ ] Event created with DRAFT status
- [ ] Returns event ID
- [ ] Idempotency key accepted

#### 2.2 Test Idempotency
```bash
# Send same request again with same idempotency key
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-create-1" \
  -d '{
    "title":"Demo Event",
    "description":"Testing event creation",
    "startDate":"2026-06-01T10:00:00Z",
    "endDate":"2026-06-01T16:00:00Z",
    "location":"Conference Room A"
  }'
```
- [ ] Returns same event (not created again)
- [ ] Same event ID as before

#### 2.3 List Events
```bash
curl "http://localhost:3000/events?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```
- [ ] Returns paginated list
- [ ] Includes metadata (total, pages, etc.)
- [ ] Shows created event

#### 2.4 Update Event
```bash
curl -X PATCH http://localhost:3000/events/EVENT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Demo Event"}'
```
- [ ] Event updated successfully
- [ ] Still in DRAFT status

### Part 3: Event Workflow (3 minutes)

#### 3.1 Submit Event
```bash
curl -X POST http://localhost:3000/events/EVENT_ID/submit \
  -H "Authorization: Bearer TOKEN" \
  -H "Idempotency-Key: demo-submit-1"
```
- [ ] Status changed to SUBMITTED
- [ ] Idempotency key accepted

#### 3.2 Login as Moderator
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"moderator@acme.com","password":"Password123!"}'
```
- [ ] Returns moderator token

#### 3.3 Approve Event
```bash
curl -X POST http://localhost:3000/events/EVENT_ID/approve \
  -H "Authorization: Bearer MODERATOR_TOKEN" \
  -H "Idempotency-Key: demo-approve-1"
```
- [ ] Status changed to APPROVED
- [ ] Only moderator/admin can approve

### Part 4: Production Features (3 minutes)

#### 4.1 Correlation ID Tracking
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "X-Correlation-ID: demo-trace-123" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!"}'
```
- [ ] Response includes X-Correlation-ID: demo-trace-123
- [ ] Check logs: `docker-compose logs | grep "demo-trace-123"`
- [ ] Correlation ID appears in all service logs

#### 4.2 View Logs with Correlation
```bash
docker-compose -f docker-compose.microservices.yml logs | grep "demo-trace-123"
```
- [ ] Shows request flow through gateway
- [ ] Shows auth service processing
- [ ] All logs tagged with same correlation ID

#### 4.3 Test Timeout/Retry
```bash
# Stop events service
docker-compose -f docker-compose.microservices.yml stop events-service

# Try to list events
curl http://localhost:3000/events \
  -H "Authorization: Bearer TOKEN"

# Restart events service
docker-compose -f docker-compose.microservices.yml start events-service
```
- [ ] Request times out after configured duration
- [ ] Returns 408 Request Timeout
- [ ] Retry attempts logged
- [ ] Service recovers after restart

### Part 5: Advanced Features (2 minutes)

#### 5.1 Filtering and Search
```bash
curl "http://localhost:3000/events?status=APPROVED&search=Demo" \
  -H "Authorization: Bearer TOKEN"
```
- [ ] Returns filtered results
- [ ] Search works across title and description

#### 5.2 Role-Based Access
```bash
# Login as regular user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@acme.com","password":"Password123!"}'

# Try to approve event (should fail)
curl -X POST http://localhost:3000/events/EVENT_ID/approve \
  -H "Authorization: Bearer USER_TOKEN"
```
- [ ] Returns 403 Forbidden
- [ ] Error message explains permission denied

## Post-Demo Cleanup

### View All Logs
```bash
docker-compose -f docker-compose.microservices.yml logs
```

### Stop Services
```bash
docker-compose -f docker-compose.microservices.yml down
```

### Clean Up (Optional)
```bash
docker-compose -f docker-compose.microservices.yml down -v
```

## Talking Points

### Architecture
- Microservices with API Gateway pattern
- TCP transport for inter-service communication
- Shared database (can be split later)
- Docker Compose orchestration

### Production Features
- **Timeouts**: Prevent hanging requests
- **Retries**: Exponential backoff for transient failures
- **Correlation IDs**: End-to-end request tracing
- **Idempotency**: Prevent duplicate operations
- **Structured Logging**: Easy debugging and monitoring

### Scalability
- Services can be scaled independently
- Stateless design enables horizontal scaling
- Database connection pooling
- Ready for Kubernetes deployment

### Security
- JWT authentication
- Role-based authorization
- Password hashing with bcrypt
- CORS enabled

### Developer Experience
- One command to start everything
- Swagger documentation
- Comprehensive error messages
- Easy local development

## Common Issues

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process or change port in docker-compose
```

### Database Not Ready
```bash
# Check database health
docker-compose -f docker-compose.microservices.yml ps

# Restart database
docker-compose -f docker-compose.microservices.yml restart postgres
```

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.microservices.yml logs [service-name]

# Rebuild service
docker-compose -f docker-compose.microservices.yml up --build [service-name]
```

## Success Criteria

- [ ] All services start with one command
- [ ] Authentication works end-to-end
- [ ] Event CRUD operations work
- [ ] Event workflow (submit/approve/reject) works
- [ ] Correlation IDs flow through all services
- [ ] Idempotency prevents duplicate operations
- [ ] Timeouts and retries work as expected
- [ ] Logs are structured and searchable
- [ ] Role-based access control enforced
- [ ] System recovers from service failures

## Demo Duration

- Setup: 2 minutes
- Part 1 (Auth): 2 minutes
- Part 2 (Events): 5 minutes
- Part 3 (Workflow): 3 minutes
- Part 4 (Production): 3 minutes
- Part 5 (Advanced): 2 minutes
- **Total: ~15-20 minutes**

## Backup Plan

If live demo fails:
1. Show pre-recorded video
2. Walk through code
3. Show documentation
4. Discuss architecture diagrams

## Questions to Anticipate

1. **Why microservices?** - Scalability, independent deployment, technology flexibility
2. **Why TCP transport?** - Fast, reliable, built into NestJS
3. **Why shared database?** - Simplicity for MVP, can split later
4. **How to deploy?** - Docker Compose locally, Kubernetes for production
5. **How to monitor?** - Correlation IDs, structured logs, add Prometheus/Grafana
6. **How to handle failures?** - Timeouts, retries, circuit breakers (future)
7. **How to scale?** - Horizontal scaling with load balancer
8. **How to test?** - Unit tests, e2e tests, integration tests (from monolith)
