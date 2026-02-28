# Day 12: Modular Monolith Architecture Refactor

## Overview
Refactored the application to enforce module boundaries, introduced domain events for decoupling, and documented the modular monolith architecture.

## Features Implemented

### 1. Domain Event System

#### Event Bus Service
- **Location**: `src/common/events/event-bus.service.ts`
- **Purpose**: In-process pub/sub for domain events
- **Features**:
  - Register event handlers
  - Publish events to all handlers
  - Parallel handler execution
  - Error handling and logging

```typescript
// Publishing an event
await this.eventBus.publish(
  new EventApprovedEvent(eventId, {
    title: event.title,
    approvedAt: new Date(),
    approvedBy: userId,
  })
);

// Listening to events
this.eventBus.on('event.approved', async (event) => {
  // Handle event
});
```

#### Domain Event Interface
- **Location**: `src/common/events/domain-event.interface.ts`
- **Structure**:
  - `eventId`: Unique identifier
  - `eventType`: Event type (e.g., 'event.approved')
  - `occurredAt`: Timestamp
  - `aggregateId`: Entity ID
  - `aggregateType`: Entity type
  - `payload`: Event data

### 2. Event Module Domain Events

Created three domain events for the events module:

#### EventSubmittedEvent
- **Trigger**: When user submits event for review
- **Payload**: title, organizationId, createdById, submittedAt
- **Use Cases**: Notify moderators, update analytics

#### EventApprovedEvent
- **Trigger**: When moderator/admin approves event
- **Payload**: title, organizationId, createdById, approvedAt, approvedBy
- **Use Cases**: Notify creator, publish event, update stats

#### EventRejectedEvent
- **Trigger**: When moderator/admin rejects event
- **Payload**: title, organizationId, createdById, rejectedAt, rejectedBy, reason
- **Use Cases**: Notify creator with reason, log rejection

### 3. Module Boundary Enforcement

#### Clear Public APIs
Each module exports only what others need:

**Auth Module**:
-  Exports: Guards, Decorators, DTOs
- ❌ Does NOT export: AuthService (internal)

**Events Module**:
-  Exports: DTOs (contracts)
- ❌ Does NOT export: EventsService (internal)

**Common Module**:
-  Exports: EventBus, Filters, Pipes, Interceptors
- ❌ No internal implementation details

#### No Circular Dependencies
```
Auth Module ↛ Events Module
Events Module ↛ Auth Module (uses guards only)
Common Module ↛ Feature Modules
```

### 4. Communication Patterns

#### Synchronous (Direct)
- Used for: Queries, immediate consistency
- Example: Guards checking authentication

#### Asynchronous (Events)
- Used for: Side effects, eventual consistency
- Example: Sending notifications after approval

### 5. Updated Events Service

Modified to publish domain events:
```typescript
async approve(id: string, ...): Promise<EventResponseDto> {
  // 1. Update database
  const event = await this.prisma.event.update({...});
  
  // 2. Publish domain event
  await this.eventBus.publish(
    new EventApprovedEvent(event.id, {...})
  );
  
  // 3. Return response
  return new EventResponseDto(event);
}
```

### 6. Architecture Documentation

Created comprehensive documentation:

#### architecture.md
- Modular monolith principles
- Module structure
- Dependency rules
- Communication patterns
- Evolution path to microservices

#### module-boundaries.md
- Detailed module responsibilities
- Public APIs
- Dependency matrix
- Communication examples
- Troubleshooting guide

## Architecture Principles

### 1. Single Responsibility
Each module has one clear responsibility:
- **Auth**: Authentication & authorization
- **Events**: Event lifecycle management
- **Common**: Shared infrastructure

### 2. Dependency Inversion
- Modules depend on abstractions (interfaces, events)
- Not on concrete implementations
- Guards instead of service calls

### 3. Loose Coupling
- Modules communicate via events
- No direct service dependencies
- Easy to test in isolation

### 4. High Cohesion
- Related features grouped together
- Internal details hidden
- Clear module boundaries

## Benefits

### 1. Maintainability
- Clear module boundaries
- Easy to understand
- Easy to modify

### 2. Testability
- Modules test in isolation
- Mock dependencies easily
- Fast unit tests

### 3. Scalability
- Can extract modules to microservices
- Independent scaling possible
- Clear migration path

### 4. Team Productivity
- Teams can own modules
- Parallel development
- Reduced conflicts

## File Structure

