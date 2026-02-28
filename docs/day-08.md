# Day 8: Moderation Workflow (State Transitions)

## Overview
Implemented event moderation workflow with state transitions, approval/rejection logic, and rejection reasons.

## Event States

### DRAFT
- Initial state when event is created
- Only visible to creator
- Can be edited by creator
- Can be deleted by creator

### SUBMITTED
- Event submitted for review
- Visible to moderators and admins
- Cannot be edited
- Awaiting approval or rejection

### APPROVED
- Event approved by moderator or admin
- Visible to all users in organization
- Cannot be edited by regular users
- Can be edited by admins

### REJECTED
- Event rejected by moderator or admin
- Includes rejection reason
- Visible to creator
- Can be edited and resubmitted

## State Transitions

### Allowed Transitions

DRAFT → SUBMITTED (by event creator)
SUBMITTED → APPROVED (by moderator or admin)
SUBMITTED → REJECTED (by moderator or admin)

### Forbidden Transitions

All other transitions return 409 Conflict with clear error message.

## Endpoints

### POST /events/:id/submit
Submit event for review.

Requirements:
- User must be event creator
- Event must be in DRAFT status

Response: Event with SUBMITTED status

### POST /events/:id/approve
Approve submitted event.

Requirements:
- User must be moderator or admin
- Event must be in SUBMITTED status

Response: Event with APPROVED status

### POST /events/:id/reject
Reject submitted event.

Requirements:
- User must be moderator or admin
- Event must be in SUBMITTED status

Request:
```json
{
  "reason": "Event does not meet quality standards"
}
```

Response: Event with REJECTED status and rejection reason

## Database Changes

Added rejectionReason field to Event model:
```prisma
model Event {
  // ... existing fields
  rejectionReason String?
}
```

Migration required: `npm run prisma:migrate`

## Validation

### Submit Event
- Must be event creator
- Event must be in DRAFT status
- No additional data required

### Approve Event
- Must be moderator or admin
- Event must be in SUBMITTED status
- No additional data required

### Reject Event
- Must be moderator or admin
- Event must be in SUBMITTED status
- Reason required (10-500 characters)

## DTOs

### SubmitEventDto
Empty DTO (no body required)

### ApproveEventDto
Empty DTO (no body required)

### RejectEventDto
```typescript
{
  reason: string; // 10-500 characters
}
```

## Business Logic

### Submit Flow
1. Verify user is event creator
2. Verify event is in DRAFT status
3. Update status to SUBMITTED
4. Clear any previous rejection reason
5. Return updated event

### Approve Flow
1. Verify user is moderator or admin
2. Verify event is in SUBMITTED status
3. Update status to APPROVED
4. Clear rejection reason
5. Return updated event

### Reject Flow
1. Verify user is moderator or admin
2. Verify event is in SUBMITTED status
3. Validate rejection reason
4. Update status to REJECTED
5. Store rejection reason
6. Return updated event

## Error Responses

### 403 Forbidden
- User is not event creator (submit)
- User is not moderator/admin (approve/reject)

### 409 Conflict
- Invalid state transition
- Example: "Cannot submit event with status APPROVED"
- Example: "Cannot approve event with status DRAFT"

## Testing

Test file: test/day-08.http

Test scenarios:
- Submit draft event
- Approve submitted event
- Reject submitted event with reason
- Cannot submit non-draft event
- Cannot approve draft event
- Cannot reject without reason
- User cannot approve own event
- Moderator can approve any submitted event

## Files Created

- src/modules/events/dto/submit-event.dto.ts
- src/modules/events/dto/approve-event.dto.ts
- src/modules/events/dto/reject-event.dto.ts
- test/day-08.http

## Files Modified

- prisma/schema.prisma (added rejectionReason field)
- src/modules/events/events.service.ts (added workflow methods)
- src/modules/events/events.controller.ts (added workflow endpoints)

## Workflow Example

1. User creates event (DRAFT)
2. User edits event details
3. User submits event (DRAFT → SUBMITTED)
4. Moderator reviews event
5. Moderator approves (SUBMITTED → APPROVED)
   OR
   Moderator rejects with reason (SUBMITTED → REJECTED)
6. If rejected, user can edit and resubmit

## Next Steps

Day 9 will implement advanced listing features with filters, search, pagination, and sorting.
