# Day 13: Microservices Split + API Gateway

## Overview
Split the monolith into microservices with an API Gateway, Auth Service, and Events Service using TCP transport for inter-service communication.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API Gateway                            │
│              (Port 3000 - HTTP)                         │
│  - Routes HTTP requests                                 │
│  - Proxies to microservices                            │
│  - Handles authentication                               │
└────────┬──────────────────────┬─────────────────────────┘
         │ TCP                  │ TCP
         ↓                      ↓
┌────────────────────┐  ┌────────────────────┐
│   Auth Service     │  │  Events Service    │
│  (Port 3001 - TCP) │  │  (Port 3002 - TCP) │
│  - User auth       │  │  - Event CRUD      │
│  - JWT tokens      │  │  - State machine   │
│  - User data       │  │  - Event data      │
└────────┬───────────┘  └────────┬───────────┘
         │                       │
         ↓                       ↓
┌────────────────────────────────────────────┐
│           PostgreSQL Database              │
│  - Shared database (for simplicity)        │
│  - Could be split per service              │
└────────────────────────────────────────────┘
```

## Services

### 1. API Gateway
**Port**: 3000 (HTTP)
**Responsibility**: 
- Accept HTTP requests from clients
- Route to appropriate microservice
- Handle authentication/authorization
- Return HTTP responses

**Endpoints**:
```
POST /auth/login       → auth-service
POST /auth/signup      → auth-service
GET  /auth/me          → auth-service
GET  /events           → events-service
POST /events           → events-service
GET  /events/:id       → events-service
PATCH /events/:id      → events-service
DELETE /events/:id     → events-service
POST /events/:id/submit → events-service
POST /events/:id/approve → events-service
POST /events/:id/reject → events-service
```

### 2. Auth Service
**Port**: 3001 (TCP)
**Responsibility**:
- User authentication
- JWT token generation
- User management

**Message Patterns**:
```typescript
{ cmd: 'auth.signup' }
{ cmd: 'auth.login' }
{ cmd: 'auth.getMe' }
{ cmd: 'auth.validateUser' }
```

### 3. Events Service
**Port**: 3002 (TCP)
**Responsibility**:
- Event CRUD operations
- Event lifecycle management
- State transitions

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

## Transport: TCP

### Why TCP?
- **Simple**: No external dependencies (Redis, RabbitMQ)
- **Fast**: Direct socket communication
- **Reliable**: Built-in error handling
- **Local**: Perfect for local development

### Configuration
```typescript
// Microservice
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  },
);

// Gateway
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ]),
  ],
})
```

## Implementation Steps

### Step 1: Create API Gateway

```bash
cd api-gateway
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/microservices rxjs reflect-metadata
npm install -D @nestjs/cli typescript @types/node
```

**Structure**:
```
api-gateway/
├── src/
│   ├── auth/
│   │   └── auth.controller.ts
│   ├── events/
│   │   └── events.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

### Step 2: Create Auth Service

```bash
cd auth-service
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/microservices @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @prisma/client rxjs reflect-metadata
npm install -D @nestjs/cli typescript @types/node prisma
```

**Structure**:
```
auth-service/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

### Step 3: Create Events Service

```bash
cd events-service
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/microservices @prisma/client rxjs reflect-metadata
npm install -D @nestjs/cli typescript @types/node prisma
```

**Structure**:
```
events-service/
├── src/
│   ├── events/
│   │   ├── events.controller.ts
│   │   └── events.service.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

### Step 4: Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: eventboard
      POSTGRES_PASSWORD: eventboard_dev_password
      POSTGRES_DB: eventboard_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  auth-service:
    build: ./auth-service
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://eventboard:eventboard_dev_password@postgres:5432/eventboard_db
      JWT_SECRET: your-secret-key
      JWT_EXPIRY: 1h
    depends_on:
      - postgres

  events-service:
    build: ./events-service
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://eventboard:eventboard_dev_password@postgres:5432/eventboard_db
    depends_on:
      - postgres

  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      AUTH_SERVICE_HOST: auth-service
      AUTH_SERVICE_PORT: 3001
      EVENTS_SERVICE_HOST: events-service
      EVENTS_SERVICE_PORT: 3002
    depends_on:
      - auth-service
      - events-service

volumes:
  postgres_data:
```

## Message Patterns

### Auth Service

```typescript
// Signup
@MessagePattern({ cmd: 'auth.signup' })
async signup(data: SignupDto) {
  return this.authService.signup(data);
}

// Login
@MessagePattern({ cmd: 'auth.login' })
async login(data: LoginDto) {
  return this.authService.login(data);
}

// Get Me
@MessagePattern({ cmd: 'auth.getMe' })
async getMe(data: { userId: string }) {
  return this.authService.getMe(data.userId);
}
```

### Events Service

```typescript
// Create Event
@MessagePattern({ cmd: 'events.create' })
async create(data: { dto: CreateEventDto; userId: string; organizationId: string }) {
  return this.eventsService.create(data.dto, data.userId, data.organizationId);
}

