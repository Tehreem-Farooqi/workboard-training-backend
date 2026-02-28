# Microservices Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                  (Browser / Postman / App)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + Headers
                              │ - Authorization: Bearer JWT
                              │ - X-Correlation-ID
                              │ - Idempotency-Key
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway :3000                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Features:                                            │  │
│  │  - Correlation ID generation/propagation              │  │
│  │  - JWT validation                                     │  │
│  │  - Request timeouts (5-10s)                           │  │
│  │  - Retry with exponential backoff                     │  │
│  │  - Idempotency key forwarding                         │  │
│  │  - Swagger documentation                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    │ TCP                │ TCP
                    │ (with metadata)    │ (with metadata)
                    ↓                    ↓
    ┌───────────────────────┐  ┌───────────────────────┐
    │  Auth Service :3001   │  │ Events Service :3002  │
    │  ┌─────────────────┐  │  │  ┌─────────────────┐  │
    │  │ Features:       │  │  │  │ Features:       │  │
    │  │ - User auth     │  │  │  │ - Event CRUD    │  │
    │  │ - JWT tokens    │  │  │  │ - Workflows     │  │
    │  │ - Password hash │  │  │  │ - Idempotency   │  │
    │  │ - Correlation   │  │  │  │ - Correlation   │  │
    │  │   logging       │  │  │  │   logging       │  │
    │  └─────────────────┘  │  │  └─────────────────┘  │
    └───────────────────────┘  └───────────────────────┘
                    │                    │
                    │                    │
                    └──────────┬─────────┘
                               │
                               ↓
                ┌──────────────────────────┐
                │   PostgreSQL :5432       │
                │  ┌────────────────────┐  │
                │  │ Tables:            │  │
                │  │ - Organization     │  │
                │  │ - User             │  │
                │  │ - Event            │  │
                │  └────────────────────┘  │
                └──────────────────────────┘
```

## Request Flow

### 1. Authentication Flow

```
Client                Gateway              Auth Service         Database
  │                     │                      │                   │
  │ POST /auth/login    │                      │                   │
  │ + X-Correlation-ID  │                      │                   │
  ├────────────────────>│                      │                   │
  │                     │ Generate/Extract     │                   │
  │                     │ Correlation ID       │                   │
  │                     │                      │                   │
  │                     │ TCP: auth.login      │                   │
  │                     │ + correlationId      │                   │
  │                     ├─────────────────────>│                   │
  │                     │                      │ Log: [corr-id]    │
  │                     │                      │ auth.login        │
  │                     │                      │                   │
  │                     │                      │ SELECT user       │
  │                     │                      ├──────────────────>│
  │                     │                      │<──────────────────┤
  │                     │                      │ Verify password   │
  │                     │                      │ Generate JWT      │
  │                     │                      │                   │
  │                     │<─────────────────────┤                   │
  │                     │ Return JWT + user    │                   │
  │                     │                      │                   │
  │<────────────────────┤                      │                   │
  │ 200 OK              │                      │                   │
  │ + X-Correlation-ID  │                      │                   │
  │ + JWT token         │                      │                   │
```

### 2. Create Event Flow (with Idempotency)

```
Client                Gateway              Events Service       Database
  │                     │                      │                   │
  │ POST /events        │                      │                   │
  │ + Authorization     │                      │                   │
  │ + Idempotency-Key   │                      │                   │
  │ + X-Correlation-ID  │                      │                   │
  ├────────────────────>│                      │                   │
  │                     │ Validate JWT         │                   │
  │                     │ Extract user info    │                   │
  │                     │                      │                   │
  │                     │ TCP: events.create   │                   │
  │                     │ + dto                │                   │
  │                     │ + userId             │                   │
  │                     │ + organizationId     │                   │
  │                     │ + correlationId      │                   │
  │                     │ + idempotencyKey     │                   │
  │                     ├─────────────────────>│                   │
  │                     │                      │ Log: [corr-id]    │
  │                     │                      │ events.create     │
  │                     │                      │                   │
  │                     │                      │ Check idempotency │
  │                     │                      │ cache             │
  │                     │                      │                   │
  │                     │                      │ INSERT event      │
  │                     │                      ├──────────────────>│
  │                     │                      │<──────────────────┤
  │                     │                      │                   │
  │                     │                      │ Cache response    │
  │                     │                      │                   │
  │                     │<─────────────────────┤                   │
  │                     │ Return event         │                   │
  │                     │                      │                   │
  │<────────────────────┤                      │                   │
  │ 201 Created         │                      │                   │
  │ + X-Correlation-ID  │                      │                   │
  │ + Event data        │                      │                   │
```

### 3. Retry Flow (Transient Failure)

```
Client                Gateway              Events Service
  │                     │                      │
  │ GET /events         │                      │
  ├────────────────────>│                      │
  │                     │ TCP: events.findAll  │
  │                     ├─────────────────────>│
  │                     │                      X Connection refused
  │                     │                      │
  │                     │ [Retry] Attempt 1/3  │
  │                     │ Wait 1s              │
  │                     │                      │
  │                     │ TCP: events.findAll  │
  │                     ├─────────────────────>│
  │                     │                      X Connection refused
  │                     │                      │
  │                     │ [Retry] Attempt 2/3  │
  │                     │ Wait 2s              │
  │                     │                      │
  │                     │ TCP: events.findAll  │
  │                     ├─────────────────────>│
  │                     │                      │ ✓ Connected
  │                     │<─────────────────────┤
  │                     │ Return events        │
  │                     │                      │
  │<────────────────────┤                      │
  │ 200 OK              │                      │
