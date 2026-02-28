# Day 9: Listing with Filters, Sort, Pagination, Search

## Overview
Enhanced the events listing endpoint with advanced query capabilities including filtering, sorting, pagination, and full-text search.

## Features Implemented

### 1. Pagination
- Page-based pagination with configurable page size
- Default: page=1, limit=10
- Max limit: 100 items per page
- Response includes metadata:
  - `page`: current page number
  - `limit`: items per page
  - `total`: total number of items
  - `totalPages`: total number of pages
  - `hasPrevious`: boolean indicating if previous page exists
  - `hasNext`: boolean indicating if next page exists

### 2. Sorting
Supports sorting by multiple fields:
- `createdAt`: when the event was created
- `startDate`: when the event starts (default)
- `title`: alphabetical by title
- `status`: by event status

Sort order:
- `asc`: ascending (default)
- `desc`: descending

### 3. Filtering
- `status`: filter by event status (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `startDateFrom`: events starting from this date (ISO 8601)
- `startDateTo`: events starting until this date (ISO 8601)

### 4. Search
- Full-text search across `title` and `description` fields
- Case-insensitive matching
- Uses PostgreSQL `ILIKE` operator

### 5. Authorization
- Regular users see only their own events (with all filters applied)
- Moderators and admins see all events in their organization

## API Endpoint

```
GET /events?page=1&limit=10&sortBy=startDate&sortOrder=asc&status=DRAFT&search=conference&startDateFrom=2026-03-01T00:00:00Z&startDateTo=2026-03-31T23:59:59Z
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (min: 1) |
| limit | number | No | 10 | Items per page (min: 1, max: 100) |
| sortBy | enum | No | startDate | Field to sort by (createdAt, startDate, title, status) |
| sortOrder | enum | No | asc | Sort order (asc, desc) |
| status | enum | No | - | Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED) |
| search | string | No | - | Search in title and description |
| startDateFrom | string | No | - | Filter events starting from this date (ISO 8601) |
| startDateTo | string | No | - | Filter events starting until this date (ISO 8601) |

### Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Event Title",
      "description": "Event description",
      "location": "Event location",
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

## Database Indexes

The following indexes support efficient querying:

```prisma
@@index([organizationId])  // Org scoping
@@index([createdById])     // User ownership
@@index([status])          // Status filtering
@@index([startDate])       // Date filtering and sorting
```

### Hot Paths
1. **List org events by date**: Uses `organizationId` + `startDate` indexes
2. **Filter by status**: Uses `organizationId` + `status` indexes
3. **User's own events**: Uses `organizationId` + `createdById` indexes
4. **Search queries**: Full table scan with `ILIKE` (consider adding full-text search index for production)

## Testing

Use `test-day-09.http` to test all query combinations:
- Basic pagination
- Sorting by different fields
- Status filtering
- Date range filtering
- Search functionality
- Combined filters
- Edge cases (invalid page, max limit, empty results)

## Implementation Details

### DTOs
- `QueryEventsDto`: Validates and transforms query parameters
- `PaginatedEventsDto`: Structures paginated response with metadata
- `EventSortField`: Enum for allowed sort fields
- `SortOrder`: Enum for sort direction

### Service Method
`findAllPaginated()` builds dynamic Prisma queries:
1. Base where clause for org scoping and user role
2. Apply filters (status, search, date range)
3. Apply sorting
4. Calculate pagination (skip/take)
5. Execute parallel queries for data and count
6. Return structured response with metadata

## Performance Considerations

1. **Indexes**: All filter and sort fields are indexed
2. **Parallel queries**: Data and count queries run in parallel
3. **Limit validation**: Max 100 items per page prevents large result sets
4. **Search optimization**: Consider adding PostgreSQL full-text search for production

## Next Steps

For production, consider:
- Adding full-text search index for better search performance
- Implementing cursor-based pagination for large datasets
- Adding caching for frequently accessed pages
- Monitoring slow queries and optimizing indexes
