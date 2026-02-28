# Day 13 Summary: Microservices Split + API Gateway

## What Was Built

### Architecture Transformation
Transformed the modular monolith into a microservices architecture with:
- **API Gateway**: HTTP entry point (port 3000)
- **Auth Service**: Authentication microservice (port 3001, TCP)
- **Events Service**: Events management microservice (port 3002, TCP)

### Communication Pattern
- **Client → Gateway**: HTTP/REST
- **Gateway → Services**: TCP (NestJS microservices)
- **Services → Database**: PostgreSQL (shared for simplicity)

## Services Overview

### 1. API Gateway
**Responsibility**: HTTP interface and request routing

**Features**:
- Accepts HTTP requests from clients
- Routes to appropriate microservice via TCP
- Handles JWT authentication
- Returns HTTP responses
- CORS handling
- Request/response transformation

**Endpoints**:
```
POST /auth/login
POST /auth/signup
GET  /auth/me
GET  /events
POST /events
GET  /events/:id
PATCH /events/:id
DELETE /events/:id
POST /events/:id/submit
POST /events/:id/approve
POST /events/:id/reject
```

### 2. Auth Service
**Responsibility**: User authentication and management

**Features**:
- User signup and login
- JWT token generation
- Password hashing (bcrypt)
- User validation
- Role management

**Message Patterns**:
```typescript
{ cmd: 'auth.signup' }
{ cmd: 'auth.login' }
{ cmd: 'auth.getMe' }
{ cmd: 'auth.validateUser' }
```

### 3. Events Service
**Responsibility**: Event lifecycle management

**Features**:
- Event CRUD operations
- State machine (draft → submitted → approved/rejected)
- Organization scoping
- Ownership validation
- Pagination and filtering

**Message Patterns**:
```typescript
{ cmd: 'events.create' }
{ cmd: 'events.findAll' }
{ cmd: 'events.findOne' }
{ cmd: 'events.update' }
{ cmd: 'events.delete' }
{ cmd: 'events.submit' }
{ cmd: 'events.approve' }
{ cmd: 'events.reject' }
```

## Technical Implementation

### Transport: TCP
- **Why**: Simple, no external dependencies, fast
- **Configuration**: Direct socket communication
- **Ports**: 3001 (auth), 3002 (events)

### Message Pattern
```typescript
// Gateway sends
this.authClient.send({ cmd: 'auth.login' }, loginDto)

// Service receives
@MessagePattern({ cmd: 'auth.login' })
async login(data: LoginDto) {
  return this.authService.login(data);
}
```

### Docker Compose
All services orchestrated with Docker Compose:
- PostgreSQL database
- Auth Service
- Events Service
- API Gateway
- Health checks
- Automatic restarts

## Benefits Achieved

### 1. Independent Scaling
- Scale auth service separately from events
- Different resource allocation per service

### 2. Independent Deployment
- Deploy services without affecting others
- Reduced deployment risk
- Faster release cycles

### 3. Technology Flexibility
- Can use different tech per service
- Optimize per service needs

### 4. Team Ownership
- Teams can own specific services
- Clear boundaries and responsibilities

### 5. Fault Isolation
- Service failure doesn't crash entire system
- Better resilience and availability

## Challenges Addressed

### 1. Network Latency
- **Challenge**: Inter-service calls add latency
- **Mitigation**: TCP is fast, use caching

### 2. Distributed Transactions
- **Challenge**: No ACID across services
- **Mitigation**: Use eventual consistency, saga pattern

### 3. Debugging
- **Challenge**: Harder to trace requests
- **Mitigation**: Correlation IDs, distributed tracing

### 4. Data Consistency
- **Challenge**: No foreign keys across services
- **Mitigation**: Event-driven patterns, eventual consistency

### 5. Operational Complexity
- **Challenge**: More services to manage
- **Mitigation**: Docker Compose, health checks, monitoring

## Migration Path

### From Monolith to Microservices

**Phase 1**: Modular Monolith (Days 1-12)
- Clear module boundaries
- Domain events
- No circular dependencies

**Phase 2**: Microservices (Day 13)
- Extract modules to services
- Add API Gateway
- TCP communication

**Phase 3**: Production Ready (Future)
- Service discovery
- Circuit breakers
- Distributed tracing
- Message queues
- Kubernetes deployment

## File Structure

```
E:\Backend\
├── monolith-api/              # Original (Days 1-12)
│   └── docs/
│       ├── day-13.md
│       ├── day-13-setup.md
│       └── day-13-summary.md
│
├── api-gateway/               # New
│   ├── src/
│   │   ├── auth/
│   │   │   └── auth.controller.ts
│   │   ├── events/
│   │   │   └── events.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── auth-service/              # New
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
│
├── events-service/            # New
│   ├── src/
│   │   ├── events/
│   │   │   ├── events.controller.ts
│   │   │   └── events.service.ts
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.microservices.yml
```

