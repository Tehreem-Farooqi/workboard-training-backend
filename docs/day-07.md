# Day 7: Events CRUD (Organization-scoped + Ownership)

## Overview
Implemented full CRUD operations for events with organization-level isolation and role-based ownership rules.

## Features Implemented

### Event Model
- id: Unique identifier
- title: Event name
- description: Event details
- location: Event venue (optional)
- startDate: Event start time
- endDate: Event end time
- status: DRAFT, SUBMITTED, APPROVED, REJECTED
- organizationId: Organization owner
- createdById: User who created event
- timestamps: createdAt, updatedAt

### DTOs
- CreateEventDto: title, description, location, startDate, endDate
- UpdateEventDto: Partial of CreateEventDto
- EventResponseDto: Full event with relations

### Access Rules

#### USER Role
- Can create events in their organization
- Can view only their own events
- Can update only their own DRAFT events
- Can delete only their own DRAFT events

#### MODERATOR Role
- Can view all events in their organization
- Cannot update events they don't own
- Cannot delete any events

#### ADMIN Role
- Can view all events in their organization
- Can update any event in their organization
- Can delete any event in their organization

## Endpoints

### POST /events
Create new event.

Request:
```json
{
  "title": "Team Meeting",
  "description": "Monthly sync",
  "location": "Conference Room A",
  "startDate": "2026-06-01T10:00:00Z",
  "endDate": "2026-06-01T11:00:00Z"
}
```

Response: 201 Created with event object

### GET /events
List events (filtered by role and organization).

Query parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)

Response: Array of events

### GET /events/:id
Get single event by ID.

Response: Event object or 404 Not Found

### PATCH /events/:id
Update event.

Request:
```json
{
  "title": "Updated Title"
}
```

Response: Updated event object

### DELETE /events/:id
Delete event.

Response: 204 No Content

## Validation

### Date Validation
- startDate must be valid ISO date
- endDate must be valid ISO date
- endDate must be after startDate

### Field Validation
- title: Required, 3-200 characters
- description: Required, 10-2000 characters
- location: Optional, max 200 characters

### Business Rules
- Events are scoped to organization
- Users can only see events in their organization
- Status transitions enforced (implemented in Day 8)

## Organization Isolation

All queries automatically filter by organizationId:
```typescript
where: {
  organizationId: user.organizationId,
  // additional filters
}
```

This ensures complete data isolation between organizations.

## Ownership Checks

Before update/delete operations:
```typescript
if (userRole === 'USER') {
  if (event.createdById !== userId) {
    throw new ForbiddenException('You can only edit your own events');
  }
  if (event.status !== 'DRAFT') {
    throw new ForbiddenException('You can only edit draft events');
  }
}
```

## Testing

### E2E Tests
Created events.e2e-spec.ts with 13 tests covering:
- Create event as user
- List events (role-based filtering)
- Get event by ID
- Update own event
- Delete own event
- Cannot update others' events
- Cannot delete others' events
- Admin can update any event
- Admin can delete any event
- Moderator can view all events
- Validation errors

All tests passing.

## Files Created

- src/modules/events/events.service.ts
- src/modules/events/events.controller.ts
- src/modules/events/events.module.ts
- src/modules/events/dto/create-event.dto.ts
- src/modules/events/dto/update-event.dto.ts
- src/modules/events/dto/event-response.dto.ts
- src/modules/events/dto/index.ts
- test/events.e2e-spec.ts
- test/day-07.http

## Error Handling

### 400 Bad Request
- Invalid date format
- End date before start date
- Validation errors

### 403 Forbidden
- Attempting to access another organization's event
- Attempting to update/delete event without permission
- Attempting to update non-draft event as user

### 404 Not Found
- Event ID does not exist
- Event exists but in different organization

## Next Steps

Day 8 will implement the moderation workflow with state transitions (submit, approve, reject).