```

## Component Details

### API Gateway

**Responsibilities:**
- HTTP endpoint exposure
- JWT validation
- Correlation ID management
- Timeout enforcement
- Retry logic
- Request routing

**Technologies:**
- NestJS
- @nestjs/microservices
- @nestjs/jwt
- Passport JWT
- RxJS

**Configuration:**
- Port: 3000
- Timeouts: 5-10s
- Retry attempts: 1-3
- Transport: TCP

### Auth Service

**Responsibilities:**
- User authentication
- JWT token generation
- Password hashing
- User management

**Technologies:**
- NestJS
- Prisma ORM
- bcrypt
- @nestjs/jwt

**Configuration:**
- Port: 3001
- Transport: TCP
- JWT expiry: 1h

**Message Patterns:**
- `auth.signup`
- `auth.login`
- `auth.getMe`
- `auth.validateUser`

### Events Service

**Responsibilities:**
- Event CRUD operations
- Event lifecycle management
- State transitions
- Idempotency handling

**Technologies:**
- NestJS
- Prisma ORM
- In-memory cache (idempotency)

**Configuration:**
- Port: 3002
- Transport: TCP
- Idempotency TTL: 24h

**Message Patterns:**
- `events.create`
- `events.findAll`
- `events.findOne`
- `events.update`
- `events.delete`
- `events.submit`
- `events.approve`
- `events.reject`

### PostgreSQL

**Responsibilities:**
- Data persistence
- ACID transactions
- Relational queries

**Configuration:**
- Port: 5432
- Database: eventboard_db
- User: eventboard

**Schema:**
- Organization (id, name, slug)
- User (id, email, passwordHash, role, organizationId)
- Event (id, title, description, status, organizationId, createdById)

## Production Features

### Timeouts

Prevent requests from hanging indefinitely:

```typescript
// Gateway controller
this.eventsClient
  .send({ cmd: 'events.findAll' }, data)
  .pipe(timeout(10000)) // 10 second timeout
```

**Configuration:**
- Auth operations: 5s
- Read operations: 5-10s
- Write operations: 10s

### Retry Strategy

Handle transient failures with exponential backoff:

```typescript
retryWithBackoff({
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT']
})
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: Wait 1s
- Attempt 3: Wait 2s
- Attempt 4: Wait 4s

### Correlation IDs

Track requests across services:

```
[abc-123] POST /events completed
[abc-123] events.create - userId: user-456
[abc-123] INSERT INTO Event ...
```

**Benefits:**
- End-to-end tracing
- Distributed debugging
- Performance analysis
- Error correlation

### Idempotency

Prevent duplicate operations:

```typescript
// Client sends
Idempotency-Key: unique-key-123

// Service checks cache
if (cache.has(key)) {
  return cache.get(key); // Return cached response
}

// Execute operation
const result = await operation();

// Cache result
cache.set(key, result, 24h);
```

**Applies to:**
- Create event
- Submit event
- Approve event
- Reject event

## Deployment

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    healthcheck: pg_isready

  auth-service:
    build: ./auth-service
    ports: ["3001:3001"]
    depends_on: [postgres]

  events-service:
    build: ./events-service
    ports: ["3002:3002"]
    depends_on: [postgres]

  api-gateway:
    build: ./api-gateway
    ports: ["3000:3000"]
    depends_on: [auth-service, events-service]
```

### Kubernetes (Future)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    spec:
      containers:
      - name: api-gateway
        image: eventboard/api-gateway:latest
        ports:
        - containerPort: 3000
```

## Monitoring

### Key Metrics

- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Service availability (%)
- Retry rate (%)
- Timeout rate (%)
- Database connections
- Memory usage
- CPU usage

### Logging

```bash
# View all logs
docker-compose logs -f

# Filter by correlation ID
docker-compose logs | grep "abc-123"

# Filter by service
docker-compose logs -f events-service
```

### Tracing

```
Request: abc-123
├─ Gateway: 150ms
│  ├─ JWT validation: 5ms
│  └─ Route to service: 145ms
└─ Events Service: 140ms
   ├─ Idempotency check: 2ms
   ├─ Database query: 130ms
   └─ Response serialization: 8ms
```

## Security

### Authentication
- JWT tokens with expiry
- bcrypt password hashing (10 rounds)
- Secure token storage

### Authorization
- Role-based access control (RBAC)
- Organization-level isolation
- Resource ownership validation

### Network
- CORS enabled
- HTTPS (production)
- Rate limiting (future)

## Scalability

### Horizontal Scaling

```bash
# Scale events service
docker-compose up -d --scale events-service=3
```

### Load Balancing

```
Client → Load Balancer → Gateway 1
                      → Gateway 2
                      → Gateway 3
```

### Database Optimization

- Connection pooling
- Query optimization
- Indexes on foreign keys
- Read replicas (future)

## Future Enhancements

1. **Distributed Tracing**: Jaeger/Zipkin
2. **Service Mesh**: Istio/Linkerd
3. **Circuit Breakers**: Resilience4j
4. **Rate Limiting**: Redis-based
5. **Caching**: Redis for idempotency
6. **Message Queue**: RabbitMQ/Kafka
7. **Service Discovery**: Consul/Eureka
8. **API Gateway**: Kong/Traefik
9. **Metrics**: Prometheus + Grafana
10. **Logging**: ELK/Loki stack

## Resources

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Microservices Patterns](https://microservices.io/patterns/)
- [12-Factor App](https://12factor.net/)
- [Distributed Tracing](https://opentelemetry.io/)
