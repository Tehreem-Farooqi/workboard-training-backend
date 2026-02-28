# Testing Guide

## Overview
This guide covers testing strategies, patterns, and best practices for the EventBoard Monolith API.

## Test Types

### 1. Unit Tests
- **Purpose**: Test individual components in isolation
- **Location**: `src/**/*.spec.ts`
- **Speed**: Fast (~5 seconds)
- **Dependencies**: Mocked

### 2. E2E Tests
- **Purpose**: Test complete user flows
- **Location**: `test/**/*.e2e-spec.ts`
- **Speed**: Slow (~30 seconds)
- **Dependencies**: Real (database)

### 3. Integration Tests
- **Purpose**: Test component interactions
- **Location**: Same as unit tests
- **Speed**: Medium
- **Dependencies**: Partially mocked

## Writing Unit Tests

### Basic Structure
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';
import { DependencyName } from './dependency-name';

describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyName;

  const mockDependency = {
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: DependencyName,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    dependency = module.get<DependencyName>(DependencyName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return expected result', async () => {
      // Arrange
      const input = { /* test data */ };
      const expected = { /* expected result */ };
      mockDependency.method.mockResolvedValue(expected);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expected);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    it('should throw error on failure', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Failed'));

      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow('Failed');
    });
  });
});
```

### Mocking Prisma
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};
```

### Mocking JWT Service
```typescript
const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};
```

### Testing Exceptions
```typescript
it('should throw NotFoundException', async () => {
  mockPrismaService.event.findUnique.mockResolvedValue(null);

  await expect(
    service.findOne(eventId, orgId, userId, role)
  ).rejects.toThrow(NotFoundException);
});

it('should throw ForbiddenException', async () => {
  mockPrismaService.event.findUnique.mockResolvedValue(event);

  await expect(
    service.update(eventId, dto, orgId, 'other-user', UserRole.USER)
  ).rejects.toThrow(ForbiddenException);
});
```

## Writing E2E Tests

