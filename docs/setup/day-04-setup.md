# Day 4 Setup Instructions

## Prerequisites

- Docker Desktop installed and running
- Node.js and npm installed

## Step 1: Install Dependencies

```bash
cd monolith-api
npm install --save @prisma/client bcrypt
npm install --save-dev prisma @types/bcrypt
```

## Step 2: Initialize Prisma (if not done)

```bash
npx prisma init
```

This creates:
- `prisma/` directory
- `prisma/schema.prisma` file
- `.env` file with DATABASE_URL

## Step 3: Update .env File

Copy from `.env.example` or add:

```env
DATABASE_URL=postgresql://eventboard:eventboard_dev_password@localhost:5432/eventboard_db
```

## Step 4: Start PostgreSQL with Docker

```bash
docker-compose up -d
```

**Verify it's running**:
```bash
docker ps
```

You should see `eventboard-postgres` container running.

## Step 5: Run Database Setup

This single command does everything:

```bash
npm run db:setup
```

This runs:
1. `prisma generate` - Generates Prisma Client
2. `prisma migrate dev` - Creates and applies migrations
3. `prisma seed` - Seeds the database with test data

**Expected Output**:
```
✔ Generated Prisma Client
✔ Applied migration(s)
� Starting database seed...
 Organizations created
 Users created
 Events created

 Seed Summary:
Organizations: 2
Users: 4
Events: 3

 Test Credentials:
Admin: admin@acme.com / Password123!
Moderator: moderator@acme.com / Password123!
User: user@acme.com / Password123!
Tech User: user@techinnovators.com / Password123!
```

## Step 6: Verify Database (Optional)

Open Prisma Studio to browse the database:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

**Check**:
- Organizations table has 2 records
- Users table has 4 records
- Events table has 3 records

## Step 7: Start the Application

```bash
npm run start:dev
```

## Step 8: Test Database Connectivity

### Test 1: Health Check with Database
```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Test 2: Readiness Check
```bash
curl http://localhost:3000/health/ready
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T...",
  "checks": {
    "database": "connected",
    "memory": {...}
  },
  "message": "Application is ready to serve traffic"
}
```

### Test 3: Swagger UI
Open `http://localhost:3000/api`

Health endpoints should show database checks.

## Step 9: Verify Definition of Done

- [ ] Fresh setup: `npm run db:setup` works without errors
- [ ] Ready check validates DB connectivity (returns "connected")
- [ ] Org/User/Event tables exist (check Prisma Studio)
- [ ] Tables have proper indexes and constraints
- [ ] Seed data is created (4 users, 2 orgs, 3 events)

## What Was Implemented

### Files Created:
- `docker-compose.yml` - PostgreSQL container
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed script
- `src/database/prisma.service.ts` - Prisma service
- `src/database/database.module.ts` - Database module
- `docs/day-04.md` - Day 4 documentation

### Files Modified:
- `package.json` - Added Prisma scripts
- `.env.example` - Added DATABASE_URL
- `src/app.module.ts` - Added DatabaseModule
- `src/health/health.controller.ts` - Added DB health checks

### Database Schema:
- **Organization**: id, name, slug, timestamps
- **User**: id, email, passwordHash, firstName, lastName, role, organizationId, timestamps
- **Event**: id, title, description, location, startDate, endDate, status, organizationId, createdById, timestamps

### Enums:
- **UserRole**: USER, MODERATOR, ADMIN
- **EventStatus**: DRAFT, SUBMITTED, APPROVED, REJECTED

### Indexes:
- organizations.slug
- users.email
- users.organizationId
- events.organizationId
- events.createdById
- events.status
- events.startDate

## Useful Commands

### Database Management
```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio

# Full setup (generate + migrate + seed)
npm run db:setup
```

### Docker Commands
```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Commands
```bash
# Reset database (drop all data and re-migrate)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Troubleshooting

### Issue: "Can't reach database server"
**Solution**:
1. Check Docker is running: `docker ps`
2. Start PostgreSQL: `docker-compose up -d`
3. Check DATABASE_URL in `.env`
4. Wait a few seconds for PostgreSQL to start

### Issue: "Migration failed"
**Solution**:
1. Reset database: `npx prisma migrate reset`
2. Or recreate: `docker-compose down -v && docker-compose up -d && npm run db:setup`

### Issue: "Prisma Client not found"
**Solution**: Run `npm run prisma:generate`

### Issue: Port 5432 already in use
**Solution**:
1. Stop other PostgreSQL instances
2. Or change port in `docker-compose.yml` and `DATABASE_URL`

### Issue: Seed fails
**Solution**:
- Seed uses upsert, safe to run multiple times
- If still fails: `npx prisma migrate reset` and try again

## Test Credentials

After seeding, use these credentials for testing:

| Email | Password | Role | Organization |
|-------|----------|------|--------------|
| admin@acme.com | Password123! | ADMIN | Acme Corporation |
| moderator@acme.com | Password123! | MODERATOR | Acme Corporation |
| user@acme.com | Password123! | USER | Acme Corporation |
| user@techinnovators.com | Password123! | USER | Tech Innovators |

## Next Steps

After verifying Day 4 is complete, proceed to Day 5:
- Auth module implementation
- JWT token generation
- Signup/Login endpoints
- Password hashing with bcrypt
- Auth guards and decorators
