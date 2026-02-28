# EventBoard Documentation

Complete documentation for the EventBoard project covering 14 days of development from monolith to microservices.

## Daily Guides

### Week 1: Monolith Foundation
- [Day 1: Bootstrap NestJS](day-01.md) - Project setup, health checks, configuration
- [Day 2: DTOs, Validation, Swagger](day-02.md) - Input validation, API documentation
- [Day 3: Logging, Request IDs, Health Probes](day-03.md) - Structured logging, observability
- [Day 4: Database, Migrations, Seeds](day-04.md) - PostgreSQL, Prisma ORM, data seeding
- [Day 5: Authentication](day-05.md) - Signup, login, JWT tokens
- [Day 6: RBAC Authorization](day-06.md) - Role-based access control
- [Day 7: Events CRUD](day-07.md) - Event management with organization scoping

### Week 2: Advanced Features
- [Day 8: Moderation Workflow](day-08.md) - State transitions, approval/rejection
- [Day 9: Advanced Listing](day-09.md) - Filters, search, pagination, sorting
- [Day 10: Cross-cutting Patterns](day-10.md) - Interceptors, pipes, filters
- [Day 11: Testing + CI](day-11.md) - Unit tests, e2e tests, GitHub Actions
- [Day 12: Modular Monolith](day-12.md) - Domain events, module boundaries
- [Day 13: Microservices Split](day-13.md) - API Gateway, service separation
- [Day 14: Production Readiness](day-14.md) - Timeouts, retries, correlation IDs, idempotency

## Setup Guides

Located in `/docs/setup/`:
- Day 2 Setup - DTOs and validation configuration
- Day 3 Setup - Logging setup
- Day 4 Setup - Database and Prisma configuration
- Day 9 Setup - Query parameters setup
- Day 10 Setup - Interceptors and pipes
- Day 11 Setup - Testing configuration
- Day 13 Setup - Microservices deployment
- Day 14 Setup - Production features

## Architecture Documentation

Located in `/docs/architecture/`:
- [Architecture Overview](architecture/architecture.md) - System design and patterns
- [Module Boundaries](architecture/module-boundaries.md) - Modular monolith structure
- [NestJS Lifecycle](architecture/nest-lifecycle.md) - Request processing flow
- [Microservices Architecture](architecture/microservices-architecture.md) - Service design
- [Quick Reference](architecture/microservices-quick-reference.md) - Common commands
- [Testing Guide](architecture/testing-guide.md) - Testing strategies

## Test Files

Located in `/test/`:
- day-06.http - RBAC authorization tests
- day-07.http - Events CRUD tests
- day-08.http - Moderation workflow tests
- day-09.http - Advanced listing tests
- day-10.http - Cross-cutting patterns tests
- day-14.http - Production features tests

## CI/CD

Located in `/ci/`:
- GitHub Actions workflows for automated testing and deployment

## Quick Navigation

### By Topic

#### Authentication & Authorization
- [Day 5: Authentication](day-05.md)
- [Day 6: RBAC](day-06.md)

#### Database & ORM
- [Day 4: Database Setup](day-04.md)

#### API Development
- [Day 2: DTOs & Validation](day-02.md)
- [Day 7: Events CRUD](day-07.md)
- [Day 8: Moderation Workflow](day-08.md)
- [Day 9: Advanced Listing](day-09.md)

#### Observability
- [Day 3: Logging & Health](day-03.md)
- [Day 10: Cross-cutting Patterns](day-10.md)

#### Testing
- [Day 11: Testing + CI](day-11.md)
- [Testing Guide](architecture/testing-guide.md)

#### Architecture
- [Day 12: Modular Monolith](day-12.md)
- [Day 13: Microservices](day-13.md)
- [Architecture Overview](architecture/architecture.md)

#### Production
- [Day 14: Production Readiness](day-14.md)
- [Microservices Architecture](architecture/microservices-architecture.md)

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

## Getting Started

1. Read [Day 1](day-01.md) for initial setup
2. Follow days 2-12 for monolith development
3. Read [Day 13](day-13.md) for microservices migration
4. Review [Day 14](day-14.md) for production features

## Additional Resources

- [Main README](../README.md) - Project overview
- [Microservices Guide](MICROSERVICES-README.md) - Microservices quick start
- [Production Runbook](PRODUCTION-RUNBOOK.md) - Operations guide
- [Demo Checklist](DEMO-CHECKLIST.md) - Demo preparation
- [Project Summary](PROJECT-SUMMARY.md) - Complete summary
- [Project Structure](PROJECT-STRUCTURE.md) - Directory structure
