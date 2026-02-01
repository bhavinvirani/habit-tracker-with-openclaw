# Development Guide

Complete guide for developing the Habit Tracker application with Docker.

## 📋 Table of Contents

- [Initial Setup](#initial-setup)
- [Daily Development Workflow](#daily-development-workflow)
- [Docker Commands](#docker-commands)
- [Database Management](#database-management)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Debugging](#debugging)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🚀 Initial Setup

### Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose (Linux)
- Git
- Code editor (VS Code recommended)

### First Time Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd habit-tracker

# 2. Start all services (this will download images and build containers)
docker-compose -f docker-compose.dev.yml up --build

# 3. Wait for services to start (you'll see logs from all containers)
# Backend should show: "🚀 Server running on port 8080"
# Frontend should show: "webpack compiled successfully"

# 4. In a new terminal, run database migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# 5. Seed the database with test data
docker-compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts

# 6. Verify setup
curl http://localhost:8080/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **Database**: PostgreSQL on localhost:5432

### Test Credentials

```
Email: test@example.com
Password: password123
```

## 📅 Daily Development Workflow

### Starting Your Day

```bash
# Option 1: Start and follow logs automatically
./start.sh
# OR
make up

# Option 2: Start in foreground (shows all logs)
docker-compose -f docker-compose.dev.yml up

# Option 3: Start in background (detached mode)
docker-compose -f docker-compose.dev.yml up -d
# Then view logs separately (see Viewing Logs section)
```

### Viewing Logs

```bash
# View backend + frontend logs (recommended for development)
docker-compose -f docker-compose.dev.yml logs -f backend frontend

# View all service logs (including database)
docker-compose -f docker-compose.dev.yml logs -f
# OR
make logs-all

# View specific service logs
make logs-backend    # Backend only
make logs-frontend   # Frontend only
make logs-db         # Database only

# View last N lines of logs
docker-compose -f docker-compose.dev.yml logs --tail=50 backend

# View logs without following (static snapshot)
docker-compose -f docker-compose.dev.yml logs backend
```

### During Development

```bash
# Make code changes - files auto-reload via volume mounts
# No need to restart containers for code changes!

# If you need to restart a specific service
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend
```

### Ending Your Day

```bash
# Stop all services (preserves data)
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clears database)
docker-compose -f docker-compose.dev.yml down -v
```

## 🐳 Docker Commands

### Container Management

```bash
# Start services
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml up -d  # detached mode

# Stop services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml down -v  # also remove volumes

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend

# Rebuild containers (after dependency changes)
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml build --no-cache  # force rebuild
```

### Container Status

```bash
# List running containers
docker-compose -f docker-compose.dev.yml ps

# Detailed container info
docker-compose -f docker-compose.dev.yml ps -a

# View resource usage
docker stats
```

### Logs

```bash
# All logs (follow mode)
docker-compose -f docker-compose.dev.yml logs -f

# Last 50 lines from backend
docker-compose -f docker-compose.dev.yml logs --tail=50 backend

# Logs since 10 minutes ago
docker-compose -f docker-compose.dev.yml logs --since=10m

# Logs with timestamps
docker-compose -f docker-compose.dev.yml logs -f -t
```

### Execute Commands in Container

```bash
# Run any command in backend container
docker-compose -f docker-compose.dev.yml exec backend <command>

# Interactive shell in backend
docker-compose -f docker-compose.dev.yml exec backend sh

# Interactive shell in frontend
docker-compose -f docker-compose.dev.yml exec frontend sh

# Run command in database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d habit_tracker
```

## 🗄️ Database Management

### Prisma Commands

```bash
# Run migrations in development
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Create a new migration
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name add_new_field

# Deploy migrations (production)
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Generate Prisma Client (after schema changes)
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

# Validate schema
docker-compose -f docker-compose.dev.yml exec backend npx prisma validate

# Format schema file
docker-compose -f docker-compose.dev.yml exec backend npx prisma format
```

### Prisma Studio (Visual Database Editor)

```bash
# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Access at: http://localhost:5555
```

### Database Seeding

```bash
# Seed database with test data
docker-compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts

# Reset database and reseed
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset --force
```

### Direct PostgreSQL Access

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d habit_tracker

# Common SQL commands:
\dt              # List all tables
\d users         # Describe users table
\d+ habits       # Detailed table info
\l               # List databases
\q               # Quit

# Run SQL query directly
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d habit_tracker -c "SELECT * FROM users;"

# Count records
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d habit_tracker -c "SELECT COUNT(*) FROM habits;"

# Export database dump
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres habit_tracker > backup.sql

# Import database dump
cat backup.sql | docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres habit_tracker
```

### Database Reset & Cleanup

```bash
# Complete database reset
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset --force

# Drop and recreate database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "DROP DATABASE habit_tracker;"
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE habit_tracker;"
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
```

## 🔧 Backend Development

### Install Dependencies

```bash
# Install new package
docker-compose -f docker-compose.dev.yml exec backend npm install <package-name> --legacy-peer-deps

# Install dev dependency
docker-compose -f docker-compose.dev.yml exec backend npm install -D <package-name> --legacy-peer-deps

# Rebuild container after package.json changes
docker-compose -f docker-compose.dev.yml up --build backend
```

### TypeScript & Linting

```bash
# Check TypeScript errors
docker-compose -f docker-compose.dev.yml exec backend npx tsc --noEmit

# Run ESLint
docker-compose -f docker-compose.dev.yml exec backend npm run lint

# Format code
docker-compose -f docker-compose.dev.yml exec backend npm run format
```

### Testing Backend

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test API endpoint (requires auth)
curl -X GET http://localhost:8080/api/habits \
  -H "Authorization: Bearer <your-token>"

# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","name":"New User"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Backend Logs & Debugging

```bash
# Watch backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Check for errors
docker-compose -f docker-compose.dev.yml logs backend | grep -i error

# View environment variables
docker-compose -f docker-compose.dev.yml exec backend env

# Check Node version
docker-compose -f docker-compose.dev.yml exec backend node --version

# Check installed packages
docker-compose -f docker-compose.dev.yml exec backend npm list --depth=0
```

## ⚛️ Frontend Development

### Install Dependencies

```bash
# Install new package
docker-compose -f docker-compose.dev.yml exec frontend npm install <package-name> --legacy-peer-deps

# Install dev dependency
docker-compose -f docker-compose.dev.yml exec frontend npm install -D <package-name> --legacy-peer-deps

# Rebuild container
docker-compose -f docker-compose.dev.yml up --build frontend
```

### Development Commands

```bash
# View frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# Check for compilation errors
docker-compose -f docker-compose.dev.yml logs frontend | grep -i "error\|failed"

# Build production bundle (for testing)
docker-compose -f docker-compose.dev.yml exec frontend npm run build

# Check bundle size
docker-compose -f docker-compose.dev.yml exec frontend ls -lh build/static/js/
```

### Frontend Testing

```bash
# Run tests (if configured)
docker-compose -f docker-compose.dev.yml exec frontend npm test

# Check for TypeScript errors
docker-compose -f docker-compose.dev.yml exec frontend npx tsc --noEmit
```

## 🐛 Debugging

### Check Container Health

```bash
# View all container status
docker-compose -f docker-compose.dev.yml ps

# Inspect specific container
docker inspect habit-tracker-backend

# Check container logs for crashes
docker-compose -f docker-compose.dev.yml logs --tail=100 backend | grep -i "error\|crash\|exit"
```

### Network Debugging

```bash
# Test connectivity between containers
docker-compose -f docker-compose.dev.yml exec backend ping postgres
docker-compose -f docker-compose.dev.yml exec frontend ping backend

# Check if ports are accessible
curl -v http://localhost:8080/health
curl -v http://localhost:3000

# Check what's listening on ports (macOS/Linux)
lsof -i :8080
lsof -i :3000
lsof -i :5432
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check specific container
docker stats habit-tracker-backend

# View container processes
docker-compose -f docker-compose.dev.yml exec backend ps aux
```

### Debug Inside Container

```bash
# Interactive shell in backend
docker-compose -f docker-compose.dev.yml exec backend sh

# Once inside:
cd /app
ls -la
cat package.json
env | grep DATABASE
npx prisma db pull --print
exit
```

## 🧪 Testing

### API Testing with curl

```bash
# Test health
curl http://localhost:8080/health

# Test auth endpoints
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"pass123","name":"Test User 2"}'

# Save token from login response
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Use token for authenticated requests
curl -X GET http://localhost:8080/api/habits \
  -H "Authorization: Bearer $TOKEN"
```

### Database Testing

```bash
# Check database connection
docker-compose -f docker-compose.dev.yml exec backend npx prisma db pull --print

# Test query
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d habit_tracker -c "SELECT COUNT(*) FROM users;"

# Check database health
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres
```

## 🔥 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 5432
lsof -ti:5432 | xargs kill -9

# Or stop all containers and restart
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up
```

### Container Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose.dev.yml logs backend

# Rebuild container from scratch
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache backend
docker-compose -f docker-compose.dev.yml up backend

# Remove old containers and volumes
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a  # WARNING: removes all unused containers/images
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.dev.yml ps postgres

# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres

# Recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up postgres -d
sleep 10
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
```

### Frontend Not Loading

```bash
# Check if webpack compiled successfully
docker-compose -f docker-compose.dev.yml logs frontend | grep "compiled"

# Check for errors
docker-compose -f docker-compose.dev.yml logs frontend | grep -i error

# Restart frontend
docker-compose -f docker-compose.dev.yml restart frontend

# Clear browser cache and try again
# Or open in incognito/private mode
```

### Prisma Issues

```bash
# Regenerate Prisma Client
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

# Reset Prisma migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset --force

# Check Prisma version
docker-compose -f docker-compose.dev.yml exec backend npx prisma --version
```

### Hot Reload Not Working

```bash
# Check volume mounts
docker-compose -f docker-compose.dev.yml config | grep volumes -A 5

# For macOS users, ensure file watching is enabled
# Add to docker-compose.dev.yml frontend service:
# environment:
#   - CHOKIDAR_USEPOLLING=true
#   - WATCHPACK_POLLING=true

# Restart with rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Complete Reset

```bash
# Nuclear option - reset everything
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a --volumes
docker-compose -f docker-compose.dev.yml up --build

# Then reseed database
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts
```

## 📝 Additional Tips

### Useful Aliases (add to ~/.zshrc or ~/.bashrc)

```bash
# Add to your shell config file
alias dc='docker-compose -f docker-compose.dev.yml'
alias dcup='docker-compose -f docker-compose.dev.yml up'
alias dcdown='docker-compose -f docker-compose.dev.yml down'
alias dclogs='docker-compose -f docker-compose.dev.yml logs -f'
alias dcps='docker-compose -f docker-compose.dev.yml ps'
alias dcbuild='docker-compose -f docker-compose.dev.yml up --build'

# Then use:
dc up
dc logs backend
dc exec backend npx prisma studio
```

### VS Code Extensions

Recommended extensions for development:

- Prisma (Prisma.prisma)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Docker (ms-azuretools.vscode-docker)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

### Environment Variables

View current environment variables:

```bash
# Backend
docker-compose -f docker-compose.dev.yml exec backend env | grep -E "NODE_ENV|PORT|DATABASE_URL|JWT"

# Frontend
docker-compose -f docker-compose.dev.yml exec frontend env | grep REACT_APP
```

### Performance Tips

- Use `-d` flag for detached mode during daily development
- Use `--tail=50` when viewing logs to limit output
- Run `docker system prune` periodically to free disk space
- Use `.dockerignore` to exclude unnecessary files from builds

## 🎯 Common Workflows

### Adding a New API Endpoint

```bash
# 1. Create/update controller in backend/src/controllers/
# 2. Add route in backend/src/routes/
# 3. Update types in shared/src/types/
# 4. Backend auto-reloads, no restart needed
# 5. Test endpoint
curl -X GET http://localhost:8080/api/your-new-endpoint
```

### Adding a New Database Field

```bash
# 1. Update backend/prisma/schema.prisma
# 2. Create migration
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name add_new_field

# 3. Generate Prisma Client
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

# 4. Update seed file if needed
# 5. Backend auto-restarts
```

### Adding a New Frontend Component

```bash
# 1. Create component in frontend/src/components/
# 2. Files auto-reload via webpack
# 3. Check browser at http://localhost:3000
# 4. Check console for errors if needed
```

---

## 🆘 Need More Help?

- Check the [README.md](README.md) for overview and setup
- See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI agent guidance
- Review [docs/API_EXAMPLES.json](docs/API_EXAMPLES.json) for API examples
- Open an issue on GitHub for bugs or questions

**Happy Coding! 🚀**
