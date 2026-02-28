# Modular Monolith Architecture

## Overview

This application follows a **Modular Monolith** architecture pattern. It's a single deployable unit (monolith) but internally organized into loosely coupled, highly cohesive modules with clear boundaries.

## Why Modular Monolith?

### Advantages
1. **Simplicity**: Single deployment, single database, simpler operations
2. **Performance**: In-process communication (no network overhead)
3. **Transactions**: ACID transactions across modules
4. **Development Speed**: Faster iteration, easier debugging
5. **Cost**: Lower infrastructure costs than microservices
6. **Evolution Path**: Can extract modules to microservices later if needed

### When to Use
- Early-stage products
- Small to medium teams
- When operational complexity is a concern
- When you need strong consistency
- When network latency matters

## Architecture Principles

### 1. Module Boundaries
Each module is a **bounded context** with:
- Clear responsibility
- Well-defined public API
- Internal implementation details hidden
- Minimal dependencies on other modules

### 2. Dependency Rules
```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│         (Controllers, DTOs)             │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│          Application Layer              │
│      (Services, Use Cases)              │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│    (Entities, Domain Events)            │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│    (Database, External Services)        │
└─────────────────────────────────────────┘
```

**Rules**:
- Dependencies point inward (toward domain)
- Domain layer has no dependencies
- Infrastructure depends on domain
- No circular dependencies between modules

### 3. Communication Patterns

#### Synchronous (Direct Calls)
- Use for: Queries, immediate consistency needs
- Example: Auth module validates user credentials

#### Asynchronous (Domain Events)
- Use for: Side effects, eventual consistency, decoupling
- Example: Event approved → send notification

## Module Structure

```
src/
├── modules/                    # Feature modules
│   ├── auth/                  # Authentication & authorization
│   │   ├── auth.module.ts    # Module definition
│   │   ├── auth.controller.ts # HTTP endpoints
│   │   ├── auth.service.ts   # Business logic
│   │   ├── dto/              # Data transfer objects
│   │   ├── guards/           # Auth guards
│   │   ├── strategies/       # Passport strategies
│   │   └── decorators/       # Custom decorators
│   │
│   └── events/               # Event management
│       ├── events.module.ts
│       ├── events.controller.ts
│       ├── events.service.ts
│       ├── dto/              # Public API contracts
│       └── events/           # Domain events
│
├── common/                    # Shared infrastructure
│   ├── events/               # Domain event bus
│   ├── filters/              # Exception filters
│   ├── guards/               # Shared guards
│   ├── interceptors/         # Cross-cutting concerns
│   ├── pipes/                # Validation pipes
│   └── decorators/           # Shared decorators
│
├── database/                  # Database infrastructure
│   ├── database.module.ts
│   └── prisma.service.ts
│
└── config/                    # Configuration
    └── app.config.ts
```

## Module Boundaries

### Auth Module
**Responsibility**: User authentication and authorization

**Public API**:
- `POST /auth/signup` - Create new user
- `POST /auth/login` - Authenticate user
- `GET /auth/me` - Get current user
- `JwtAuthGuard` - Protect routes
- `RolesGuard` - Check user roles
- `@CurrentUser()` - Get authenticated user

**Internal**:
- Password hashing
- JWT token generation
- User validation
- Session management

**Dependencies**:
- Database (Prisma)
- JWT library
- bcrypt

**No Dependencies On**: Events module, other feature modules

### Events Module
**Responsibility**: Event lifecycle management

**Public API**:
- `POST /events` - Create event
- `GET /events` - List events
- `GET /events/:id` - Get event
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /events/:id/submit` - Submit for review
- `POST /events/:id/approve` - Approve event
- `POST /events/:id/reject` - Reject event

**Internal**:
- Event CRUD logic
- State transition validation
- Authorization checks
- Pagination logic

**Dependencies**:
- Database (Prisma)
- EventBus (for domain events)
- Auth module (guards only, not services)

**Domain Events Published**:
- `event.submitted` - When event submitted for review
- `event.approved` - When event approved
- `event.rejected` - When event rejected

### Common Module
**Responsibility**: Shared infrastructure and cross-cutting concerns

**Provides**:
- Domain event bus (in-process pub/sub)
- Exception filters
- Validation pipes
- Logging interceptors
- Request ID middleware

**Used By**: All modules

## Domain Events

### Purpose
Domain events enable **loose coupling** between modules. Instead of direct dependencies, modules communicate through events.

### Event Flow
```
┌──────────────┐
│ Events Module│
│              │
│ approve()    │
└──────┬───────┘
       │
       │ 1. Update database
       │
       ↓
┌──────────────┐
│   Database   │
└──────┬───────┘
       │
       │ 2. Publish event
       │
       ↓
┌──────────────┐
│  Event Bus   │
└──────┬───────┘
       │
       │ 3. Notify handlers
       │
       ├─────────────────┐
       ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ Notification │  │  Analytics   │
│   Handler    │  │   Handler    │
└──────────────┘  └──────────────┘
```

### Event Structure
```typescript
interface IDomainEvent {
  eventId: string;        // Unique event ID
  eventType: string;      // e.g., 'event.approved'
  occurredAt: Date;       // When it happened
  aggregateId: string;    // ID of the entity
  aggregateType: string;  // Type of entity
  payload: object;        // Event data
}
```

### Example: Event Approval
```typescript
// 1. Events service publishes event
await this.eventBus.publish(
  new EventApprovedEvent(eventId, {
    title: event.title,
    organizationId: event.organizationId,
    approvedAt: new Date(),
    approvedBy: userId,
  })
);

