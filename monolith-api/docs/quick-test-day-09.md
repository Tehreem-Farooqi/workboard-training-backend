# Quick Test - Day 9

## Start App
```powershell
docker compose up -d
npm run start:dev
```

## Get Token
```powershell
# Login as admin
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@acme.com\",\"password\":\"Password123!\"}"
```

## Test Queries

Replace `TOKEN` with your actual token from login.

### 1. Basic pagination
```powershell
curl http://localhost:3000/events?page=1&limit=5 -H "Authorization: Bearer TOKEN"
```

### 2. Sort by title
```powershell
curl "http://localhost:3000/events?sortBy=title&sortOrder=asc" -H "Authorization: Bearer TOKEN"
```

### 3. Filter by status
```powershell
curl "http://localhost:3000/events?status=DRAFT" -H "Authorization: Bearer TOKEN"
```

### 4. Search
```powershell
curl "http://localhost:3000/events?search=conference" -H "Authorization: Bearer TOKEN"
```

### 5. Date range
```powershell
curl "http://localhost:3000/events?startDateFrom=2026-03-01T00:00:00Z&startDateTo=2026-03-31T23:59:59Z" -H "Authorization: Bearer TOKEN"
```

### 6. Combined filters
```powershell
curl "http://localhost:3000/events?page=1&limit=10&sortBy=startDate&sortOrder=asc&status=DRAFT&search=event" -H "Authorization: Bearer TOKEN"
```

## Expected Response
```json
{
  "data": [...],
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

## Use test-day-09.http
Open `test-day-09.http` in VS Code with REST Client extension for easier testing.
