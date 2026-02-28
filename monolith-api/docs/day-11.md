# Day 11: Testing + CI Gates

## Overview
Implemented comprehensive testing strategy with unit tests, e2e tests, and CI/CD pipeline to ensure code quality and prevent regressions.

## Features Implemented

### 1. Unit Tests

#### Auth Service Tests (Existing)
- **Location**: `src/modules/auth/auth.service.spec.ts`
- **Coverage**: 10 tests
- **Scenarios**:
  - Signup: success, duplicate user, invalid organization
  - Login: success, user not found, invalid password
  - Get me: success, user not found
  - Validate user: success, unauthorized

#### Events Service Tests (New)
- **Location**: `src/modules/events/events.service.spec.ts`
- **Coverage**: 20+ tests
- **Scenarios**:
  - Create: success, invalid dates
  - FindAll: user scope, moderator scope, admin scope
  - State transitions: submit, approve, reject
  - Update: owner permissions, role-based access
  - Delete: owner permissions, role restrictions

**Key Test Patterns**:
```typescript
describe('State Transitions', () => {
  describe('submit', () => {
    it('should submit draft event successfully', async () => {
      // Arrange
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);
      
      // Act
      const result = await service.submit(eventId, orgId, userId);
      
      // Assert
      expect(result.status).toBe(EventStatus.SUBMITTED);
    });
  });
});
```

### 2. E2E Tests

#### Existing E2E Tests
- **Events E2E**: `test/events.e2e-spec.ts` (13 tests)
- **Auth RBAC E2E**: `test/auth-rbac.e2e-spec.ts` (11 tests)

#### Critical Flow E2E (New)
- **Location**: `test/critical-flow.e2e-spec.ts`
- **Coverage**: Complete event lifecycle
- **Flow**:
  1. User signup
  2. Create draft event
  3. Update draft event
  4. Submit for review
  5. Moderator approves
  6. User views approved event
  7. Admin manages all events
  8. Alternative: Event rejection flow
  9. Pagination and filtering
  10. Security and authorization

**Test Structure**:
```typescript
describe('Critical Flow: Event Lifecycle (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let eventId: string;

  beforeAll(async () => {
    // Setup test app
    // Login users
  });

  describe('Step 1: User Signup', () => {
    it('should create a new user account', async () => {
      // Test signup flow
    });
  });

  describe('Step 2: User Creates Draft Event', () => {
    // Test event creation
  });

  // ... more steps
});
```

### 3. GitHub Actions CI Pipeline

**Location**: `.github/workflows/ci.yml`

**Jobs**:

#### 1. Lint
- Run ESLint
- Check code formatting with Prettier
- Fast feedback on code style

#### 2. Unit Tests
- Run all unit tests with coverage
- Upload coverage to Codecov
- Enforce coverage thresholds:
  - Branches: 60%
  - Functions: 60%
  - Lines: 70%
  - Statements: 70%

#### 3. E2E Tests
- Spin up PostgreSQL service
- Run database migrations
- Seed test data
- Execute e2e tests
- Upload test results

#### 4. Build
- Generate Prisma client
- Build TypeScript to JavaScript
- Verify build artifacts
- Upload build artifacts

#### 5. Security
- Run npm audit
- Check for vulnerabilities
- Continue on error (informational)

#### 6. All Checks
- Verify all required jobs passed
- Block merge if any job fails

**Workflow Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### 4. Coverage Thresholds

**Configuration** (package.json):
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 60,
      "functions": 60,
      "lines": 70,
      "statements": 70
    }
  }
}
```

**Rationale**:
- **70% lines/statements**: Core business logic covered
- **60% branches/functions**: Realistic for NestJS apps with guards/interceptors
- **Excludes**: DTOs, modules, config files, index files

### 5. Test Scripts

**Added Scripts**:
```json
{
  "format:check": "Check formatting without fixing",
  "lint:check": "Check linting without fixing",
  "test:e2e": "Run e2e tests sequentially",
  "test:e2e:watch": "Run e2e tests in watch mode",
  "test:all": "Run all tests with coverage",
  "ci": "Run complete CI pipeline locally"
}
```

## Test Organization

```
monolith-api/
├── src/
│   └── modules/
│       ├── auth/
│       │   └── auth.service.spec.ts (unit tests)
│       └── events/
│           └── events.service.spec.ts (unit tests)
└── test/
    ├── auth-rbac.e2e-spec.ts (e2e)
    ├── events.e2e-spec.ts (e2e)
    ├── critical-flow.e2e-spec.ts (e2e - critical path)
    └── jest-e2e.json (e2e config)
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch

