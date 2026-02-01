# Copilot Instructions for Habit Tracker

## Project Architecture

This is a **monorepo** with three workspaces: `backend`, `frontend`, and `shared`. The entire stack runs in Docker containers for consistent development and easy deployment.

### Backend (Express + Prisma + PostgreSQL)

- **Entry point**: [backend/src/server.ts](backend/src/server.ts) - Express app with modular route structure
- **Database**: Prisma ORM with PostgreSQL. Schema at [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- **Auth pattern**: JWT-based. Use `AuthRequest` interface (extends Express `Request`) for authenticated routes. Token extracted in [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
- **API response format**: ALL endpoints return `{ success: boolean, data?: T, error?: {...} }` structure (see [shared/src/types/api.ts](shared/src/types/api.ts))

### Frontend (React + TypeScript + Tailwind)

- **State management**: Zustand with persist middleware for auth (see [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts))
- **API client**: Axios instance at [frontend/src/services/api.ts](frontend/src/services/api.ts) with interceptors for auth token injection and 401 handling
- **Routing**: React Router v6 with protected routes via `Layout` component wrapping authenticated pages
- **Data fetching**: React Query (`@tanstack/react-query`) for server state

### Shared Package

Contains TypeScript types used by both frontend and backend (e.g., `ApiResponse`, `PaginationParams`). Import from `shared/src/types/api.ts`.

## Development Workflows

### Docker-Based Development (Recommended)

**Prerequisites**: Docker and Docker Compose installed

```bash
# Start entire stack (backend, frontend, postgres)
docker-compose -f docker-compose.dev.yml up

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service-name]

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

**Services**:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432` (internal to Docker network)

### Database Changes (Inside Docker)

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Generate Prisma Client
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts

# Access PostgreSQL directly
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres habit_tracker
```

**Critical**: After ANY schema.prisma changes, ALWAYS run `prisma generate` inside the container.

### Installing Dependencies

```bash
# Add package to backend
docker-compose -f docker-compose.dev.yml exec backend npm install <package> --legacy-peer-deps

# Add package to frontend
docker-compose -f docker-compose.dev.yml exec frontend npm install <package> --legacy-peer-deps

# Rebuild containers after adding dependencies
docker-compose -f docker-compose.dev.yml up --build
```

### Development Without Docker (Not Recommended)

If you prefer local development, you'll need:

- Node.js 20.x
- PostgreSQL 16
- Proper environment variables

Note: Docker is strongly recommended for consistency.

## Code Conventions

### Backend

- **Controllers**: Return nothing, use `next(error)` for errors. Example: [backend/src/controllers/habit.controller.ts](backend/src/controllers/habit.controller.ts)
- **Routes**: Apply `authenticate` middleware at router level (see [backend/src/routes/habit.routes.ts](backend/src/routes/habit.routes.ts))
- **Typed requests**: Use `AuthRequest` for authenticated routes to access `req.userId`

### Frontend

- **Components**: Functional components with TypeScript. Use Tailwind for styling
- **Auth state**: Access via `useAuthStore()` hook. Token persists to localStorage as `auth-storage`
- **API calls**: Use the `api` instance from [frontend/src/services/api.ts](frontend/src/services/api.ts), NOT raw axios

### Database

- **Models**: User, Habit, HabitLog with cascade deletes
- **Enums**: Use Prisma enums (e.g., `Frequency`) defined in schema
- **Timestamps**: `createdAt`/`updatedAt` auto-managed by Prisma

## Key Patterns

### Authentication Flow

1. Login/register returns JWT token
2. Frontend stores token in Zustand store (persisted to localStorage)
3. Axios interceptor adds `Authorization: Bearer <token>` to all requests
4. Backend `authenticate` middleware verifies token and sets `req.userId`

### Error Handling

- Backend: Use custom `AppError` with `statusCode` property, caught by [backend/src/middleware/errorHandler.ts](backend/src/middleware/errorHandler.ts)
- Frontend: Axios interceptor catches 401 errors, clears auth, redirects to login

## Environment Setup

Environment variables are configured via Docker Compose. See `docker-compose.dev.yml` for development configuration.

**Required environment variables**:

- Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`
- Frontend: `REACT_APP_API_URL=http://localhost:8080/api`

**Test credentials** (from seed data):

- Email: `test@example.com`
- Password: `password123`

## Deployment

This project is containerized for easy deployment:

1. **Build images**: `docker-compose build`
2. **Push to registry**: Tag and push images to Docker Hub or container registry
3. **Deploy**: Use docker-compose or orchestration tool (Docker Swarm, Kubernetes, Railway, Render, etc.)
4. **Environment**: Set production environment variables via secrets management

**Personal Deployment Options**:

- Cloud platforms with container support (Railway, Render, Fly.io)
- VPS with Docker (DigitalOcean, Linode, Hetzner)
- Self-hosted on home server

## Future AI Integration

This project is designed for future AI tool integration:

- Modular architecture allows easy addition of AI services
- RESTful API can be extended with AI endpoints
- Consider adding `ai-service` workspace for ML models or AI agents
- Potential integrations: habit recommendations, insights generation, pattern recognition

## Important Notes

- **Strict TypeScript**: Both backend and frontend use strict mode
- **Containerized**: All services run in Docker for consistency and easy deployment
- **Database**: PostgreSQL in Docker container (no local installation needed)
- **Backend Port**: 8080
- **API prefix**: All backend routes under `/api/*` (e.g., `/api/habits`)
- **Protected routes**: ALL routes except `/api/auth/*` require authentication
- **Package versions**: Using latest stable versions to minimize security vulnerabilities
- **Hot reload**: Enabled in development via volume mounts