// List Events
@MessagePattern({ cmd: 'events.findAll' })
async findAll(data: { query: QueryEventsDto; userId: string; organizationId: string; role: string }) {
  return this.eventsService.findAllPaginated(data.query, data.organizationId, data.userId, data.role);
}
```

## Gateway Implementation

### Auth Controller
```typescript
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authClient.send({ cmd: 'auth.signup' }, signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authClient.send({ cmd: 'auth.login' }, loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authClient.send({ cmd: 'auth.getMe' }, { userId: user.id });
  }
}
```

### Events Controller
```typescript
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    @Inject('EVENTS_SERVICE') private eventsClient: ClientProxy,
  ) {}

  @Post()
  async create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsClient.send(
      { cmd: 'events.create' },
      {
        dto: createEventDto,
        userId: user.id,
        organizationId: user.organizationId,
      },
    );
  }

  @Get()
  async findAll(@Query() query: QueryEventsDto, @CurrentUser() user: any) {
    return this.eventsClient.send(
      { cmd: 'events.findAll' },
      {
        query,
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      },
    );
  }
}
```

## Contract Stability

### Shared DTOs
To keep contracts stable, share DTOs between services:

```
shared/
└── dto/
    ├── auth/
    │   ├── signup.dto.ts
    │   └── login.dto.ts
    └── events/
        ├── create-event.dto.ts
        └── query-events.dto.ts
```

### Versioning
```typescript
// v1 endpoints
@MessagePattern({ cmd: 'events.create', version: '1' })

// v2 endpoints (when needed)
@MessagePattern({ cmd: 'events.create', version: '2' })
```

## Running Locally

### Without Docker
```bash
# Terminal 1: Auth Service
cd auth-service
npm run start:dev

# Terminal 2: Events Service
cd events-service
npm run start:dev

# Terminal 3: API Gateway
cd api-gateway
npm run start:dev
```

### With Docker
```bash
docker-compose up --build
```

## Testing

### Smoke Tests

```typescript
// test/smoke.e2e-spec.ts
describe('Microservices Smoke Tests', () => {
  it('should login via gateway', async () => {
    const response = await request('http://localhost:3000')
      .post('/auth/login')
      .send({
        email: 'admin@acme.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
  });

  it('should create event via gateway', async () => {
    const token = await getAuthToken();
    
    const response = await request('http://localhost:3000')
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2026-06-01T10:00:00Z',
        endDate: '2026-06-01T16:00:00Z',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });

  it('should list events via gateway', async () => {
    const token = await getAuthToken();
    
    const response = await request('http://localhost:3000')
      .get('/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
  });
});
```

## Benefits

### 1. Independent Scaling
- Scale auth service separately from events service
- Different resource requirements

### 2. Independent Deployment
- Deploy services independently
- Reduce deployment risk

### 3. Technology Flexibility
- Use different tech stacks per service
- Optimize per service needs

### 4. Team Ownership
- Teams own specific services
- Clear boundaries

### 5. Fault Isolation
- Service failure doesn't bring down entire system
- Better resilience

## Challenges

### 1. Distributed Transactions
- No ACID across services
- Use saga pattern or eventual consistency

### 2. Network Latency
- Inter-service calls add latency
- Use caching and async patterns

### 3. Debugging
- Harder to trace requests
- Need distributed tracing (Jaeger, Zipkin)

### 4. Data Consistency
- No foreign keys across services
- Use event-driven patterns

### 5. Operational Complexity
- More services to monitor
- Need orchestration (Kubernetes)

## Migration Strategy

### Phase 1: Extract Auth Service
1. Create auth-service with auth module code
2. Keep monolith running
3. Route auth requests to service
4. Verify functionality
5. Remove auth from monolith

### Phase 2: Extract Events Service
1. Create events-service with events module code
2. Keep monolith running
3. Route events requests to service
4. Verify functionality
5. Remove events from monolith

### Phase 3: API Gateway
1. Create gateway
2. Route all requests through gateway
3. Retire monolith HTTP layer
4. Keep only microservices

## Monitoring

### Health Checks
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

### Metrics
- Request count per service
- Response times
- Error rates
- Service availability

### Logging
- Structured logging (JSON)
- Correlation IDs across services
- Centralized logging (ELK, Loki)

## Definition of Done

 API Gateway created and running
 Auth Service created and running
 Events Service created and running
 TCP transport configured
 Gateway routes to services
 Login works via gateway
 List events works via gateway
 Create event works via gateway
 Docker Compose configuration
 Services run locally
 Smoke tests pass

## Next Steps

### Immediate
1. Add distributed tracing
2. Add service discovery
3. Add circuit breakers
4. Add rate limiting

### Future
1. Split database per service
2. Add message queue (RabbitMQ/Kafka)
3. Add API versioning
4. Add service mesh (Istio)
5. Deploy to Kubernetes

## Resources

- **NestJS Microservices**: https://docs.nestjs.com/microservices/basics
- **TCP Transport**: https://docs.nestjs.com/microservices/tcp
- **Docker Compose**: https://docs.docker.com/compose/
- **Microservices Patterns**: https://microservices.io/patterns/

Day 13 demonstrates the evolution from modular monolith to microservices architecture!
