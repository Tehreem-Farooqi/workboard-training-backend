# EventBoard Production Runbook

## System Overview

EventBoard is a microservices-based event management platform consisting of:
- API Gateway (port 3000) - HTTP entry point
- Auth Service (port 3001) - Authentication and user management
- Events Service (port 3002) - Event CRUD and lifecycle
- PostgreSQL (port 5432) - Shared database

## Quick Start

### Start All Services
```bash
docker-compose -f docker-compose.microservices.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.microservices.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.microservices.yml logs -f

# Specific service
docker-compose -f docker-compose.microservices.yml logs -f api-gateway
```

### Check Service Health
```bash
curl http://localhost:3000/health  # Gateway
curl http://localhost:3001/health  # Auth (if health endpoint exists)
curl http://localhost:3002/health  # Events (if health endpoint exists)
```

## Service Details

### API Gateway
- **Port**: 3000
- **Type**: HTTP REST API
- **Dependencies**: Auth Service, Events Service
- **Timeout**: 5-10 seconds per request
- **Retry**: 1-3 attempts with exponential backoff

### Auth Service
- **Port**: 3001
- **Type**: TCP Microservice
- **Dependencies**: PostgreSQL
- **Operations**: signup, login, getMe, validateUser

### Events Service
- **Port**: 3002
- **Type**: TCP Microservice
- **Dependencies**: PostgreSQL
- **Operations**: create, findAll, findOne, update, delete, submit, approve, reject
- **Features**: Idempotency support

### PostgreSQL
- **Port**: 5432
- **Database**: eventboard_db
- **User**: eventboard
- **Password**: eventboard_dev_password

## Common Operations

### Database Migrations
```bash
cd auth-service  # or events-service
npm run prisma:migrate
```

### Seed Database
```bash
cd monolith-api
npm run prisma:seed
```

### Rebuild Services
```bash
docker-compose -f docker-compose.microservices.yml up --build
```

### Scale Services
```bash
docker-compose -f docker-compose.microservices.yml up -d --scale events-service=3
```

## Monitoring

### Check Service Status
```bash
docker-compose -f docker-compose.microservices.yml ps
```

### Resource Usage
```bash
docker stats
```

### Database Connections
```bash
docker exec -it eventboard-postgres psql -U eventboard -d eventboard_db -c "SELECT count(*) FROM pg_stat_activity;"
```

## Troubleshooting

### Service Won't Start

**Symptoms**: Container exits immediately

**Diagnosis**:
```bash
docker-compose -f docker-compose.microservices.yml logs [service-name]
```

**Common Causes**:
1. Port already in use
2. Database not ready
3. Missing dependencies
4. Configuration error

**Solutions**:
```bash
# Check ports
netstat -an | findstr "3000 3001 3002 5432"

# Restart database
docker-compose -f docker-compose.microservices.yml restart postgres

# Rebuild service
docker-compose -f docker-compose.microservices.yml up --build [service-name]
```

### Database Connection Failed

**Symptoms**: Services can't connect to database

**Diagnosis**:
```bash
docker-compose -f docker-compose.microservices.yml logs postgres
```

**Solutions**:
```bash
# Check database is running
docker ps | findstr postgres

# Check database health
docker exec -it eventboard-postgres pg_isready -U eventboard

# Restart database
docker-compose -f docker-compose.microservices.yml restart postgres

# Check DATABASE_URL in services
docker-compose -f docker-compose.microservices.yml config
```

### Gateway Can't Reach Services

**Symptoms**: 503 Service Unavailable or timeouts

**Diagnosis**:
```bash
# Check service status
docker-compose -f docker-compose.microservices.yml ps

# Check service logs
docker-compose -f docker-compose.microservices.yml logs auth-service
docker-compose -f docker-compose.microservices.yml logs events-service
```

**Solutions**:
```bash
# Restart services
docker-compose -f docker-compose.microservices.yml restart auth-service events-service

# Check network connectivity
docker exec -it eventboard-api-gateway ping auth-service
docker exec -it eventboard-api-gateway ping events-service
```

### Request Timeouts

**Symptoms**: 408 Request Timeout errors

