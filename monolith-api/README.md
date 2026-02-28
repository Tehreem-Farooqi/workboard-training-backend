# EventBoard Monolith API

A production-ready NestJS backend for managing events with multi-tenant organization support, user authentication, and moderation workflows.

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x or higher
- npm 10.x or higher

### Installation

```bash
# Navigate to project directory
cd e:\Backend\monolith-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Health Check

Visit `http://localhost:3000/health` to verify the API is running.

### API Documentation

Visit `http://localhost:3000/api` to access the Swagger UI documentation.

## 📁 Project Structure

```
monolith-api/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication & authorization
│   │   ├── orgs/         # Organization management
│   │   ├── users/        # User management
│   │   ├── events/       # Event CRUD & workflows
│   │   └── moderation/   # Event moderation
│   ├── common/           # Cross-cutting concerns
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth & role guards
│   │   ├── interceptors/ # Logging, transformation
│   │   ├── pipes/        # Validation pipes
│   │   └── decorators/   # Custom decorators
│   ├── config/           # Configuration files
│   ├── health/           # Health check endpoint
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── test/                 # E2E tests
├── docs/                 # Documentation
└── prisma/               # Database schema (coming soon)
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start production build |
| `npm run build` | Build the application |
| `npm run lint` | Lint and fix code |
| `npm run lint:check` | Check linting without fixing |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without fixing |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:cov` | Generate test coverage |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:all` | Run all tests with coverage |
| `npm run ci` | Run complete CI pipeline locally |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with test data |
| `npm run db:setup` | Setup database (generate + migrate + seed) |

## 🔧 Configuration

Configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `PORT` | Server port | `3000` |
| `APP_NAME` | Application name | `EventBoard Monolith API` |

## 📚 Architecture

This is a **modular monolith** architecture:

- **Feature Modules**: Each domain (auth, orgs, users, events) is isolated in its own module
- **Shared Common**: Cross-cutting concerns are centralized in the `common` folder
- **Configuration**: Centralized, validated configuration using `@nestjs/config`
- **Validation**: Global validation pipes with DTOs using `class-validator`
- **Multi-tenant**: Organization-scoped data isolation (to be implemented)

## 🎯 Domain Model

### Core Entities
- **Organizations**: Multi-tenant containers
- **Users**: Authenticated users with roles (user, moderator, admin)
- **Events**: Organization-scoped events with status workflow
- **Moderation**: Approval/rejection workflow for events

### Event Lifecycle
```
draft → submitted → approved/rejected
```

## 📖 API Documentation

API documentation will be available via Swagger/OpenAPI (to be added in later days).

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Run CI pipeline locally
npm run ci
```

### Test Coverage

- **Unit Tests**: 30+ tests covering services and business logic
- **E2E Tests**: 35+ tests covering complete user flows
- **Coverage**: 70-75% (lines/statements)
- **Thresholds**: Enforced at 60-70% for branches/functions/lines

### Test Structure

```
monolith-api/
├── src/
│   └── **/*.spec.ts        # Unit tests (co-located with source)
└── test/
    ├── *.e2e-spec.ts       # E2E tests
    └── jest-e2e.json       # E2E configuration
```

See `docs/testing-guide.md` for comprehensive testing documentation.

## 🔐 Security Features (Planned)

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration
- Rate limiting

## 📝 Development Workflow

1. Create feature branch
2. Implement feature with tests
3. Run `npm run lint` and `npm run format`
4. Ensure tests pass
5. Commit with meaningful message
6. Create pull request

## 🏗️ Roadmap

### Phase 1: Foundation (Days 1-4)
- [x] Day 1: Project setup, health check
- [x] Day 2: DTOs, validation, and Swagger
- [x] Day 3: Logging, request IDs, health probes
- [x] Day 4: Database, migrations, seeds

### Phase 2: Authentication & Authorization (Days 5-6)
- [x] Day 5: Auth (signup, login, JWT, /me)
- [x] Day 6: RBAC authorization (roles/policies)

### Phase 3: Core Features (Days 7-9)
- [x] Day 7: Events CRUD (org-scoped + ownership)
- [x] Day 8: Moderation workflow (state transitions)
- [x] Day 9: Listing (filters, sort, pagination, search)

### Phase 4: Cross-cutting & Quality (Days 10-11)
- [x] Day 10: Cross-cutting patterns (interceptors, pipes, filters)
- [x] Day 11: Testing + CI gates

### Phase 5: Advanced Features (Days 12-14)
- [ ] Day 12: Caching & performance optimization
- [ ] Day 13: Background jobs & queues
- [ ] Day 14: Observability & monitoring

## 📄 License

UNLICENSED - Private project

## 👥 For .NET Developers

NestJS concepts mapped to .NET:

| NestJS | .NET Equivalent |
|--------|----------------|
| Controller | ASP.NET Controller |
| Provider (Service) | DI Service |
| Module | Feature boundary + DI registration |
| Guard | Authorization filter / policy |
| Pipe | Model binding + validation |
| Interceptor | Cross-cutting concerns (logging, caching) |
| Exception Filter | Exception handling middleware |

## 🆘 Support

For issues or questions, refer to:
- [NestJS Documentation](https://docs.nestjs.com)
- Project documentation in `/docs` folder
