# Habit Tracker

[![CI](https://github.com/bhavinvirani/habit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/bhavinvirani/habit-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/bhavinvirani/habit-tracker?style=social)](https://github.com/bhavinvirani/habit-tracker)

A full-stack habit tracking application with analytics, insights, and visualization. Fully containerized with Docker for easy development and deployment.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/bhavinvirani/habit-tracker.git
cd habit-tracker

# Start with Docker (recommended)
make up

# Or without Docker
npm install
npm run dev
```

**Access the application:**

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:3000          |
| Backend  | http://localhost:8080          |
| API Docs | http://localhost:8080/api-docs |
| Health   | http://localhost:8080/health   |

> For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md)

## Features

### Core

- **Habit Management** - Create, edit, delete, archive, pause/resume, reorder, and stack habits
- **Daily Tracking** - Check-in and undo with date-specific tracking
- **Streaks & Milestones** - Track consecutive days and achievement milestones
- **Categories** - Organize habits by custom categories

### Analytics

- **Dashboard** - Overview, weekly/monthly breakdowns, productivity scores
- **Visualizations** - Heatmaps, charts, calendar view, trends
- **Insights** - Correlations, predictions, best performing analysis, category breakdown

### Additional

- **Book Tracking** - Track reading progress with session logging and stats
- **Challenges** - Time-bound habit challenges with progress syncing
- **Reminders** - Per-habit reminders with notification settings
- **Telegram Bot** - Track habits and get reminders via Telegram
- **OpenClaw Integration** - Natural language habit tracking across messaging apps
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

### Backend

- **Runtime**: Node.js 20 + Express
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: JWT with refresh token rotation
- **Validation**: Zod schemas
- **Logging**: Winston with daily rotate

### Frontend

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Fetching**: React Query (TanStack Query)
- **State Management**: Zustand
- **Icons**: Lucide React

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Monorepo**: npm Workspaces
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend) + Render (backend) + Neon (database)

## Project Structure

```
habit-tracker/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── validators/      # Zod request schemas
│   │   ├── docs/            # Swagger YAML specs
│   │   └── utils/           # Helpers and utilities
│   └── prisma/              # Database schema & migrations
├── frontend/                # React application
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API client
│       ├── store/           # Zustand state management
│       └── hooks/           # Custom React hooks
├── shared/                  # Shared TypeScript types & constants
├── docs/                    # Integration guides
└── docker-compose.dev.yml   # Development setup
```

## Development

### Quick Commands

```bash
# Docker
make up                # Start all services
make down              # Stop all services
make build             # Rebuild containers
make migrate           # Run Prisma migrations
make studio            # Open Prisma Studio

# Without Docker
npm run dev            # Start backend + frontend
npm run backend        # Backend only
npm run frontend       # Frontend only

# Quality
npm run lint           # Lint all workspaces
npm run format         # Format all files
npm run test --workspace=backend   # Run tests
```

### Git Hooks

| Hook           | Action                                 |
| -------------- | -------------------------------------- |
| **pre-commit** | Runs ESLint + Prettier on staged files |
| **commit-msg** | Enforces conventional commit format    |

## API

Interactive API documentation is available at `/api-docs` (Swagger UI) when the server is running.

Base URL: `http://localhost:8080/api/v1`

Key endpoint groups: Auth, Habits, Tracking, Analytics, Books, Challenges, Templates, Reminders, Users, Bot, Integrations.

> See the [full API reference](.claude/docs/API_REFERENCE.md) or run the server and visit `/api-docs`.

## Deployment

- **Frontend**: Vercel (config in `vercel.json`, Root Directory = `/`)
- **Backend**: Render (Dockerfile in `backend/`)
- **Database**: Neon.tech (managed PostgreSQL)

### Environment Variables

See `backend/.env.example` for the full list. Key vars:

| Variable             | Description                        |
| -------------------- | ---------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string       |
| `JWT_SECRET`         | Secret for JWT signing (32+ chars) |
| `CORS_ORIGIN`        | Frontend URL(s) for CORS           |
| `REACT_APP_API_URL`  | Backend API URL for frontend       |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional)      |

## Integrations

### Telegram Notifications

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Add `TELEGRAM_BOT_TOKEN` to your environment variables
3. Register your chat ID via the Settings page

[Full Setup Guide](docs/TELEGRAM_INTEGRATION.md)

### OpenClaw Integration

Track habits using natural language in any messaging app (Telegram, WhatsApp, Discord).

- [OpenClaw + Telegram](docs/OPENCLAW_INTEGRATION.md)
- [OpenClaw + WhatsApp](docs/WHATSAPP_INTEGRATION.md)

## Contributing

See our [Contributing Guide](CONTRIBUTING.md) for setup instructions, commit conventions, and PR process.

## Security

See our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

## License

MIT - See [LICENSE](LICENSE)
