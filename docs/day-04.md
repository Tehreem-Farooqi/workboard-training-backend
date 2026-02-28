# Day 4: Database, Migrations, Seeds

**Date**: February 16, 2026  
**Status**:  Complete

##  Goals

- Add Docker Compose for PostgreSQL
- Add Prisma ORM and migration workflow
- Create Organization and User schema with constraints
- Create seed script for local dev users

##  Definition of Done

- [x] Fresh setup: migrate + seed works
- [x] Ready check validates DB connectivity
- [x] Org/User tables exist with indexes/constraints

##  What Was Built

### 1. Dependencies Installed

```bash
npm install --save @prisma/client bcrypt
npm install --save-dev prisma @types/bcrypt
npx prisma init
```

### 2. Docker Compose for PostgreSQL

**File**: `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: eventboard
      POSTGRES_PASSWORD: eventboard_dev_password
      POSTGRES_DB: eventboard_db
```

**Features**:
- PostgreSQL 16 Alpine (lightweight)
- Persistent volume for data
- Health check for container readiness
- Exposed on port 5432

### 3. Prisma Schema

**File**: `prisma/schema.prisma`

#### Organization Model
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users  User[]
  events Event[]

  @@index([slug])
}
```

**Constraints**:
- UUID primary key
- Unique slug for URL-friendly identifiers
- Index on slug for fast lookups
- Cascade delete to users and events

#### User Model
```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  firstName      String
  lastName       String
  role           UserRole @default(USER)
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(...)
  events       Event[]

  @@index([email])
  @@index([organizationId])
}
```

**Constraints**:
- UUID primary key
- Unique email
- Foreign key to Organization (cascade delete)
- Indexes on email and organizationId
- Role enum (USER, MODERATOR, ADMIN)

#### Event Model
```prisma
model Event {
  id             String      @id @default(uuid())
  title          String
  description    String
  location       String?
  startDate      DateTime
  endDate        DateTime
  status         EventStatus @default(DRAFT)
  organizationId String
  createdById    String
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  organization Organization @relation(...)
  createdBy    User         @relation(...)

  @@index([organizationId])
  @@index([createdById])
  @@index([status])
  @@index([startDate])
}
```

**Constraints**:
- UUID primary key
- Foreign keys to Organization and User (cascade delete)
- Indexes on organizationId, createdById, status, startDate
- Status enum (DRAFT, SUBMITTED, APPROVED, REJECTED)

### 4. Prisma Service

**File**: `src/database/prisma.service.ts`

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Features**:
- Extends PrismaClient for full type safety
- Auto-connects on module init
- Auto-disconnects on module destroy
- Global module for app-wide access

### 5. Database Module

**File**: `src/database/database.module.ts`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**Features**:
- Global module (available everywhere)
- Exports PrismaService for injection

### 6. Seed Script

**File**: `prisma/seed.ts`

Creates:
- 2 Organizations (Acme Corp, Tech Innovators)
- 4 Users (Admin, Moderator, User, Tech User)
- 3 Events (Conference, Workshop, Summit)

**Test Credentials**:
```
Admin: admin@acme.com / Password123!
Moderator: moderator@acme.com / Password123!
User: user@acme.com / Password123!
Tech User: user@techinnovators.com / Password123!
```

### 7. Updated Health Check

**File**: `src/health/health.controller.ts`

#### GET /health
Now includes database health check using Terminus

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

#### GET /health/ready
Now validates actual database connectivity

```typescript
await this.prisma.$queryRaw`SELECT 1`;
```

Returns:
```json
{
  "status": "ok",
  "checks": {
    "database": "connected",
    "memory": {...}
  }
}
```

### 8. NPM Scripts

**File**: `package.json`

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:seed": "ts-node prisma/seed.ts",
  "prisma:studio": "prisma studio",
  "db:setup": "npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed"
}
```

### 9. Environment Variables

**File**: `.env.example`

```env
DATABASE_URL=postgresql://eventboard:eventboard_dev_password@localhost:5432/eventboard_db
```

##  Testing

### Step 1: Start PostgreSQL

```bash
docker-compose up -d
```

**Verify**:
```bash
docker ps
```

Should show `eventboard-postgres` running

### Step 2: Run Migrations

```bash
npm run prisma:migrate
```

**Expected Output**:
```
✔ Generated Prisma Client
✔ Applied migration(s)
```

### Step 3: Run Seed

```bash
npm run prisma:seed
```

**Expected Output**:
```
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
...
```

### Step 4: Verify Database

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

**Verify**:
- Organizations table has 2 records
- Users table has 4 records
- Events table has 3 records

### Step 5: Test Health Endpoints

```bash
# Start the app
npm run start:dev

# Test health check
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
  }
}
```

```bash
# Test readiness
curl http://localhost:3000/health/ready
```

**Expected Response**:
```json
{
  "status": "ok",
  "checks": {
    "database": "connected",
    "memory": {...}
  }
}
```