```
src/
├── common/
│   └── events/
│       ├── domain-event.interface.ts
│       ├── event-bus.service.ts
│       ├── events.module.ts
│       └── index.ts
│
├── modules/
│   ├── auth/
│   │   └── (no changes - already well-bounded)
│   │
│   └── events/
│       ├── events/
│       │   ├── event-submitted.event.ts
│       │   ├── event-approved.event.ts
│       │   ├── event-rejected.event.ts
│       │   └── index.ts
│       ├── events.controller.ts (updated)
│       ├── events.service.ts (updated)
│       └── events.module.ts
│
└── app.module.ts (updated)
```

## Module Dependency Graph

```
┌─────────────┐
│ App Module  │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ↓              ↓              ↓              ↓
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Common  │   │   Auth   │   │  Events  │   │ Database │
│  Events  │   │  Module  │   │  Module  │   │  Module  │
└──────────┘   └─────┬────┘   └─────┬────┘   └──────────┘
                     │              │
                     └──────┬───────┘
                            ↓
                     ┌──────────┐
                     │ Database │
                     └──────────┘
```

**No cycles!**

## Testing

### Unit Tests
```typescript
describe('EventsService', () => {
  let service: EventsService;
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
    eventBus = module.get(EventBusService);
  });

  it('should publish event when approved', async () => {
    const spy = jest.spyOn(eventBus, 'publish');
    
    await service.approve(eventId, orgId, UserRole.ADMIN);
    
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'event.approved',
      })
    );
  });
});
```

### Integration Tests
```typescript
describe('Event Approval Flow', () => {
  it('should trigger side effects via events', async () => {
    const events: IDomainEvent[] = [];
    
    eventBus.on('event.approved', async (event) => {
      events.push(event);
    });
    
    await eventsService.approve(eventId, orgId, UserRole.ADMIN);
    
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('event.approved');
  });
});
```

## Checking for Circular Dependencies

### Manual Check
```bash
# Check Auth → Events
grep -r "from '../events" src/modules/auth/

# Check Events → Auth
grep -r "from '../auth" src/modules/events/
```

### Automated Check
```bash
# Install madge
npm install -g madge

# Check for cycles
madge --circular --extensions ts src/

# Expected output: ✓ No circular dependencies found!
```

## Evolution Path

### Current: Modular Monolith
- Single deployment
- In-process events
- Shared database
- Simple operations

### Future: Microservices (if needed)
1. Replace EventBus with message queue (RabbitMQ, Kafka)
2. Extract module database schema
3. Deploy module independently
4. Add API gateway

The clean boundaries make this transition smooth.

## Best Practices

### 1. Keep Modules Independent
- No direct service calls between modules
- Use guards for authorization
- Use events for side effects

### 2. Small Public APIs
- Export only what's necessary
- Hide implementation details
- Clear contracts (DTOs)

### 3. Document Boundaries
- Clear responsibilities
- Dependency rules
- Communication patterns

### 4. Test Boundaries
- Unit test in isolation
- Integration test via events
- E2E test user flows

## Common Patterns

### Pattern 1: Authorization via Guards
```typescript
// ❌ Don't do this
class EventsService {
  constructor(private authService: AuthService) {}
  
  async update(id: string, userId: string) {
    const user = await this.authService.findUser(userId);
    if (!this.authService.canUpdate(user)) throw ForbiddenException();
  }
}

//  Do this
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async update(id: string, @CurrentUser() user: User) {
  // Authorization already checked
}
```

### Pattern 2: Side Effects via Events
```typescript
// ❌ Don't do this
class EventsService {
  constructor(private notificationService: NotificationService) {}
  
  async approve(id: string) {
    const event = await this.updateStatus(id, 'APPROVED');
    await this.notificationService.send(event.createdById, 'approved');
  }
}

//  Do this
class EventsService {
  constructor(private eventBus: EventBusService) {}
  
  async approve(id: string) {
    const event = await this.updateStatus(id, 'APPROVED');
    await this.eventBus.publish(new EventApprovedEvent(event.id, {...}));
  }
}
```

## Definition of Done

 Domain event system implemented
 Events module publishes domain events
 Module boundaries enforced
 No circular dependencies
 Public APIs are small and clear
 Architecture documented
 Module boundaries documented
 Communication patterns documented
 Tests updated for event publishing

## Resources

- **Architecture Guide**: `docs/architecture.md`
- **Module Boundaries**: `docs/module-boundaries.md`
- **Event Bus**: `src/common/events/`
- **Domain Events**: `src/modules/events/events/`

Day 12 is complete! The application now has enforced module boundaries, domain events for decoupling, and comprehensive architecture documentation.