## Testing Strategy

### Smoke Tests
```typescript
describe('Microservices Smoke Tests', () => {
  it('should login via gateway', async () => {
    const response = await request('http://localhost:3000')
      .post('/auth/login')
      .send({ email: 'admin@acme.com', password: 'Password123!' })
      .expect(201);
    
    expect(response.body).toHaveProperty('accessToken');
  });

  it('should list events via gateway', async () => {
    const token = await getAuthToken();
    const response = await request('http://localhost:3000')
      .get('/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });

  it('should create event via gateway', async () => {
    const token = await getAuthToken();
    const response = await request('http://localhost:3000')
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Event',
        description: 'Test',
        startDate: '2026-06-01T10:00:00Z',
        endDate: '2026-06-01T16:00:00Z',
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

## Monitoring & Observability

### Health Checks
Each service exposes health endpoint:
```typescript
@Get('health')
async health() {
  return {
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  };
}
```

### Metrics to Track
- Request count per service
- Response times
- Error rates
- Service availability
- Database connection pool

### Logging
- Structured JSON logging
- Correlation IDs across services
- Centralized log aggregation

## Contract Stability

### Shared DTOs
DTOs are shared between gateway and services to maintain contracts:
```typescript
// Shared DTO
export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
```

### Versioning Strategy
```typescript
// v1 endpoint
@MessagePattern({ cmd: 'events.create', version: '1' })

// v2 endpoint (when needed)
@MessagePattern({ cmd: 'events.create', version: '2' })
```

## Performance Considerations

### TCP vs HTTP
- **TCP**: Faster, binary protocol, persistent connections
- **HTTP**: Slower, text protocol, stateless

### Caching
- Cache frequently accessed data
- Use Redis for distributed cache
- Cache at gateway level

### Connection Pooling
- Database connection pools per service
- Reuse TCP connections

## Security

### Authentication Flow
```
1. Client → Gateway: POST /auth/login
2. Gateway → Auth Service: { cmd: 'auth.login' }
3. Auth Service → Database: Validate credentials
4. Auth Service → Gateway: { accessToken, user }
5. Gateway → Client: { accessToken, user }
```

### Authorization
- JWT tokens validated at gateway
- User context passed to services
- Services enforce business rules

## Deployment

### Local Development
```bash
# Start all services
docker-compose -f docker-compose.microservices.yml up
```

### Production (Future)
- Kubernetes for orchestration
- Helm charts for deployment
- Service mesh (Istio) for traffic management
- Ingress controller for routing

## Comparison: Monolith vs Microservices

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| Deployment | Single unit | Multiple units |
| Scaling | Scale entire app | Scale per service |
| Technology | Single stack | Multiple stacks |
| Development | Simpler | More complex |
| Testing | Easier | Harder |
| Operations | Simpler | More complex |
| Fault Isolation | No | Yes |
| Team Structure | Single team | Multiple teams |

## When to Use Microservices

### Good Fit
- Large applications
- Multiple teams
- Different scaling needs
- Independent deployment required
- Technology diversity needed

### Not a Good Fit
- Small applications
- Small teams
- Simple requirements
- Tight coupling needed
- Operational complexity is a concern

## Definition of Done

✅ API Gateway created and running
✅ Auth Service created and running
✅ Events Service created and running
✅ TCP transport configured
✅ Gateway routes to services successfully
✅ Login works end-to-end via gateway
✅ List events works via gateway
✅ Create event works via gateway
✅ Docker Compose configuration complete
✅ Services run locally
✅ Smoke tests documented
✅ Architecture documented

## Key Takeaways

1. **Modular monolith first**: Clean boundaries make extraction easier
2. **TCP is simple**: No external dependencies for local development
3. **Gateway pattern**: Single entry point for clients
4. **Contract stability**: Share DTOs to maintain compatibility
5. **Gradual migration**: Extract one service at a time

## Next Steps

### Immediate
1. Add distributed tracing (Jaeger)
2. Add service discovery (Consul)
3. Add circuit breakers (Hystrix)
4. Add API rate limiting

### Future
1. Split database per service
2. Add message queue (RabbitMQ/Kafka)
3. Add service mesh (Istio)
4. Deploy to Kubernetes
5. Add monitoring (Prometheus/Grafana)

## Resources

- **Day 13 Guide**: `docs/day-13.md`
- **Setup Instructions**: `docs/day-13-setup.md`
- **NestJS Microservices**: https://docs.nestjs.com/microservices/basics
- **Microservices Patterns**: https://microservices.io/

Day 13 demonstrates the complete evolution from modular monolith to microservices architecture!