### Basic Structure
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Feature (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Login to get token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'Password123!',
      })
      .expect(201);

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /endpoint', () => {
    it('should return data', async () => {
      const response = await request(app.getHttpServer())
        .get('/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/endpoint')
        .expect(401);
    });
  });
});
```

### Testing Authentication
```typescript
describe('Authentication', () => {
  it('should login successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user).toHaveProperty('id');
  });

  it('should reject invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@acme.com',
        password: 'WrongPassword',
      })
      .expect(401);
  });
});
```

### Testing Authorization
```typescript
describe('Authorization', () => {
  it('should allow admin access', async () => {
    await request(app.getHttpServer())
      .get('/admin-only')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should deny user access', async () => {
    await request(app.getHttpServer())
      .get('/admin-only')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
```

### Testing Validation
```typescript
describe('Validation', () => {
  it('should reject invalid input', async () => {
    const response = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '', // Invalid: empty
        description: 'x', // Invalid: too short
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toBeInstanceOf(Array);
  });
});
```

## Test Best Practices

### 1. Arrange-Act-Assert Pattern
```typescript
it('should do something', async () => {
  // Arrange: Setup test data and mocks
  const input = { id: '123' };
  mockService.method.mockResolvedValue(expected);

  // Act: Execute the code under test
  const result = await service.method(input);

  // Assert: Verify the result
  expect(result).toEqual(expected);
});
```

### 2. One Assertion Per Test
```typescript
// Good
it('should return user id', () => {
  expect(result.id).toBe('123');
});

it('should return user email', () => {
  expect(result.email).toBe('test@example.com');
});

// Avoid (unless related)
it('should return user data', () => {
  expect(result.id).toBe('123');
  expect(result.email).toBe('test@example.com');
  expect(result.role).toBe('USER');
});
```

### 3. Clear Test Names
```typescript
// Good
it('should throw NotFoundException when event does not exist', () => {});
it('should allow admin to delete any event', () => {});
it('should prevent user from editing submitted event', () => {});

// Avoid
it('should work', () => {});
it('test delete', () => {});
it('handles error', () => {});
```

### 4. Test Edge Cases
```typescript
describe('findAll', () => {
  it('should return empty array when no events exist', () => {});
  it('should return single event', () => {});
  it('should return multiple events', () => {});
  it('should handle pagination correctly', () => {});
  it('should filter by status', () => {});
});
```

### 5. Avoid Test Interdependence
```typescript
// Bad: Tests depend on execution order
let sharedEventId: string;

it('should create event', () => {
  sharedEventId = result.id; // Sets shared state
});

it('should update event', () => {
  // Depends on previous test
  await service.update(sharedEventId, dto);
});

// Good: Each test is independent
it('should create event', () => {
  const eventId = 'test-id-123';
  mockService.create.mockResolvedValue({ id: eventId });
  // Test logic
});

it('should update event', () => {
  const eventId = 'test-id-456';
  mockService.update.mockResolvedValue({ id: eventId });
  // Test logic
});
```

### 6. Clean Up After Tests
```typescript
afterEach(() => {
  jest.clearAllMocks(); // Clear mock call history
});

afterAll(async () => {
  await app.close(); // Close app in e2e tests
});
```

## Testing Async Code

### Promises
```typescript
it('should resolve promise', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

it('should reject promise', async () => {
  await expect(service.asyncMethod()).rejects.toThrow(Error);
});
```

### Callbacks
```typescript
it('should call callback', (done) => {
  service.methodWithCallback((error, result) => {
    expect(error).toBeNull();
    expect(result).toBeDefined();
    done();
  });
});
```

## Mocking Strategies

### Mock Return Values
```typescript
mockService.method.mockReturnValue(value);
mockService.method.mockResolvedValue(value); // For promises
mockService.method.mockRejectedValue(error); // For errors
```

### Mock Implementation
```typescript
mockService.method.mockImplementation((input) => {
  if (input.id === '123') {
    return { found: true };
  }
  return { found: false };
});
```

### Mock Once
```typescript
mockService.method
  .mockResolvedValueOnce(firstValue)
  .mockResolvedValueOnce(secondValue)
  .mockResolvedValue(defaultValue);
```

### Spy on Methods
```typescript
const spy = jest.spyOn(service, 'method');
await service.method(input);
expect(spy).toHaveBeenCalledWith(input);
spy.mockRestore();
```

## Coverage

### View Coverage
```bash
npm run test:cov
open coverage/lcov-report/index.html
```

### Exclude Files from Coverage
```json
{
  "collectCoverageFrom": [
    "**/*.(t|j)s",
    "!**/*.dto.ts",
    "!**/*.module.ts",
    "!**/index.ts"
  ]
}
```

### Coverage Thresholds
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

## Debugging Tests

### Debug in VS Code
1. Set breakpoint in test
2. Run: `npm run test:debug`
3. Attach debugger (F5)

### Debug E2E Tests
```bash
node --inspect-brk node_modules/.bin/jest --config ./test/jest-e2e.json --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
npm run test:e2e -- --verbose
```

### Run Single Test
```bash
npm test -- auth.service.spec
npm run test:e2e -- critical-flow.e2e-spec
```

### Run Single Test Case
```typescript
it.only('should run only this test', () => {});
```

## Common Patterns

### Testing State Transitions
```typescript
describe('State Transitions', () => {
  it('should transition from DRAFT to SUBMITTED', async () => {
    const draftEvent = { status: EventStatus.DRAFT };
    mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);
    mockPrismaService.event.update.mockResolvedValue({
      ...draftEvent,
      status: EventStatus.SUBMITTED,
    });

    const result = await service.submit(eventId, orgId, userId);

    expect(result.status).toBe(EventStatus.SUBMITTED);
  });

  it('should not allow invalid transition', async () => {
    const approvedEvent = { status: EventStatus.APPROVED };
    mockPrismaService.event.findUnique.mockResolvedValue(approvedEvent);

    await expect(
      service.submit(eventId, orgId, userId)
    ).rejects.toThrow(ConflictException);
  });
});
```

### Testing Permissions
```typescript
describe('Permissions', () => {
  it('should allow owner to update', async () => {
    const event = { createdById: userId };
    mockPrismaService.event.findUnique.mockResolvedValue(event);

    await expect(
      service.update(eventId, dto, orgId, userId, UserRole.USER)
    ).resolves.toBeDefined();
  });

  it('should deny non-owner', async () => {
    const event = { createdById: 'other-user' };
    mockPrismaService.event.findUnique.mockResolvedValue(event);

    await expect(
      service.update(eventId, dto, orgId, userId, UserRole.USER)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

### Testing Pagination
```typescript
describe('Pagination', () => {
  it('should return first page', async () => {
    const events = [event1, event2];
    mockPrismaService.event.findMany.mockResolvedValue(events);
    mockPrismaService.event.count.mockResolvedValue(10);

    const result = await service.findAllPaginated(
      { page: 1, limit: 2 },
      orgId,
      userId,
      role
    );

    expect(result.data).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.total).toBe(10);
    expect(result.meta.totalPages).toBe(5);
  });
});
```

## Continuous Improvement

### Monitor Test Performance
```bash
npm test -- --verbose --maxWorkers=1
```

### Identify Slow Tests
```bash
npm test -- --verbose | grep "PASS\|FAIL"
```

### Reduce Test Time
- Mock expensive operations
- Use test database with minimal data
- Run tests in parallel (when safe)
- Skip unnecessary setup

### Maintain Test Quality
- Review test coverage regularly
- Refactor tests with code
- Remove obsolete tests
- Add tests for bugs before fixing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
