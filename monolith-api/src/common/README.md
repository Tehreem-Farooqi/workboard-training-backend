# Common Module

Cross-cutting concerns shared across all feature modules.

## Structure

- **filters/** - Exception filters for centralized error handling
- **guards/** - Authentication and authorization guards
- **interceptors/** - Request/response transformation, logging, caching
- **pipes/** - Custom validation and transformation pipes
- **decorators/** - Custom parameter decorators and metadata

## Planned Components (Day 7+)
- Global exception filter
- JWT auth guard
- Roles guard
- Logging interceptor
- Transform interceptor
- Custom validation pipes
- CurrentUser decorator
- Roles decorator
