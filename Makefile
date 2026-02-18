.PHONY: help up down build logs restart clean migrate studio install-backend install-frontend redis-cli flush-cache logs-redis

# Default target
help:
	@echo "Habit Tracker - Docker Commands (DEV MODE)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  up              Start all services (dev mode) and follow logs"
	@echo "  down            Stop all services"
	@echo "  build           Rebuild all containers"
	@echo "  logs            View logs (backend + frontend)"
	@echo "  logs-all        View all logs (including postgres)"
	@echo "  logs-backend    View backend logs only"
	@echo "  logs-frontend   View frontend logs only"
	@echo "  logs-db         View database logs only"
	@echo "  restart         Restart all services"
	@echo "  clean           Stop and remove all containers, volumes"
	@echo "  migrate         Run database migrations"
	@echo "  studio          Open Prisma Studio (database GUI)"
	@echo "  install-backend Install backend package"
	@echo "  install-frontend Install frontend package"
	@echo "  shell-backend   Open shell in backend container"
	@echo "  shell-frontend  Open shell in frontend container"
	@echo "  shell-db        Open PostgreSQL shell"
	@echo "  redis-cli       Open Redis CLI"
	@echo "  flush-cache     Flush all Redis cache keys"
	@echo "  logs-redis      View Redis logs"
	@echo "  prod            Start in production mode"

up:
	docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Services started in DEV mode!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8080"
	@echo ""
	@echo "Following logs... (Press Ctrl+C to exit)"
	@echo ""
	@docker-compose -f docker-compose.dev.yml logs -f backend frontend

down:
	docker-compose -f docker-compose.dev.yml down

build:
	docker-compose -f docker-compose.dev.yml up --build -d

logs:
	docker-compose -f docker-compose.dev.yml logs -f

logs-backend:
	docker-compose -f docker-compose.dev.yml logs -f backend

logs-frontend:
	docker-compose -f docker-compose.dev.yml logs -f frontend

logs-db:
	docker-compose -f docker-compose.dev.yml logs -f postgres

logs-all:
	docker-compose -f docker-compose.dev.yml logs -f

restart:
	docker-compose -f docker-compose.dev.yml restart

prod:
	docker-compose up --build -d
	@echo ""
	@echo "✅ Services started in PRODUCTION mode!"

clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v
	docker system prune -f

migrate:
	docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

studio:
	docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

install-backend:
	@read -p "Package name: " pkg; \
	docker-compose -f docker-compose.dev.yml exec backend npm install $$pkg

install-frontend:
	@read -p "Package name: " pkg; \
	docker-compose -f docker-compose.dev.yml exec frontend npm install $$pkg

shell-backend:
	docker-compose -f docker-compose.dev.yml exec backend sh

shell-frontend:
	docker-compose -f docker-compose.dev.yml exec frontend sh

shell-db:
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres habit_tracker

redis-cli:
	docker-compose -f docker-compose.dev.yml exec redis redis-cli

flush-cache:
	docker-compose -f docker-compose.dev.yml exec redis redis-cli FLUSHALL
	@echo "✅ Redis cache flushed"

logs-redis:
	docker-compose -f docker-compose.dev.yml logs -f redis
