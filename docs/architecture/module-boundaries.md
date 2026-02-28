# Module Boundaries Reference

## Quick Reference

| Module | Responsibility | Public API | Dependencies | Publishes Events |
|--------|---------------|------------|--------------|------------------|
| Auth | Authentication & Authorization | Guards, Decorators, Endpoints | Database, JWT | No |
| Events | Event Lifecycle Management | CRUD Endpoints, DTOs | Database, EventBus | Yes |
| Common | Shared Infrastructure | EventBus, Filters, Pipes | None | No |
| Database | Data Access | PrismaService | Prisma | No |

## Detailed Boundaries

### Auth Module

**Location**: `src/modules/auth/`

**Responsibility**:
- User authentication (signup, login)
- JWT token management
- User authorization (roles, permissions)
- Session validation

**Public API**:
```typescript
// HTTP Endpoints
POST /auth/signup
POST /auth/login
GET /auth/me

// Guards (exported for use in other modules)
JwtAuthGuard
RolesGuard

// Decorators (exported for use in other modules)
@CurrentUser()
@Public()
@Roles()

// DTOs (exported as contracts)
SignupDto
LoginDto
```

**Internal (Not Exported)**:
```typescript
AuthService          // Business logic
JwtStrategy          // Passport strategy
PasswordHasher       // Password utilities
```

**Dependencies**:
- `@nestjs/jwt` - JWT token generation
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing
- `DatabaseModule` - User data access

**Does NOT Depend On**:
- Events module
- Any other feature module

**Communication**:
- Synchronous only (guards, decorators)
- No events published

---

### Events Module

**Location**: `src/modules/events/`

**Responsibility**:
- Event CRUD operations
- Event lifecycle management (draft → submitted → approved/rejected)
- Organization-scoped data access
- Ownership and permission checks

**Public API**:
```typescript
// HTTP Endpoints
POST /events
GET /events
GET /events/:id
PATCH /events/:id
DELETE /events/:id
POST /events/:id/submit
POST /events/:id/approve
POST /events/:id/reject

// DTOs (exported as contracts)
CreateEventDto
UpdateEventDto
QueryEventsDto
EventResponseDto
PaginatedEventsDto
```

**Internal (Not Exported)**:
```typescript
EventsService        // Business logic
EventsController     // HTTP layer
```

**Dependencies**:
- `DatabaseModule` - Event data access
- `EventBusService` - Domain event publishing
- `JwtAuthGuard` - Authentication (via decorator)
- `RolesGuard` - Authorization (via decorator)

**Does NOT Depend On**:
- `AuthService` - Uses guards instead
- Any other feature module services

**Domain Events Published**:
```typescript
event.submitted      // When user submits event for review
event.approved       // When moderator/admin approves event
event.rejected       // When moderator/admin rejects event
```

**Communication**:
- Synchronous: HTTP requests, guard checks
- Asynchronous: Domain events for side effects

---

### Common Module

**Location**: `src/common/`

**Responsibility**:
- Shared infrastructure
- Cross-cutting concerns
- Domain event bus
- Exception handling
- Validation
- Logging

**Public API**:
```typescript
// Event Bus
EventBusService
IDomainEvent
DomainEvent

// Filters
HttpExceptionFilter

// Interceptors
LoggingInterceptor
TimingInterceptor
ResponseEnvelopeInterceptor

// Pipes
ParseQueryPipe

// Decorators
@NoEnvelope()
@Public()
@Roles()

// Middleware
RequestIdMiddleware
```

**Internal**:
- None (all utilities are exported)

**Dependencies**:
- None (pure infrastructure)

**Used By**:
- All modules

**Communication**:
- Provides event bus for async communication
- Provides middleware for request processing

---

### Database Module

**Location**: `src/database/`

**Responsibility**:
- Database connection management
- Prisma client lifecycle
- Transaction support

**Public API**:
```typescript
PrismaService        // Database client
```

**Internal**:
```typescript
Connection pooling
Transaction management
```

**Dependencies**:
- `@prisma/client` - Database ORM

**Used By**:
- All modules that need data access

**Communication**:
- Synchronous only (direct calls)

---

## Dependency Rules

###  Allowed Dependencies

```
┌─────────────────────────────────────────┐
│              App Module                 │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┐
    ↓        ↓        ↓
┌────────┐ ┌────────┐ ┌────────┐
│  Auth  │ │ Events │ │Database│
└───┬────┘ └───┬────┘ └────────┘
    │          │
    │          ↓
    │     ┌────────┐
    │     │ Common │
    │     │ Events │
    │     └────────┘
    │
    ↓
┌────────┐
│Database│
└────────┘
```

