# Habit Tracker

A comprehensive full-stack habit tracking application with analytics, insights, and visualization. **Fully containerized with Docker for easy development and deployment.**

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/bhavinvirani/habit-tracker.git
cd habit-tracker

# Start the entire application with one command
docker-compose -f docker-compose.dev.yml up

# Or use the helper script
./start.sh
```

That's it! No Node.js, PostgreSQL, or other dependencies needed locally.

**Access the application:**

| Service     | URL                          |
| ----------- | ---------------------------- |
| Frontend    | http://localhost:3000        |
| Backend API | http://localhost:8080        |
| API Health  | http://localhost:8080/health |
| PostgreSQL  | localhost:5432               |

**Test Credentials:**

- Email: `test@example.com`
- Password: `password123`

> 📖 **For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md)**

## ✨ Features

### Core Features

- **Habit Management**: Create, edit, delete, and organize personal habits
- **Daily Tracking**: Check-in and track habit completion
- **Analytics Dashboard**: Insights and statistics about habit performance
- **Visualizations**: Charts and graphs showing trends and patterns
- **Streaks**: Track consecutive days of habit completion
- **Categories**: Organize habits by custom categories

### Additional Features

- **📚 Book Tracking**: Track books you're reading, completed, or want to read
- **🏆 Challenges**: Create and participate in habit challenges
- **📅 Calendar View**: Visualize habit completion over time
- **👤 User Profile**: Manage account settings and preferences
- **📱 Responsive Design**: Works on desktop and mobile
- **📲 Telegram Integration**: Get reminders and notifications in Telegram
- **🤖 OpenClaw Integration**: Track habits via natural language in any messaging app

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js 20 with Express
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Auth**: JWT-based authentication
- **Validation**: Zod + Express Validator
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
- **Web Server**: Nginx (production)
- **Monorepo**: npm Workspaces

### Development Tools

- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
habit-tracker/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── validators/     # Request validation schemas
│   │   └── utils/          # Helpers and utilities
│   ├── prisma/             # Database schema & migrations
│   ├── Dockerfile          # Production image
│   └── Dockerfile.dev      # Development image
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript types
│   ├── Dockerfile          # Production image (Nginx)
│   └── Dockerfile.dev      # Development image
├── shared/                 # Shared TypeScript types
├── docs/                   # API documentation
├── .husky/                 # Git hooks
├── docker-compose.yml      # Production setup
└── docker-compose.dev.yml  # Development setup
```

## 📋 Development

### Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose (Linux)

### Quick Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend frontend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

### Database Commands

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Open Prisma Studio (database GUI)
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed.ts

# Reset database
docker-compose -f docker-compose.dev.yml exec backend npm run db:reset
```

### Git Hooks (Husky)

This project uses Husky for Git hooks:

| Hook           | Action                                 |
| -------------- | -------------------------------------- |
| **pre-commit** | Runs ESLint + Prettier on staged files |
| **pre-push**   | Runs full lint across all workspaces   |

### Linting & Formatting

```bash
# Run linting across all workspaces
npm run lint

# Format all files
npm run format
```

## 📚 API Endpoints

Base URL: `http://localhost:8080/api`

### Authentication

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| POST   | `/auth/register` | Register new user |
| POST   | `/auth/login`    | Login and get JWT |
| GET    | `/auth/me`       | Get current user  |

### Habits

| Method | Endpoint      | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/habits`     | List all habits   |
| POST   | `/habits`     | Create habit      |
| GET    | `/habits/:id` | Get habit details |
| PUT    | `/habits/:id` | Update habit      |
| DELETE | `/habits/:id` | Delete habit      |

### Tracking

| Method | Endpoint            | Description           |
| ------ | ------------------- | --------------------- |
| POST   | `/tracking/log`     | Log habit completion  |
| GET    | `/tracking/history` | View tracking history |

### Analytics

| Method | Endpoint              | Description     |
| ------ | --------------------- | --------------- |
| GET    | `/analytics/overview` | Dashboard stats |

### Books

| Method | Endpoint     | Description    |
| ------ | ------------ | -------------- |
| GET    | `/books`     | List all books |
| POST   | `/books`     | Add a book     |
| PUT    | `/books/:id` | Update book    |
| DELETE | `/books/:id` | Remove book    |

### Challenges

| Method | Endpoint          | Description      |
| ------ | ----------------- | ---------------- |
| GET    | `/challenges`     | List challenges  |
| POST   | `/challenges`     | Create challenge |
| PUT    | `/challenges/:id` | Update challenge |
| DELETE | `/challenges/:id` | Delete challenge |

> Full API examples in [docs/API_EXAMPLES.json](docs/API_EXAMPLES.json)

## 🚀 Deployment

### Production Build

```bash
# Build optimized images
docker-compose build

# Start production stack
docker-compose up -d
```

### Environment Variables

| Variable             | Description                   |
| -------------------- | ----------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string  |
| `JWT_SECRET`         | Secret for JWT signing        |
| `JWT_EXPIRES_IN`     | Token expiration (e.g., "7d") |
| `CORS_ORIGIN`        | Frontend URL for CORS         |
| `REACT_APP_API_URL`  | Backend API URL               |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional) |

### Deployment Platforms

- **Railway, Render, Fly.io** - Direct Docker deployment
- **DigitalOcean App Platform** - Container support
- **AWS ECS, GCP Cloud Run** - Container orchestration
- **VPS** - Self-hosted with Docker

## 🔗 Integrations

### Telegram Notifications

Get habit reminders and notifications directly in Telegram.

**Quick Setup**:

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Add `TELEGRAM_BOT_TOKEN` to your environment variables
3. Register your chat ID via the Settings page

📖 **[Full Setup Guide](docs/TELEGRAM_INTEGRATION.md)**

### OpenClaw Integration

Track habits using natural language in any messaging app (Telegram, WhatsApp, Discord).

**Example Commands**:

- "Done with meditation"
- "Drank 3 glasses of water"
- "Show my habits for today"

📖 **Setup Guides**:

- [OpenClaw + Telegram](docs/OPENCLAW_INTEGRATION.md)
- [OpenClaw + WhatsApp](docs/WHATSAPP_INTEGRATION.md)

## 🤖 AI Integration (Planned)

This project is architected for future AI capabilities:

- Habit recommendations based on patterns
- Smart insights and summaries
- Predictive analytics for success probability
- Context-aware reminders

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

Built with ❤️ using modern web technologies and containerized for easy deployment.
