# EventBoard API - Quick Start Guide

## 🚀 Complete Setup (Fresh Install)

### 1. Install Dependencies
```bash
cd monolith-api
npm install
```

### 2. Start PostgreSQL
```bash
docker-compose up -d
```

### 3. Setup Database
```bash
npm run db:setup
```

This runs:
- Prisma generate (creates client)
- Prisma migrate (creates tables)
- Prisma seed (adds test data)

### 4. Start Application
```bash
npm run start:dev
```

### 5. Verify
- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- Health: http://localhost:3000/health
- Prisma Studio: `npm run prisma:studio`

## 📋 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | Password123! | ADMIN |
| moderator@acme.com | Password123! | MODERATOR |
| user@acme.com | Password123! | USER |

## 🛠️ Common Commands

### Development
```bash
npm run start:dev          # Start in watch mode
npm run lint               # Lint code
npm run format             # Format code
npm run test               # Run tests
```

### Database
```bash
npm run db:setup           # Full setup (generate + migrate + seed)
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open database GUI
```

### Docker
```bash
docker-compose up -d       # Start PostgreSQL
docker-compose down        # Stop PostgreSQL
docker-compose down -v     # Stop and remove data
docker-compose logs -f     # View logs
```

## 📚 API Endpoints

### Health
- GET /health - Database health check
- GET /health/live - Liveness probe
- GET /health/ready - Readiness probe

### Sample
- GET / - Hello world
- POST /sample - Test validation

## 🔍 What's Implemented

### Day 1: Bootstrap
- ✅ NestJS setup with strict TypeScript
- ✅ ConfigModule with validation
- ✅ Health check endpoint
- ✅ Modular folder structure

### Day 2: Validation
- ✅ Global ValidationPipe
- ✅ Global Exception Filter
- ✅ Swagger documentation
- ✅ Sample DTO with validation

### Day 3: Logging
- ✅ Pino structured logger
- ✅ Request ID middleware
- ✅ Logging interceptor
- ✅ Liveness/Readiness probes

### Day 4: Database
- ✅ Docker Compose PostgreSQL
- ✅ Prisma ORM
- ✅ Migrations workflow
- ✅ Seed script
- ✅ Database health checks

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check Docker is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### Fresh Start
```bash
# Stop everything
docker-compose down -v

# Start fresh
docker-compose up -d
npm run db:setup
npm run start:dev
```

## 📖 Documentation

- [Day 1 Notes](docs/day-01.md)
- [Day 2 Notes](docs/day-02.md)
- [Day 3 Notes](docs/day-03.md)
- [Day 4 Notes](docs/day-04.md)
- [Main README](README.md)

## 🎯 Next Steps

Day 5 will implement:
- Auth module (signup/login)
- JWT tokens
- Password hashing
- Auth guards
- Protected routes
