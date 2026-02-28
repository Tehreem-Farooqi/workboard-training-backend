# Day 11 Setup: Testing + CI Gates

## Prerequisites
- Node.js and npm installed
- PostgreSQL running (via Docker)
- Database seeded with test data

## What's New

### 1. Unit Tests
- Events service tests (20+ tests)
- State transition tests
- Authorization tests

### 2. E2E Tests
- Critical flow test (complete lifecycle)
- 35+ total e2e tests

### 3. CI Pipeline
- GitHub Actions workflow
- Automated testing on push/PR
- Coverage enforcement

### 4. Test Scripts
- Enhanced test commands
- Coverage thresholds
- CI simulation

## Setup Steps

### 1. No code changes needed
All test files are already created.

### 2. Run unit tests
```powershell
npm test
```

Expected output:
```
PASS  src/modules/auth/auth.service.spec.ts
PASS  src/modules/events/events.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       30+ passed, 30+ total
```

### 3. Run unit tests with coverage
```powershell
npm run test:cov
```

Expected output:
```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   72.5  |   65.3   |   68.2  |   73.1  |
 auth                     |   89.2  |   78.5   |   85.0  |   90.1  |
  auth.service.ts         |   89.2  |   78.5   |   85.0  |   90.1  |
 events                   |   84.3  |   72.1   |   80.5  |   85.2  |
  events.service.ts       |   84.3  |   72.1   |   80.5  |   85.2  |
--------------------------|---------|----------|---------|---------|
```

### 4. Run e2e tests
```powershell
# Ensure database is running
docker compose up -d

# Run e2e tests
npm run test:e2e
```

Expected output:
```
PASS  test/auth-rbac.e2e-spec.ts
PASS  test/events.e2e-spec.ts
PASS  test/critical-flow.e2e-spec.ts

Test Suites: 3 passed, 3 total
Tests:       35+ passed, 35+ total
```

### 5. Run complete CI pipeline locally
```powershell
npm run ci
```

This runs:
1. Lint check
2. Unit tests with coverage
3. E2E tests
4. Build

## Testing Individual Components

### Test Auth Service
```powershell
npm test -- auth.service.spec
```

### Test Events Service
```powershell
npm test -- events.service.spec
```

### Test Critical Flow
```powershell
npm run test:e2e -- critical-flow.e2e-spec
```

## View Coverage Report

After running `npm run test:cov`:

```powershell
# Windows
start coverage/lcov-report/index.html

# Or navigate to
# monolith-api/coverage/lcov-report/index.html
```

## GitHub Actions Setup

### 1. Push to GitHub
```powershell
git add .
git commit -m "Add Day 11: Testing + CI"
git push origin main
```

### 2. View CI Pipeline
1. Go to GitHub repository
2. Click "Actions" tab
3. See workflow running

### 3. Configure Branch Protection (Optional)
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass"
4. Select required checks:
   - Lint
   - Unit Tests
   - E2E Tests
   - Build

## Test Scripts Reference

```powershell
# Unit Tests
npm test                    # Run all unit tests
npm run test:watch          # Run in watch mode
npm run test:cov            # Run with coverage
npm run test:debug          # Debug tests

# E2E Tests
npm run test:e2e            # Run all e2e tests
npm run test:e2e:watch      # Run in watch mode

# All Tests
npm run test:all            # Run unit + e2e with coverage

# CI Simulation
npm run ci                  # Run complete CI pipeline

# Linting
npm run lint                # Fix linting issues
npm run lint:check          # Check without fixing

# Formatting
npm run format              # Fix formatting
npm run format:check        # Check without fixing
```

## Troubleshooting

### Issue: Unit tests fail
```powershell
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose
```

### Issue: E2E tests timeout
```powershell
# Increase timeout in test/jest-e2e.json
# Already set to 30000ms (30 seconds)

# Check database is running
docker compose ps
```

### Issue: Coverage threshold not met
```powershell
# View detailed coverage
npm run test:cov

# Open HTML report
start coverage/lcov-report/index.html

# Add more tests or adjust thresholds in package.json
```

### Issue: Database connection error in e2e tests
```powershell
# Ensure database is running
docker compose up -d

# Check connection
docker compose exec postgres psql -U eventboard -d eventboard_db -c "SELECT 1;"

# Reset database
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Coverage Thresholds

Current thresholds (package.json):
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

**What's excluded**:
- DTOs (*.dto.ts)
- Modules (*.module.ts)
- Interfaces (*.interface.ts)
- Index files (index.ts)
- Config files (*.config.ts)
- Main entry point (main.ts)

## CI Pipeline Jobs

### 1. Lint (Fast)
- Duration: ~10 seconds
- Checks code style
- Fails on linting errors

### 2. Unit Tests (Fast)
- Duration: ~15 seconds
- Runs all unit tests
- Enforces coverage thresholds
- Uploads coverage to Codecov

### 3. E2E Tests (Slow)
- Duration: ~45 seconds
- Spins up PostgreSQL
- Runs migrations and seeds
- Tests complete flows

### 4. Build (Medium)
- Duration: ~20 seconds
- Compiles TypeScript
- Verifies build artifacts
- Uploads artifacts

### 5. Security (Fast)
- Duration: ~10 seconds
- Runs npm audit
- Informational only

### 6. All Checks (Gate)
- Verifies all jobs passed
- Blocks merge if any fail

## Test Data

E2E tests use seeded data:
- **Organizations**: ACME Corp, TechStart Inc
- **Users**:
  - admin@acme.com (ADMIN)
  - moderator@acme.com (MODERATOR)
  - user@acme.com (USER)
- **Password**: Password123!

## Verification Checklist

 Unit tests pass locally
 E2E tests pass locally
 Coverage meets thresholds (70%+ lines)
 Lint check passes
 Format check passes
 Build succeeds
 CI pipeline runs on GitHub
 All CI jobs pass

## Next Steps

After Day 11:
1. Push code to GitHub
2. Verify CI pipeline runs
3. Configure branch protection
4. Monitor test coverage
5. Add more tests as needed

## Common Test Patterns

### Unit Test Pattern
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockType;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(data);

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

### E2E Test Pattern
```typescript
describe('Feature (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    // Setup app
    // Login and get token
  });

  afterAll(async () => {
    await app.close();
  });

  it('should do something', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

## Definition of Done

 All unit tests pass
 All e2e tests pass
 Coverage thresholds met
 CI pipeline configured
 Tests are deterministic
 No flaky tests
 Documentation complete