### Step 6: Fresh Setup Test

```bash
# Stop and remove database
docker-compose down -v

# Start fresh
docker-compose up -d

# Run full setup
npm run db:setup
```

**Expected**: All migrations and seeds run successfully

##  Database Schema

### Entity Relationship Diagram

```
Organization (1) ──< (N) User
Organization (1) ──< (N) Event
User (1) ──< (N) Event (as creator)
```

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| organizations | slug | Fast lookup by slug |
| users | email | Fast lookup by email |
| users | organizationId | Fast org user queries |
| events | organizationId | Fast org event queries |
| events | createdById | Fast user event queries |
| events | status | Filter by status |
| events | startDate | Sort/filter by date |

### Constraints

| Table | Constraint | Type |
|-------|-----------|------|
| organizations | slug | UNIQUE |
| users | email | UNIQUE |
| users | organizationId | FOREIGN KEY (CASCADE) |
| events | organizationId | FOREIGN KEY (CASCADE) |
| events | createdById | FOREIGN KEY (CASCADE) |

## � Key Learnings

### Prisma vs TypeORM

| Feature | Prisma | TypeORM |
|---------|--------|---------|
| Type Safety | Excellent | Good |
| Query Builder | Type-safe | String-based |
| Migrations | Declarative | Imperative |
| Performance | Faster | Good |
| Learning Curve | Easier | Steeper |

### Migration Workflow

1. **Development**: `prisma migrate dev`
   - Creates migration
   - Applies to database
   - Generates Prisma Client

2. **Production**: `prisma migrate deploy`
   - Only applies migrations
   - No interactive prompts
   - Safe for CI/CD

### Cascade Delete Strategy

All foreign keys use `onDelete: Cascade`:
- Delete Organization → deletes all Users and Events
- Delete User → deletes all their Events
- Ensures referential integrity
- Prevents orphaned records

### UUID vs Auto-increment

**Why UUIDs?**
- Globally unique (no collisions)
- Can generate client-side
- Better for distributed systems
- Harder to enumerate/guess
- Microservices-ready

**Trade-offs**:
- Larger storage (16 bytes vs 4 bytes)
- Slightly slower indexes
- Not human-readable

##  Best Practices Applied

1. **Indexes**: Added on all foreign keys and frequently queried fields
2. **Enums**: Used for role and status (type-safe, validated)
3. **Timestamps**: createdAt and updatedAt on all models
4. **Cascade Delete**: Maintains referential integrity
5. **Unique Constraints**: Prevents duplicate emails and slugs
6. **Seed Data**: Provides realistic test data
7. **Health Checks**: Validates database connectivity

##  Common Issues & Solutions

### Issue 1: "Can't reach database server"
**Solution**: 
- Ensure Docker is running
- Check `docker-compose up -d` succeeded
- Verify DATABASE_URL in .env

### Issue 2: "Migration failed"
**Solution**:
- Reset database: `npx prisma migrate reset`
- Or drop and recreate: `docker-compose down -v && docker-compose up -d`

### Issue 3: "Prisma Client not generated"
**Solution**: Run `npx prisma generate`

### Issue 4: Seed fails with "Unique constraint"
**Solution**: 
- Seed uses upsert (safe to run multiple times)
- Or reset: `npx prisma migrate reset`

##  References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
- [NestJS Prisma](https://docs.nestjs.com/recipes/prisma)

##  Next Steps (Day 5)

**Planned Tasks**:
1. Implement Auth module
2. JWT token generation and validation
3. Signup endpoint with password hashing
4. Login endpoint with JWT
5. Auth guard for protected routes
6. @CurrentUser decorator
7. Password validation rules

**Deliverables**:
- Working signup/login flow
- JWT authentication
- Protected endpoints
- Auth tests

## � Reflection

Day 4 established the data layer with Prisma and PostgreSQL. The schema is well-designed with proper indexes, constraints, and relationships. The migration workflow is production-ready, and the seed script provides realistic test data.

The health checks now validate actual database connectivity, making the readiness probe meaningful. Docker Compose makes local development easy - one command to start the database.

**What went well**:
- Prisma provides excellent type safety
- Migration workflow is smooth
- Seed script creates realistic data
- Health checks validate DB connectivity
- Docker Compose simplifies setup

**What to improve**:
- Consider adding soft deletes for audit trail
- Add database connection pooling config
- Consider adding created_by/updated_by audit fields
- Add database backup strategy for production

---

**Commit Message**:
```
feat(day-04): add database with Prisma and PostgreSQL

- Add Docker Compose for PostgreSQL 16
- Add Prisma ORM with schema for Org/User/Event
- Create database module with PrismaService
- Add migration workflow and NPM scripts
- Create seed script with test data
- Update health checks with DB connectivity validation
- Add indexes and constraints to schema
- Add comprehensive Day 4 documentation
```
