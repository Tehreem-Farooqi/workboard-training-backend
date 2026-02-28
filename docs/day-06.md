# Day 6: RBAC Authorization

## Overview
Implemented role-based access control (RBAC) with three roles: Admin, Moderator, and User. Added guards and decorators for protecting routes based on user roles.

## Roles

### USER
- Default role for new users
- Can manage own resources
- Limited access to system features

### MODERATOR
- Can review and moderate content
- Can approve/reject events
- Cannot delete resources

### ADMIN
- Full system access
- Can manage all resources
- Can perform all operations

## Features Implemented

### Roles Decorator
Custom decorator to specify required roles for routes:
```typescript
@Roles('ADMIN', 'MODERATOR')
```

### Roles Guard
Guard that checks if authenticated user has required role:
- Extracts user from request
- Compares user role with required roles
- Returns 403 Forbidden if unauthorized

### Public Decorator
Decorator to mark routes as public (skip authentication):
```typescript
@Public()
```

## Implementation

### Roles Decorator
```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### Roles Guard
- Implements CanActivate interface
- Uses Reflector to get required roles from metadata
- Checks if user role matches any required role
- Returns true if authorized, false otherwise

### Public Decorator
```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## Usage Examples

### Protect Route with Roles
```typescript
@Get('admin-only')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
async adminOnly() {
  return { message: 'Admin only endpoint' };
}
```

### Multiple Roles
```typescript
@Post('approve')
@Roles('ADMIN', 'MODERATOR')
@UseGuards(JwtAuthGuard, RolesGuard)
async approve() {
  return { message: 'Approved' };
}
```

### Public Route
```typescript
@Get('public')
@Public()
async publicRoute() {
  return { message: 'Public endpoint' };
}
```

## Testing

### E2E Tests
Created auth-rbac.e2e-spec.ts with 11 tests covering:
- Admin can access admin-only endpoint
- Moderator cannot access admin-only endpoint
- User cannot access admin-only endpoint
- Admin can access moderator endpoint
- Moderator can access moderator endpoint
- User cannot access moderator endpoint
- Unauthenticated returns 401
- Wrong role returns 403
- Public endpoints accessible without auth

All tests passing.

## HTTP Status Codes

### 401 Unauthorized
Returned when:
- No authentication token provided
- Invalid or expired token
- User not found

### 403 Forbidden
Returned when:
- Valid authentication but insufficient permissions
- User role does not match required roles

## Files Created

- src/common/decorators/roles.decorator.ts
- src/common/decorators/public.decorator.ts
- src/common/guards/roles.guard.ts
- test/auth-rbac.e2e-spec.ts
- test/day-06.http

## Global Configuration

Updated app.module.ts to apply guards globally:
```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
},
{
  provide: APP_GUARD,
  useClass: RolesGuard,
}
```

## Security Considerations

- Guards execute in order: Authentication then Authorization
- Always check authentication before authorization
- Use specific error messages for debugging
- Log authorization failures for security monitoring
- Roles are case-sensitive

## Next Steps

Day 7 will implement Events CRUD with organization scoping and ownership rules based on these roles.
