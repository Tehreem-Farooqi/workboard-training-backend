# EventBoard Project Structure

## Root Directory Structure

```
E:\Backend\
├── docs/                           # All project documentation
│   ├── README.md                   # Documentation index
│   ├── day-01.md to day-14.md     # Daily development guides
│   ├── setup/                      # Setup guides for each day
│   │   ├── day-02-setup.md
│   │   ├── day-03-setup.md
│   │   ├── day-04-setup.md
│   │   ├── day-09-setup.md
│   │   ├── day-10-setup.md
│   │   ├── day-11-setup.md
│   │   ├── day-13-setup.md
│   │   └── day-14-setup.md
│   └── architecture/               # Architecture documentation
│       ├── architecture.md
│       ├── module-boundaries.md
│       ├── nest-lifecycle.md
│       ├── microservices-architecture.md
│       ├── microservices-quick-reference.md
│       └── testing-guide.md
│
├── test/                           # Test files
│   ├── day-06.http                # RBAC tests
│   ├── day-07.http                # Events CRUD tests
│   ├── day-08.http                # Moderation workflow tests
│   ├── day-09.http                # Advanced listing tests
│   ├── day-10.http                # Cross-cutting patterns tests
│   └── day-14.http                # Production features tests
│
├── ci/                             # CI/CD configuration
│   └── workflows/                  # GitHub Actions workflows
│       └── ci.yml                  # Main CI pipeline
│
├── monolith-api/                   # Monolith application (Days 1-12)
│   ├── src/
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/
│   │   │   ├── events/
│   │   │   ├── users/
│   │   │   └── orgs/
│   │   ├── common/                # Cross-cutting concerns
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── events/           # Domain events
│   │   ├── database/             # Database module
│   │   └── health/               # Health checks
│   ├── prisma/                   # Database schema & migrations
│   ├── test/                     # E2E tests
│   └── docs/                     # Legacy docs (kept for reference)
│
├── api-gateway/                    # API Gateway (Days 13-14)
│   ├── src/
│   │   ├── auth/                 # Auth routes
│   │   ├── events/               # Events routes
│   │   └── common/               # Interceptors, utils
│   │       ├── interceptors/
│   │       └── utils/
│   └── Dockerfile
│
├── auth-service/                   # Auth microservice (Days 13-14)
│   ├── src/
│   │   ├── auth/                 # Auth logic
│   │   └── prisma/               # Database client
│   ├── prisma/                   # Schema
│   └── Dockerfile
│
├── events-service/                 # Events microservice (Days 13-14)
│   ├── src/
│   │   ├── events/               # Events logic
│   │   ├── common/               # Idempotency service
│   │   └── prisma/               # Database client
│   ├── prisma/                   # Schema
│   └── Dockerfile
│
├── docker-compose.microservices.yml  # Microservices orchestration
├── README.md                         # Main project README
├── MICROSERVICES-README.md          # Microservices quick start
├── PRODUCTION-RUNBOOK.md            # Operations guide
├── DEMO-CHECKLIST.md                # Demo preparation
├── PROJECT-SUMMARY.md               # Complete project summary
└── PROJECT-STRUCTURE.md             # This file
```

## Documentation Organization

### Daily Guides (`/docs/day-*.md`)
Complete day-by-day development guides covering:
- Day 1-7: Monolith foundation
- Day 8-12: Advanced features
- Day 13-14: Microservices and production

### Setup Guides (`/docs/setup/`)
Step-by-step setup instructions for:
- Database configuration
- Logging setup
- Testing configuration
- Microservices deployment
- Production features

### Architecture Docs (`/docs/architecture/`)
System design and patterns:
- Overall architecture
- Module boundaries
- Request lifecycle
- Microservices design
- Testing strategies

## Test Organization

### HTTP Test Files (`/test/*.http`)
Manual API testing files for:
- Authentication and authorization
- Events CRUD operations
- Moderation workflows
- Advanced queries
- Production features

### E2E Tests (`/monolith-api/test/`)
Automated end-to-end tests:
- auth-rbac.e2e-spec.ts
- events.e2e-spec.ts
- critical-flow.e2e-spec.ts

