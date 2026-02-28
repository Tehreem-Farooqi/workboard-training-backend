# Day 13 Setup: Microservices Split + API Gateway

## Prerequisites
- Node.js 20.x
- Docker Desktop installed and running
- PostgreSQL (via Docker)
- Monolith from Days 1-12 completed

## Project Structure

```
E:\Backend\
├── monolith-api/          # Original monolith (Days 1-12)
├── api-gateway/           # New: HTTP gateway
├── auth-service/          # New: Auth microservice
└── events-service/        # New: Events microservice
```

## Step-by-Step Setup

### Step 1: Create API Gateway

```powershell
cd E:\Backend
mkdir api-gateway
cd api-gateway

# Initialize project
npm init -y

# Install dependencies
npm install @nestjs/common@^11.0.1 @nestjs/core@^11.0.1 @nestjs/platform-express@^11.0.1 @nestjs/microservices@^11.0.1 @nestjs/jwt@^11.0.2 @nestjs/passport@^11.0.5 passport passport-jwt rxjs@^7.8.1 reflect-metadata@^0.2.2 class-validator@^0.14.3 class-transformer@^0.5.1

# Install dev dependencies
npm install -D @nestjs/cli@^11.0.0 typescript@^5.7.3 @types/node@^22.10.7 @types/passport-jwt@^4.0.1 ts-node@^10.9.2

# Initialize TypeScript
npx tsc --init
```

### Step 2: Create Auth Service

```powershell
cd E:\Backend
mkdir auth-service
cd auth-service

# Initialize project
npm init -y

# Install dependencies
npm install @nestjs/common@^11.0.1 @nestjs/core@^11.0.1 @nestjs/microservices@^11.0.1 @nestjs/jwt@^11.0.2 @prisma/client@^5.22.0 bcrypt@^6.0.0 rxjs@^7.8.1 reflect-metadata@^0.2.2

# Install dev dependencies
npm install -D @nestjs/cli@^11.0.0 typescript@^5.7.3 @types/node@^22.10.7 @types/bcrypt@^6.0.0 prisma@^5.22.0 ts-node@^10.9.2

# Initialize TypeScript
npx tsc --init
```

### Step 3: Create Events Service

```powershell
cd E:\Backend
mkdir events-service
cd events-service

# Initialize project
npm init -y

# Install dependencies
npm install @nestjs/common@^11.0.1 @nestjs/core@^11.0.1 @nestjs/microservices@^11.0.1 @prisma/client@^5.22.0 rxjs@^7.8.1 reflect-metadata@^0.2.2 class-validator@^0.14.3 class-transformer@^0.5.1

# Install dev dependencies
npm install -D @nestjs/cli@^11.0.0 typescript@^5.7.3 @types/node@^22.10.7 prisma@^5.22.0 ts-node@^10.9.2

# Initialize TypeScript
npx tsc --init
```

### Step 4: Copy Files from Monolith

#### For Auth Service:
```powershell
# Copy auth module
Copy-Item -Recurse monolith-api/src/modules/auth auth-service/src/

# Copy database module
Copy-Item -Recurse monolith-api/src/database auth-service/src/

# Copy Prisma schema
Copy-Item -Recurse monolith-api/prisma auth-service/
```

#### For Events Service:
```powershell
# Copy events module
Copy-Item -Recurse monolith-api/src/modules/events events-service/src/

# Copy database module
Copy-Item -Recurse monolith-api/src/database events-service/src/

# Copy Prisma schema
Copy-Item -Recurse monolith-api/prisma events-service/
```

### Step 5: Create Docker Compose