// 2. Other modules can listen
this.eventBus.on('event.approved', async (event) => {
  // Send notification
  // Update analytics
  // Log audit trail
});
```

### Benefits
- **Decoupling**: Modules don't know about each other
- **Extensibility**: Add new handlers without changing existing code
- **Testability**: Easy to test in isolation
- **Auditability**: Events provide audit trail

## Preventing Circular Dependencies

### Rules
1. **Never import services from other modules**
   - ❌ Bad: `import { AuthService } from '../auth/auth.service'`
   - ✅ Good: Use guards, decorators, or events

2. **Use guards for authorization**
   - ❌ Bad: Call AuthService from EventsService
   - ✅ Good: Use JwtAuthGuard and RolesGuard

3. **Use events for cross-module communication**
   - ❌ Bad: Call NotificationService from EventsService
   - ✅ Good: Publish event, NotificationService listens

4. **Share only DTOs and interfaces**
   - ✅ OK: Import DTOs for API contracts
   - ❌ Bad: Import services or internal logic

### Dependency Graph
```
┌─────────────┐
│ App Module  │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ↓              ↓              ↓
┌──────────┐   ┌──────────┐   ┌──────────┐
│   Auth   │   │  Events  │   │ Database │
│  Module  │   │  Module  │   │  Module  │
└──────────┘   └─────┬────┘   └──────────┘
                     │
                     ↓
              ┌──────────────┐
              │  Event Bus   │
              │   (Common)   │
              └──────────────┘
```

**No cycles**: Auth ↛ Events, Events ↛ Auth

## Public Module APIs

### What to Export
- Controllers (HTTP endpoints)
- DTOs (data contracts)
- Guards (authorization)
- Decorators (metadata)
- Interfaces (contracts)

### What NOT to Export
- Services (internal logic)
- Repositories (data access)
- Internal helpers
- Implementation details

### Example: Events Module
```typescript
// events.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [EventsController],  // ✅ Exported implicitly
  providers: [EventsService],       // ❌ Not exported
  exports: [],                      // Keep empty
})
export class EventsModule {}
```

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock all dependencies
- Focus on business logic

### Integration Tests
- Test module interactions
- Use real database (test instance)
- Test domain event flow

### E2E Tests
- Test complete user flows
- Test across module boundaries
- Verify end-to-end behavior

## Evolution Path

### When to Extract a Microservice
Consider extraction when:
1. Module has different scaling needs
2. Module has different deployment cadence
3. Team wants independent ownership
4. Technology stack needs to differ

### How to Extract
1. **Ensure clean boundaries** (already done!)
2. **Replace event bus** with message queue (RabbitMQ, Kafka)
3. **Extract database** schema for the module
4. **Add API gateway** for routing
5. **Deploy independently**

The modular structure makes this transition smooth.

## Best Practices

### 1. Keep Modules Cohesive
- Single responsibility
- Related features together
- Clear domain boundaries

### 2. Minimize Coupling
- Use events for side effects
- Use guards for authorization
- Avoid direct service calls

### 3. Explicit Dependencies
- Declare in module imports
- No hidden dependencies
- Clear dependency graph

### 4. Test Boundaries
- Unit test each module
- Integration test interactions
- E2E test user flows

### 5. Document Boundaries
- Clear module responsibilities
- Document public APIs
- Explain design decisions

## Common Patterns

### Pattern 1: Command-Query Separation
```typescript
// Commands (write operations)
create(dto): Promise<Entity>
update(id, dto): Promise<Entity>
delete(id): Promise<void>

// Queries (read operations)
findAll(query): Promise<Entity[]>
findOne(id): Promise<Entity>
```

### Pattern 2: Domain Events for Side Effects
```typescript
// Main operation
async approve(id: string): Promise<Event> {
  const event = await this.updateStatus(id, 'APPROVED');
  
  // Publish event for side effects
  await this.eventBus.publish(
    new EventApprovedEvent(event.id, {...})
  );
  
  return event;
}
```

### Pattern 3: Guards for Authorization
```typescript
// Don't do this
async update(id: string, userId: string) {
  const user = await this.authService.findUser(userId); // ❌
  if (!this.authService.canUpdate(user, event)) throw ForbiddenException();
}

// Do this
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async update(id: string, @CurrentUser() user: User) { // ✅
  // Authorization already checked by guards
}
```

## Monitoring Module Health

### Metrics to Track
- Module response times
- Event processing times
- Cross-module call counts
- Error rates per module

### Health Checks
```typescript
@Get('health')
async health() {
  return {
    database: await this.checkDatabase(),
    eventBus: await this.checkEventBus(),
    modules: {
      auth: 'healthy',
      events: 'healthy',
    },
  };
}
```

## Summary

This modular monolith provides:
- ✅ Clear module boundaries
- ✅ No circular dependencies
- ✅ Loose coupling via events
- ✅ Strong cohesion within modules
- ✅ Simple deployment and operations
- ✅ Easy to test and maintain
- ✅ Path to microservices if needed

The architecture balances simplicity with good design, making it suitable for teams that want clean code without microservices complexity.
