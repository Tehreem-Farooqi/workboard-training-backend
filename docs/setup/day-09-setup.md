# Day 9 Setup: Listing with Filters, Sort, Pagination, Search

## Prerequisites
- Day 8 migration must be completed (rejectionReason field)
- App and database running

## Steps

### 1. Ensure Day 8 migration is applied
```powershell
npm run prisma:migrate
# When prompted, enter migration name: add_rejection_reason
```

### 2. Regenerate Prisma client
```powershell
npm run prisma:generate
```

### 3. Start the app
```powershell
npm run start:dev
```

### 4. Test the new listing endpoint

Open `test-day-09.http` and:

1. Login as admin to get token
2. Replace `YOUR_ADMIN_TOKEN_HERE` with the actual token
3. Test various query combinations:
   - Basic pagination
   - Sorting by different fields
   - Status filtering
   - Date range filtering
   - Search functionality
   - Combined filters

## Example Queries

### Basic pagination
```
GET http://localhost:3000/events?page=1&limit=5
```

### Sort by title
```
GET http://localhost:3000/events?sortBy=title&sortOrder=asc
```

### Filter by status
```
GET http://localhost:3000/events?status=APPROVED
```

### Search
```
GET http://localhost:3000/events?search=conference
```

### Date range
```
GET http://localhost:3000/events?startDateFrom=2026-03-01T00:00:00Z&startDateTo=2026-03-31T23:59:59Z
```

### Combined
```
GET http://localhost:3000/events?page=1&limit=10&sortBy=startDate&sortOrder=asc&status=DRAFT&search=event
```

## Expected Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Event Title",
      "description": "Description",
      "location": "Location",
      "startDate": "2026-03-15T10:00:00.000Z",
      "endDate": "2026-03-15T18:00:00.000Z",
      "status": "DRAFT",
      "rejectionReason": null,
      "organizationId": "uuid",
      "createdById": "uuid",
      "createdAt": "2026-02-28T10:00:00.000Z",
      "updatedAt": "2026-02-28T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

## Validation

Query parameters are validated:
- `page`: min 1
- `limit`: min 1, max 100
- `sortBy`: must be one of: createdAt, startDate, title, status
- `sortOrder`: must be: asc or desc
- `status`: must be valid EventStatus
- `startDateFrom/To`: must be valid ISO 8601 date strings

Invalid parameters return 400 Bad Request with validation details.

## Definition of Done

 Pagination works with page and limit
 Sorting works by all supported fields
 Status filtering works
 Date range filtering works
 Search works (case-insensitive)
 Combined filters work together
 Response includes pagination metadata
 Regular users see only their own events
 Moderators/admins see all org events
 Validation rejects invalid parameters