### Unit Tests
Located alongside source files:
- auth.service.spec.ts
- events.service.spec.ts

## CI/CD Organization

### GitHub Actions (`/ci/workflows/`)
Automated pipelines:
- Linting
- Unit tests
- E2E tests
- Build verification
- Security scanning

## Service Organization

### Monolith (`/monolith-api/`)
Complete application with all features:
- Authentication
- Events management
- User management
- Organization management
- Moderation workflows

### Microservices
Three independent services:

1. **API Gateway** (`/api-gateway/`)
   - HTTP entry point
   - Request routing
   - JWT validation
   - Correlation IDs
   - Timeouts and retries

2. **Auth Service** (`/auth-service/`)
   - User authentication
   - JWT generation
   - Password management
   - TCP communication

3. **Events Service** (`/events-service/`)
   - Event CRUD
   - Workflow management
   - Idempotency handling
   - TCP communication

## Key Files

### Root Level
- `README.md` - Project overview and quick start
- `MICROSERVICES-README.md` - Microservices guide
- `PRODUCTION-RUNBOOK.md` - Operations manual
- `DEMO-CHECKLIST.md` - Demo preparation
- `PROJECT-SUMMARY.md` - Complete summary
- `PROJECT-STRUCTURE.md` - This file
- `docker-compose.microservices.yml` - Service orchestration

### Documentation
- `docs/README.md` - Documentation index
- `docs/day-01.md` to `docs/day-14.md` - Daily guides
- `docs/setup/*.md` - Setup instructions
- `docs/architecture/*.md` - Architecture docs

### Testing
- `test/*.http` - Manual API tests
- `monolith-api/test/*.spec.ts` - Automated tests

### CI/CD
- `ci/workflows/ci.yml` - GitHub Actions pipeline

## Navigation Guide

### For New Developers
1. Start with `README.md`
2. Read `docs/README.md` for documentation index
3. Follow `docs/day-01.md` through `docs/day-14.md`
4. Review `docs/architecture/` for system design

### For Operations
1. Read `PRODUCTION-RUNBOOK.md`
2. Review `MICROSERVICES-README.md`
3. Check `ci/workflows/` for CI/CD setup

### For Demos
1. Follow `DEMO-CHECKLIST.md`
2. Use `test/*.http` for manual testing
3. Reference `docs/architecture/microservices-quick-reference.md`

### For Testing
1. Review `docs/architecture/testing-guide.md`
2. Run tests in `monolith-api/test/`
3. Use `test/*.http` for manual verification

## File Naming Conventions

### Documentation
- `day-XX.md` - Daily development guide
- `day-XX-setup.md` - Setup instructions
- `day-XX-summary.md` - Day summary
- `*.md` - Markdown documentation

### Tests
- `*.e2e-spec.ts` - End-to-end tests
- `*.spec.ts` - Unit tests
- `day-XX.http` - HTTP test files

### Configuration
- `*.yml` - YAML configuration
- `*.json` - JSON configuration
- `Dockerfile` - Docker build instructions

## Maintenance

### Adding New Documentation
1. Create file in appropriate directory
2. Update `docs/README.md` index
3. Update main `README.md` if needed

### Adding New Tests
1. Create test file in `/test/` or service test directory
2. Follow naming convention
3. Update testing guide if needed

### Adding New Services
1. Create service directory at root
2. Add to `docker-compose.microservices.yml`
3. Update architecture documentation
4. Add to `MICROSERVICES-README.md`

## Benefits of This Structure

1. **Clear Separation**: Docs, tests, and CI are separate from code
2. **Easy Navigation**: Logical grouping by purpose
3. **Scalability**: Easy to add new services or documentation
4. **Discoverability**: Clear naming and organization
5. **Maintainability**: Related files grouped together
6. **Professional**: Industry-standard structure

## Migration Notes

Files were reorganized from:
- `monolith-api/docs/` → `/docs/`
- `monolith-api/test/*.http` → `/test/`
- `monolith-api/.github/` → `/ci/`

Original locations kept for backward compatibility during transition.
