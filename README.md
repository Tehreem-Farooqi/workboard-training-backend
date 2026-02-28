# EventBoard - Event Management Platform

## What is EventBoard?

EventBoard is a **production-ready event management system** that demonstrates building a scalable backend application from a modular monolith to microservices architecture. It's a complete learning project covering 14 days of development, showcasing modern backend development practices with NestJS, TypeScript, and PostgreSQL.

### What Does It Do?

EventBoard allows organizations to:
- Create and manage events with approval workflows
- Control access with role-based permissions (Admin, Moderator, User)
- Submit events for review and approval
- Search and filter events with advanced queries
- Isolate data by organization (multi-tenant)

### Who Is This For?

- Backend developers learning NestJS and microservices
- Teams evaluating monolith vs microservices architecture
- Developers studying production-ready patterns (timeouts, retries, correlation IDs)
- Anyone building event management or approval workflow systems

## What's Inside?

This project includes:
- **Monolith Application** (Days 1-12): Complete event management system
- **Microservices** (Days 13-14): Split into API Gateway, Auth Service, and Events Service
- **Production Features**: Timeouts, retries, correlation IDs, idempotency
- **Complete Documentation**: 14 daily guides covering every step
- **Tests**: Unit tests, E2E tests, and HTTP test files
- **CI/CD**: GitHub Actions pipeline

## Quick Start (5 Minutes)

### Option 1: Microservices (Recommended)

**Prerequisites**: Docker Desktop installed and running

```bash
# 1. Clone or navigate to project
cd E:\Backend

# 2. Start all services (PostgreSQL, API Gateway, Auth Service, Events Service)
docker-compose -f docker-compose.microservices.yml up -d

# 3. Wait 30 seconds for services to start

# 4. Access the application
# - API: http://localhost:3000
# - Swagger Docs: http://localhost:3000/api
```

**Test it works:**
```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@acme.com\",\"password\":\"Password123!\"}"
```

That's it! The system is running with seeded data.

### Option 2: Monolith (For Development)

**Prerequisites**: Node.js 20.x, Docker Desktop

```bash
# 1. Navigate to monolith
cd monolith-api

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed test data
npm run prisma:seed

# 6. Start application
npm run start:dev

# 7. Access at http://localhost:3000
```

## What Can You Do With It?

### 1. User Management
- Signup new users
- Login with JWT authentication
- Role-based access (Admin, Moderator, User)

### 2. Event Management
- Create events (title, description, location, dates)
- List events with filters and search
- Update and delete events
- Organization-level isolation

### 3. Approval Workflow
- Submit events for review (Draft → Submitted)
- Approve events (Submitted → Approved)
- Reject events with reasons (Submitted → Rejected)

### 4. Advanced Features
- Pagination and sorting
- Search by title/description
- Filter by status and date range
- Idempotency for safe retries
- Request correlation across services

## Project Architecture

### Monolith (Days 1-12)
Single application with all features:
```
monolith-api/
├── src/modules/
│   ├── auth/      # Authentication
│   ├── events/    # Event management
│   ├── users/     # User management
│   └── orgs/      # Organizations
└── prisma/        # Database schema
```

### Microservices (Days 13-14)
Split into independent services:
```
API Gateway (Port 3000)
    ↓ HTTP
    ├─→ Auth Service (Port 3001) ─→ PostgreSQL
    └─→ Events Service (Port 3002) ─→ PostgreSQL
```

Each service can be scaled independently.

## Features

### Core Features
- Multi-tenant organization support
- JWT authentication
- Role-based access control (Admin, Moderator, User)
- Event CRUD operations
- Event approval workflow (Draft → Submitted → Approved/Rejected)
- Advanced filtering, search, and pagination
- Organization-level data isolation

### Production Features
- Request timeouts (5-10s)
- Retry with exponential backoff
- Correlation ID propagation (trace requests across services)
- Idempotency handling (prevent duplicate operations)
- Structured logging
- Health check endpoints
- Swagger API documentation
- Comprehensive error handling

## Technology Stack

- **Framework**: NestJS 11 (Node.js framework similar to Spring Boot)
- **Language**: TypeScript 5.7 (Typed JavaScript)
- **Database**: PostgreSQL 16 (Relational database)
- **ORM**: Prisma 5.22 (Database toolkit)
- **Authentication**: JWT + Passport (Token-based auth)
- **Validation**: class-validator (DTO validation)
- **Logging**: Pino (Structured logging)
- **Testing**: Jest (Unit and E2E tests)
- **Containerization**: Docker + Docker Compose
- **Transport**: TCP for microservices communication

## Project Structure

