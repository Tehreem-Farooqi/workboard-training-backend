# Microservices Quick Reference

## Service Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| API Gateway | 3000 | HTTP | Client entry point |
| Auth Service | 3001 | TCP | Authentication |
| Events Service | 3002 | TCP | Event management |
| PostgreSQL | 5432 | TCP | Database |

## Quick Commands

### Start Services (Docker)
```bash
docker-compose -f docker-compose.microservices.yml up
```

### Start Services (Local)
```bash
# Terminal 1
cd auth-service && npm run start:dev

# Terminal 2
cd events-service && npm run start:dev

# Terminal 3
cd api-gateway && npm run start:dev
```

### Stop Services
```bash
docker-compose -f docker-compose.microservices.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.microservices.yml logs -f
```

## API Endpoints

### Auth
```bash
# Login
POST http://localhost:3000/auth/login
Body: { "email": "admin@acme.com", "password": "Password123!" }

# Signup
POST http://localhost:3000/auth/signup
Body: { "email": "...", "password": "...", "firstName": "...", "lastName": "...", "organizationId": "..." }

# Get Me
GET http://localhost:3000/auth/me
Header: Authorization: Bearer {token}
```

### Events
```bash
# List Events
GET http://localhost:3000/events
Header: Authorization: Bearer {token}

# Create Event
POST http://localhost:3000/events
Header: Authorization: Bearer {token}
Body: { "title": "...", "description": "...", "startDate": "...", "endDate": "..." }

# Get Event
GET http://localhost:3000/events/{id}
Header: Authorization: Bearer {token}

# Update Event
PATCH http://localhost:3000/events/{id}
Header: Authorization: Bearer {token}
Body: { "title": "..." }

# Delete Event
DELETE http://localhost:3000/events/{id}
Header: Authorization: Bearer {token}

# Submit Event
POST http://localhost:3000/events/{id}/submit
Header: Authorization: Bearer {token}

# Approve Event
POST http://localhost:3000/events/{id}/approve
Header: Authorization: Bearer {token}

# Reject Event
POST http://localhost:3000/events/{id}/reject
Header: Authorization: Bearer {token}
Body: { "reason": "..." }
```

## Message Patterns

### Auth Service
```typescript
{ cmd: 'auth.signup' }
{ cmd: 'auth.login' }
{ cmd: 'auth.getMe' }
{ cmd: 'auth.validateUser' }
```

### Events Service
```typescript
{ cmd: 'events.create' }
{ cmd: 'events.findAll' }
{ cmd: 'events.findOne' }
{ cmd: 'events.update' }
{ cmd: 'events.delete' }
{ cmd: 'events.submit' }
{ cmd: 'events.approve' }
{ cmd: 'events.reject' }
```

## Health Checks

```bash
# Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Events Service
curl http://localhost:3002/health
```

## Environment Variables

### API Gateway
```
PORT=3000
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
EVENTS_SERVICE_HOST=localhost
EVENTS_SERVICE_PORT=3002
```

### Auth Service
```
PORT=3001
DATABASE_URL=postgresql://eventboard:eventboard_dev_password@localhost:5432/eventboard_db
JWT_SECRET=your-secret-key
JWT_EXPIRY=1h
```

### Events Service
```
PORT=3002
DATABASE_URL=postgresql://eventboard:eventboard_dev_password@localhost:5432/eventboard_db
```

## Troubleshooting

### Service won't start
```bash
# Check if port is in use
netstat -an | findstr "3000"

# Check logs
docker-compose -f docker-compose.microservices.yml logs {service-name}
```

### Can't connect to database
```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# Test connection
docker exec -it eventboard-postgres psql -U eventboard -d eventboard_db
```

### Gateway can't reach service
```bash
# Check if service is running
curl http://localhost:3001/health

# Check Docker network
docker network inspect backend_default
```

## Testing Flow

1. **Start services**
2. **Login to get token**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@acme.com","password":"Password123!"}'
   ```
3. **Use token for authenticated requests**
   ```bash
   curl http://localhost:3000/events \
     -H "Authorization: Bearer {token}"
   ```

## Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────┐
│ API Gateway │ :3000
└──────┬──────┘
       │ TCP
   ┌───┴───┐
   ↓       ↓
┌──────┐ ┌──────┐
│ Auth │ │Events│
│:3001 │ │:3002 │
└───┬──┘ └───┬──┘
    └────┬───┘
         ↓
    ┌─────────┐
    │PostgreSQL│ :5432
    └─────────┘
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process or change port |
| Database connection failed | Check DATABASE_URL |
| Service timeout | Increase timeout or check service health |
| JWT invalid | Check JWT_SECRET matches |
| CORS error | Configure CORS in gateway |

## Development Workflow

1. Make changes to service code
2. Service auto-reloads (if using `start:dev`)
3. Test via gateway
4. Check logs for errors
5. Iterate

## Production Checklist

- [ ] Use environment-specific configs
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Add distributed tracing
- [ ] Add monitoring
- [ ] Add circuit breakers
- [ ] Use service discovery
- [ ] Split databases per service
- [ ] Add message queue
- [ ] Deploy to Kubernetes

## Useful Links

- **NestJS Microservices**: https://docs.nestjs.com/microservices/basics
- **Docker Compose**: https://docs.docker.com/compose/
- **TCP Transport**: https://docs.nestjs.com/microservices/tcp