Create `docker-compose.microservices.yml` in `E:\Backend\`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: eventboard-postgres
    environment:
      POSTGRES_USER: eventboard
      POSTGRES_PASSWORD: eventboard_dev_password
      POSTGRES_DB: eventboard_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eventboard"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build:
      context: ./auth-service
      dockerfile: Dockerfile
    container_name: eventboard-auth-service
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://eventboard:eventboard_dev_password@postgres:5432/eventboard_db
      JWT_SECRET: your-secret-key-change-in-production
      JWT_EXPIRY: 1h
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  events-service:
    build:
      context: ./events-service
      dockerfile: Dockerfile
    container_name: eventboard-events-service
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://eventboard:eventboard_dev_password@postgres:5432/eventboard_db
      PORT: 3002
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: eventboard-api-gateway
    ports:
      - "3000:3000"
    environment:
      AUTH_SERVICE_HOST: auth-service
      AUTH_SERVICE_PORT: 3001
      EVENTS_SERVICE_HOST: events-service
      EVENTS_SERVICE_PORT: 3002
      PORT: 3000
    depends_on:
      - auth-service
      - events-service
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 6: Create Dockerfiles

#### auth-service/Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

#### events-service/Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 3002

CMD ["node", "dist/main.js"]
```

#### api-gateway/Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## Running the Services

### Option 1: Run Locally (Development)

```powershell
# Terminal 1: Start PostgreSQL
cd E:\Backend\monolith-api
docker compose up -d

# Terminal 2: Auth Service
cd E:\Backend\auth-service
npm run start:dev

# Terminal 3: Events Service
cd E:\Backend\events-service
npm run start:dev

# Terminal 4: API Gateway
cd E:\Backend\api-gateway
npm run start:dev
```

### Option 2: Run with Docker Compose

```powershell
cd E:\Backend
docker-compose -f docker-compose.microservices.yml up --build
```

## Testing

### 1. Check Services Health

```powershell
# Auth Service
curl http://localhost:3001/health

# Events Service
curl http://localhost:3002/health

# API Gateway
curl http://localhost:3000/health
```

### 2. Test Login via Gateway

```powershell
curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@acme.com\",\"password\":\"Password123!\"}'
```

### 3. Test List Events via Gateway

```powershell
# Replace TOKEN with actual token from login
curl http://localhost:3000/events `
  -H "Authorization: Bearer TOKEN"
```

### 4. Test Create Event via Gateway

```powershell
curl -X POST http://localhost:3000/events `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Test Event\",\"description\":\"Test\",\"startDate\":\"2026-06-01T10:00:00Z\",\"endDate\":\"2026-06-01T16:00:00Z\"}'
```

## Troubleshooting

### Issue: Services can't connect to database
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

```powershell
docker ps | Select-String postgres
```

### Issue: Gateway can't connect to services
**Solution**: Check service ports and hosts

```powershell
# Check if services are listening
netstat -an | Select-String "3001|3002"
```

### Issue: Docker build fails
**Solution**: Ensure all dependencies are installed

```powershell
cd auth-service
npm install
npm run build
```

### Issue: Prisma client not generated
**Solution**: Generate Prisma client

```powershell
cd auth-service
npx prisma generate
```

## Verification Checklist

 PostgreSQL running on port 5432
 Auth Service running on port 3001
 Events Service running on port 3002
 API Gateway running on port 3000
 Login works via gateway (POST /auth/login)
 List events works via gateway (GET /events)
 Create event works via gateway (POST /events)
 Docker Compose builds successfully
 All services start without errors

## Architecture Diagram

```
Client (Browser/Postman)
         ↓ HTTP
    API Gateway :3000
         ↓ TCP
    ┌────┴────┐
    ↓         ↓
Auth :3001  Events :3002
    ↓         ↓
    └────┬────┘
         ↓
   PostgreSQL :5432
```

## Next Steps

1. Run database migrations in services
2. Test all endpoints via gateway
3. Add distributed tracing
4. Add service discovery
5. Add circuit breakers

## Common Commands

```powershell
# Start all services
docker-compose -f docker-compose.microservices.yml up

# Stop all services
docker-compose -f docker-compose.microservices.yml down

# Rebuild services
docker-compose -f docker-compose.microservices.yml up --build

# View logs
docker-compose -f docker-compose.microservices.yml logs -f

# View specific service logs
docker-compose -f docker-compose.microservices.yml logs -f api-gateway
```

## Definition of Done

 Three services created (gateway, auth, events)
 TCP transport configured
 Docker Compose configuration
 Services communicate successfully
 Login works end-to-end
 Events CRUD works end-to-end
 Smoke tests pass
 Documentation complete

Day 13 setup complete! You now have a working microservices architecture.