# Debug tests
npm run test:debug
```

### E2E Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run in watch mode
npm run test:e2e:watch

# Run specific test file
npm run test:e2e -- critical-flow.e2e-spec.ts
```

### All Tests
```bash
# Run complete test suite
npm run test:all

# Run CI pipeline locally
npm run ci
```

## CI/CD Pipeline

### Local Testing
```bash
# Test what CI will run
npm run ci
```

### GitHub Actions
1. Push code or create PR
2. CI pipeline runs automatically
3. All checks must pass to merge
4. View results in GitHub Actions tab

### Required Checks
- ✅ Lint
- ✅ Unit Tests (with coverage)
- ✅ E2E Tests
- ✅ Build
- ⚠️ Security (informational)

## Test Best Practices

### 1. Unit Tests
- **Arrange-Act-Assert** pattern
- Mock external dependencies (Prisma, JWT)
- Test business logic, not framework
- One assertion per test (when possible)
- Clear test names describing behavior

### 2. E2E Tests
- Test complete user flows
- Use real database (test instance)
- Clean up after tests
- Run sequentially (--runInBand)
- Test authentication and authorization

### 3. Deterministic Tests
- No random data in assertions
- Use fixed timestamps when needed
- Clean database state between tests
- No flaky timeouts
- Proper async/await handling

### 4. Test Coverage
- Focus on business logic
- Don't test framework code
- Exclude DTOs and config
- Aim for meaningful coverage, not 100%

## Coverage Report

Run tests with coverage:
```bash
npm run test:cov
```

View HTML report:
```bash
open coverage/lcov-report/index.html
```

**Current Coverage** (estimated):
- Auth Service: ~90%
- Events Service: ~85%
- Overall: ~70-75%

## Debugging Tests

### Debug Unit Tests
```bash
npm run test:debug
```

Then attach debugger in VS Code:
1. Set breakpoints
2. Run "Attach to Node Process"
3. Select Jest process

### Debug E2E Tests
```bash
# Add debugger statement in test
debugger;

# Run with inspect
node --inspect-brk node_modules/.bin/jest --config ./test/jest-e2e.json --runInBand
```

## Common Issues

### Issue: E2E tests timeout
**Solution**: Increase timeout in jest-e2e.json
```json
{
  "testTimeout": 30000
}
```

### Issue: Database connection errors
**Solution**: Ensure PostgreSQL is running
```bash
docker compose up -d
```

### Issue: Tests fail in CI but pass locally
**Solution**: Check environment variables
- Ensure DATABASE_URL is set
- Verify JWT_SECRET is configured
- Check Node version matches

### Issue: Coverage threshold not met
**Solution**: Add more tests or adjust thresholds
```bash
# See uncovered lines
npm run test:cov
open coverage/lcov-report/index.html
```

## CI Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Push / Pull Request                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                   ↓                   ↓
   ┌────────┐         ┌──────────┐        ┌─────────┐
   │  Lint  │         │   Unit   │        │Security │
   │        │         │  Tests   │        │  Audit  │
   └────┬───┘         └────┬─────┘        └────┬────┘
        │                  │                    │
        └──────────┬───────┴────────────────────┘
                   ↓
              ┌─────────┐
              │  Build  │
              └────┬────┘
                   ↓
              ┌─────────┐
              │   E2E   │
              │  Tests  │
              └────┬────┘
                   ↓
           ┌───────────────┐
           │  All Checks   │
           │    Passed?    │
           └───────┬───────┘
                   ↓
            ✅ Ready to Merge
```

## Test Metrics

### Unit Tests
- **Total**: 30+ tests
- **Duration**: ~5 seconds
- **Coverage**: 70-75%

### E2E Tests
- **Total**: 35+ tests
- **Duration**: ~30 seconds
- **Coverage**: Critical flows

### CI Pipeline
- **Total Duration**: ~3-5 minutes
- **Jobs**: 6 (lint, unit, e2e, build, security, all-checks)
- **Parallelization**: Lint, unit, security run in parallel

## Definition of Done

✅ Unit tests for auth service (10 tests)
✅ Unit tests for events service (20+ tests)
✅ E2E tests for critical flow (35+ tests)
✅ GitHub Actions workflow configured
✅ Coverage thresholds set (60-70%)
✅ All tests are deterministic
✅ CI is required for merge
✅ Tests run in CI successfully
✅ Build artifacts generated
✅ Security audit runs

## Next Steps

### Improve Coverage
- Add tests for controllers
- Add tests for guards and interceptors
- Add tests for pipes and filters

### Enhance CI
- Add deployment step
- Add Docker image build
- Add performance testing
- Add integration with staging

### Monitoring
- Track test execution time
- Monitor flaky tests
- Track coverage trends
- Alert on coverage drops