**Rules**:
1. Feature modules can depend on Common
2. Feature modules can depend on Database
3. Feature modules CANNOT depend on other feature modules
4. Common CANNOT depend on feature modules

### ❌ Forbidden Dependencies

```
Auth ↔ Events           // No direct service calls
Events → Auth.Service   // Use guards instead
Common → Auth           // Common is infrastructure only
Common → Events         // Common is infrastructure only
```

### How to Communicate

#### Scenario 1: Authorization Check
```typescript
// ❌ Wrong: Direct service dependency
class EventsService {
  constructor(private authService: AuthService) {}
  
  async update(id: string, userId: string) {
    const user = await this.authService.findUser(userId);
    if (!this.authService.canUpdate(user)) throw ForbiddenException();
  }
}

//  Correct: Use guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async update(id: string, @CurrentUser() user: User) {
  // Authorization already checked
}
```

#### Scenario 2: Side Effects
```typescript
// ❌ Wrong: Direct service call
class EventsService {
  constructor(private notificationService: NotificationService) {}
  
  async approve(id: string) {
    const event = await this.updateStatus(id, 'APPROVED');
    await this.notificationService.send(event.createdById, 'approved');
  }
}

//  Correct: Use domain events
class EventsService {
  constructor(private eventBus: EventBusService) {}
  
  async approve(id: string) {
    const event = await this.updateStatus(id, 'APPROVED');
    await this.eventBus.publish(new EventApprovedEvent(event.id, {...}));
  }
}

// In NotificationModule
class NotificationService {
  constructor(private eventBus: EventBusService) {
    this.eventBus.on('event.approved', this.handleEventApproved.bind(this));
  }
  
  private async handleEventApproved(event: IDomainEvent) {
    // Send notification
  }
}
```

#### Scenario 3: Data Access
```typescript
//  Correct: Each module accesses its own data
class AuthService {
  constructor(private prisma: PrismaService) {}
  
  async findUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

class EventsService {
  constructor(private prisma: PrismaService) {}
  
  async findEvent(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }
}
```

## Checking for Circular Dependencies

### Manual Check
```bash
# Search for imports from other modules
grep -r "from '../auth" src/modules/events/
grep -r "from '../events" src/modules/auth/
```

### Automated Check (madge)
```bash
npm install -g madge

# Check for circular dependencies
madge --circular --extensions ts src/

# Visualize dependency graph
madge --image graph.png src/
```

### Expected Output
```
✓ No circular dependencies found!
```

## Module Communication Matrix

| From ↓ To → | Auth | Events | Common | Database |
|-------------|------|--------|--------|----------|
| **Auth**    | -    | ❌     |      |        |
| **Events**  | ⚠   | -      |      |        |
| **Common**  | ❌   | ❌     | -      | ❌       |
| **Database**| ❌   | ❌     | ❌     | -        |

Legend:
-  Allowed
- ❌ Forbidden
- ⚠ Only guards/decorators, not services

## Adding New Modules

### Checklist
1.  Define clear responsibility
2.  Identify public API (what to export)
3.  List dependencies (what to import)
4.  Decide communication pattern (sync/async)
5.  Define domain events (if any)
6.  Document boundaries
7.  Check for circular dependencies

### Template
```typescript
// new-feature.module.ts
@Module({
  imports: [
    DatabaseModule,        // If needs data access
    // DO NOT import other feature modules
  ],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [
    // Only export what other modules need
    // Usually nothing for feature modules
  ],
})
export class NewFeatureModule {}
```

## Testing Boundaries

### Unit Tests
```typescript
// Test module in isolation
describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;
  let eventBus: EventBusService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  // Test without depending on other modules
});
```

### Integration Tests
```typescript
// Test module interactions via events
describe('Event Approval Flow', () => {
  it('should publish event when approved', async () => {
    const spy = jest.spyOn(eventBus, 'publish');
    
    await eventsService.approve(eventId, orgId, UserRole.ADMIN);
    
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'event.approved',
      })
    );
  });
});
```

## Troubleshooting

### Problem: Circular Dependency Error
```
Error: Cannot resolve dependency
```

**Solution**: Check imports, remove direct service dependencies

### Problem: Module Not Found
```
Error: Nest can't resolve dependencies
```

**Solution**: Ensure module is imported in parent module

### Problem: Guard Not Working
```
Error: User is undefined
```

**Solution**: Ensure JwtAuthGuard is applied before RolesGuard

## Summary

**Key Principles**:
1. Feature modules are independent
2. Use guards for authorization
3. Use events for side effects
4. Share only DTOs and interfaces
5. No circular dependencies

**Benefits**:
- Easy to test
- Easy to understand
- Easy to maintain
- Easy to extract to microservices

**Remember**: Good boundaries make good architecture!