**Diagnosis**:
```bash
# Check service logs for slow queries
docker-compose -f docker-compose.microservices.yml logs events-service | findstr "slow"

# Check database performance
docker exec -it eventboard-postgres psql -U eventboard -d eventboard_db -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

**Solutions**:
1. Increase timeout in gateway controllers
2. Optimize slow database queries
3. Add database indexes
4. Scale services horizontally

### Idempotency Issues

**Symptoms**: Duplicate operations despite idempotency key

**Diagnosis**:
```bash
# Check idempotency logs
docker-compose -f docker-compose.microservices.yml logs events-service | findstr "Idempotency"
```

**Solutions**:
1. Verify idempotency key is being sent
2. Check cache TTL hasn't expired
3. Restart service to clear cache (dev only)

### Correlation ID Missing

**Symptoms**: Can't trace requests across services

**Diagnosis**:
```bash
# Check if correlation ID is in logs
docker-compose -f docker-compose.microservices.yml logs | findstr "correlation"
```

**Solutions**:
1. Ensure `X-Correlation-ID` header is sent
2. Check CorrelationIdInterceptor is registered
3. Verify services are logging correlation IDs

## Performance Tuning

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_events_organization_id ON "Event"("organizationId");
CREATE INDEX idx_events_created_by_id ON "Event"("createdById");
CREATE INDEX idx_events_status ON "Event"("status");
CREATE INDEX idx_events_start_date ON "Event"("startDate");

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "Event" WHERE "organizationId" = 'org-id';
```

### Service Scaling
```bash
# Scale events service
docker-compose -f docker-compose.microservices.yml up -d --scale events-service=3

# Add load balancer (future)
```

### Connection Pooling
Configure in Prisma schema:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

## Security

### Change Default Passwords
```bash
# Update docker-compose.microservices.yml
POSTGRES_PASSWORD: your-secure-password
JWT_SECRET: your-secure-jwt-secret
```

### Enable HTTPS
```bash
# Add reverse proxy (nginx/traefik)
# Configure SSL certificates
# Update CORS settings
```

### Rate Limiting
```typescript
// Add to gateway main.ts
import rateLimit from 'express-rate-limit';

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
```

## Backup and Recovery

### Database Backup
```bash
# Backup
docker exec eventboard-postgres pg_dump -U eventboard eventboard_db > backup.sql

# Restore
docker exec -i eventboard-postgres psql -U eventboard eventboard_db < backup.sql
```

### Volume Backup
```bash
# Backup volume
docker run --rm -v eventboard_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v eventboard_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Deployment

### Development
```bash
docker-compose -f docker-compose.microservices.yml up
```

### Production
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to Kubernetes
kubectl apply -f k8s/
```

## Monitoring and Alerting

### Key Metrics to Monitor
- Request rate (requests/second)
- Error rate (errors/total requests)
- Response time (p50, p95, p99)
- Service availability (uptime %)
- Database connections
- Memory usage
- CPU usage

### Log Aggregation
```bash
# Forward logs to centralized system
docker-compose -f docker-compose.microservices.yml logs -f | tee -a /var/log/eventboard.log
```

### Health Checks
```bash
# Add to monitoring system
*/5 * * * * curl -f http://localhost:3000/health || alert
```

## Contact and Escalation

### On-Call Rotation
- Primary: [Contact Info]
- Secondary: [Contact Info]
- Manager: [Contact Info]

### Escalation Path
1. Check this runbook
2. Check service logs
3. Contact on-call engineer
4. Escalate to team lead
5. Escalate to manager

## Useful Commands

```bash
# View all containers
docker ps -a

# View all volumes
docker volume ls

# Clean up unused resources
docker system prune -a

# View network
docker network ls

# Inspect service
docker inspect eventboard-api-gateway

# Execute command in container
docker exec -it eventboard-api-gateway sh

# Copy files from container
docker cp eventboard-api-gateway:/app/logs ./logs

# View container resource usage
docker stats --no-stream
```

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-28 | Initial runbook | System |
| 2026-02-28 | Added Day 14 features | System |

## Additional Resources

- [Architecture Documentation](monolith-api/docs/architecture.md)
- [API Documentation](http://localhost:3000/api)
- [Microservices Quick Reference](monolith-api/docs/microservices-quick-reference.md)
- [Day 14 Documentation](monolith-api/docs/day-14.md)
