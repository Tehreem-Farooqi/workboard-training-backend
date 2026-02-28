# Day 5: Authentication (Signup, Login, JWT, /me)

## Overview
Implemented user authentication with JWT tokens, password hashing, and user management endpoints.

## Features Implemented

### Authentication Service
- User signup with validation
- User login with credential verification
- Password hashing using bcrypt (10 rounds)
- JWT token generation with configurable expiry
- Get current user endpoint

### DTOs
- SignupDto: email, password, firstName, lastName, organizationId
- LoginDto: email, password

### JWT Strategy
- Passport JWT strategy for token validation
- Extract token from Authorization header
- Validate user exists in database

### Guards and Decorators
- JwtAuthGuard: Protect routes requiring authentication
- CurrentUser decorator: Extract user from request

## Endpoints

### POST /auth/signup
Create new user account.

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": "org-id"
}
```

Response:
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "organizationId": "org-id"
  },
  "accessToken": "jwt-token"
}
```

### POST /auth/login
Login with credentials.

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response:
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "jwt-token"
}
```

### GET /auth/me
Get current authenticated user.

Headers:
```
Authorization: Bearer jwt-token
```

Response:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "organizationId": "org-id",
  "organization": {
    "id": "org-id",
    "name": "Organization Name"
  }
}
```

## Security

### Password Hashing
- bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Secure comparison for login

### JWT Configuration
- Secret key from environment variable
- Configurable token expiry (default: 1 hour)
- Payload includes: userId, email, role, organizationId

### Validation
- Email format validation
- Password strength requirements
- Required field validation
- Organization existence check

## Testing

### Unit Tests
Created auth.service.spec.ts with 10 tests covering:
- Signup success
- Signup with existing email
- Signup with invalid organization
- Login success
- Login with invalid email
- Login with wrong password
- Get user profile
- Password hashing
- JWT token generation

All tests passing.

## Files Created

- src/modules/auth/auth.service.ts
- src/modules/auth/auth.controller.ts
- src/modules/auth/auth.module.ts
- src/modules/auth/dto/signup.dto.ts
- src/modules/auth/dto/login.dto.ts
- src/modules/auth/dto/index.ts
- src/modules/auth/strategies/jwt.strategy.ts
- src/modules/auth/guards/jwt-auth.guard.ts
- src/modules/auth/decorators/current-user.decorator.ts
- src/modules/auth/auth.service.spec.ts

## Configuration

Environment variables:
```
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=1h
```

## Next Steps

Day 6 will implement role-based authorization (RBAC) with Admin, Moderator, and User roles.