```
E:\Backend\
├── docs/                    # All documentation
│   ├── day-01.md to day-14.md
│   ├── setup/              # Setup guides
│   └── architecture/       # Architecture docs
├── test/                   # Test files
│   └── *.http             # HTTP test files
├── ci/                     # CI/CD configuration
│   └── workflows/         # GitHub Actions
├── monolith-api/          # Monolith application
├── api-gateway/           # API Gateway service
├── auth-service/          # Auth microservice
└── events-service/        # Events microservice
```

See [PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for complete structure details.

## Learning Path

This project is organized as a 14-day learning journey:

**Week 1: Building the Monolith**
- Day 1-4: Setup, validation, logging, database
- Day 5-7: Authentication, authorization, CRUD operations
  
**Week 2: Advanced Features & Microservices**
- Day 8-10: Workflows, advanced queries, patterns
- Day 11-12: Testing, CI/CD, modular architecture
- Day 13-14: Microservices split, production features

Each day has complete documentation in [docs/](docs/).

## Documentation

### For Getting Started
- [Documentation Index](docs/README.md) - Start here for navigation
- [Microservices Guide](docs/MICROSERVICES-README.md) - Detailed microservices setup
- [Project Structure](docs/PROJECT-STRUCTURE.md) - Understanding the codebase

### For Learning
- [Day 1-14 Guides](docs/) - Step-by-step development guides
- [Architecture Docs](docs/architecture/) - System design and patterns
- [Testing Guide](docs/architecture/testing-guide.md) - Testing strategies

### For Operations
- [Production Runbook](docs/PRODUCTION-RUNBOOK.md) - Troubleshooting and operations
- [Demo Checklist](docs/DEMO-CHECKLIST.md) - Demo preparation guide

## API Examples

## Test Credentials (Pre-seeded)

The database comes with test users you can use immediately:

```
Admin (Full Access):
  Email: admin@acme.com
  Password: Password123!

Moderator (Can Approve/Reject):
  Email: moderator@acme.com
  Password: Password123!

Regular User:
  Email: user@acme.com
  Password: Password123!
```

## API Examples

### 1. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!"}'

# Response: { "user": {...}, "accessToken": "eyJhbG..." }
# Copy the accessToken for next requests
```

### 2. Create Event
```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Team Meeting",
    "description":"Monthly team sync meeting",
    "startDate":"2026-06-01T10:00:00Z",
    "endDate":"2026-06-01T11:00:00Z",
    "location":"Conference Room A"
  }'
```

### 3. List Events
```bash
curl "http://localhost:3000/events?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Submit Event for Approval
```bash
curl -X POST http://localhost:3000/events/EVENT_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Approve Event (as Moderator)
```bash
curl -X POST http://localhost:3000/events/EVENT_ID/approve \
  -H "Authorization: Bearer MODERATOR_TOKEN"
```

See [test/](test/) folder for more API examples.

## Development

Want to modify or extend the project? See detailed setup in [docs/](docs/).

### Run Tests
```bash
cd monolith-api
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### View Logs
```bash
# Microservices
docker-compose -f docker-compose.microservices.yml logs -f

# Filter by service
docker-compose logs -f api-gateway
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it eventboard-postgres psql -U eventboard -d eventboard_db

# Run migrations
cd monolith-api
npm run prisma:migrate

# Reset database
npm run prisma:migrate:reset
```

## Common Issues & Solutions

### "Port 3000 is already in use"
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# Restart database
docker-compose restart postgres
```

### "Services won't start"
```bash
# Check logs
docker-compose -f docker-compose.microservices.yml logs

# Rebuild everything
docker-compose -f docker-compose.microservices.yml down -v
docker-compose -f docker-compose.microservices.yml up --build
```

See [Production Runbook](docs/PRODUCTION-RUNBOOK.md) for more troubleshooting.

## Testing Before GitHub

Before pushing to GitHub, run the quick test:

```powershell
# Run automated test script
.\quick-test.ps1
```

Or follow the detailed checklist:
- [Pre-GitHub Checklist](docs/PRE-GITHUB-CHECKLIST.md) - Complete testing guide
- [GitHub Setup Guide](docs/GITHUB-SETUP.md) - Step-by-step GitHub setup

## Next Steps

After setup:
1. Explore the API with Swagger: http://localhost:3000/api
2. Try the test credentials to login
3. Create, submit, and approve events
4. Read [Day 1 Guide](docs/day-01.md) to understand the architecture
5. Check [test/](test/) folder for more API examples

## Support & Contributing

- **Issues**: Check [docs/](docs/) for documentation
- **Questions**: Review [Production Runbook](docs/PRODUCTION-RUNBOOK.md)
- **Contributing**: Fork, create feature branch, submit PR

## License

UNLICENSED - Private learning project
