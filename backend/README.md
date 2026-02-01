# Habit Tracker - Backend API

A RESTful API server for the Habit Tracker application built with Express.js, TypeScript, and Prisma ORM.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Jest + Supertest

## Project Structure

```
backend/
├── prisma/
│   ├── migrations/        # Database migrations
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── __tests__/         # API test suites
│   │   └── api/           # Endpoint tests (auth, habits, tracking, etc.)
│   ├── config/            # Database configuration
│   ├── controllers/       # Request handlers
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts        # JWT authentication
│   │   ├── errorHandler.ts# Centralized error handling
│   │   ├── validate.ts    # Zod request validation
│   │   ├── requestLogger.ts
│   │   └── notFoundHandler.ts
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic layer
│   ├── utils/             # Utilities (AppError, logger, response formatter)
│   ├── validators/        # Zod validation schemas
│   └── server.ts          # Application entry point
├── Dockerfile             # Production Docker image
├── Dockerfile.dev         # Development Docker image
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file in the backend directory (see `.env.example`):

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/habit_tracker"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with templates
npm run prisma:seed

# Start development server (with hot-reload)
npm run dev
```

## NPM Scripts

| Script                          | Description                    |
| ------------------------------- | ------------------------------ |
| `npm run dev`                   | Start dev server with nodemon  |
| `npm run build`                 | Compile TypeScript to `dist/`  |
| `npm start`                     | Run compiled production server |
| `npm run lint`                  | Run ESLint                     |
| `npm run format`                | Format code with Prettier      |
| `npm test`                      | Run all tests                  |
| `npm run test:watch`            | Run tests in watch mode        |
| `npm run test:coverage`         | Run tests with coverage report |
| `npm run test:auth`             | Run auth tests only            |
| `npm run test:habits`           | Run habit tests only           |
| `npm run test:tracking`         | Run tracking tests only        |
| `npm run test:analytics`        | Run analytics tests only       |
| `npm run test:books`            | Run book tests only            |
| `npm run test:challenges`       | Run challenge tests only       |
| `npm run test:templates`        | Run template tests only        |
| `npm run prisma:generate`       | Generate Prisma client         |
| `npm run prisma:migrate`        | Run migrations (dev)           |
| `npm run prisma:migrate:deploy` | Run migrations (production)    |
| `npm run prisma:studio`         | Open Prisma Studio GUI         |
| `npm run prisma:seed`           | Seed the database              |
| `npm run db:push`               | Push schema without migration  |
| `npm run db:reset`              | Reset database (destructive)   |

## API Endpoints

All endpoints (except auth and health) require a valid JWT token in the `Authorization: Bearer <token>` header.

### Health Check

| Method | Endpoint  | Description          |
| ------ | --------- | -------------------- |
| `GET`  | `/health` | Server health status |

### Authentication (`/api/auth`)

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| `POST` | `/api/auth/register` | Register a new user            |
| `POST` | `/api/auth/login`    | Login and receive JWT token    |
| `GET`  | `/api/auth/me`       | Get current authenticated user |

### Habits (`/api/habits`)

| Method   | Endpoint                    | Description                                  |
| -------- | --------------------------- | -------------------------------------------- |
| `GET`    | `/api/habits`               | Get all user habits (supports query filters) |
| `POST`   | `/api/habits`               | Create a new habit                           |
| `GET`    | `/api/habits/categories`    | Get habit categories                         |
| `GET`    | `/api/habits/archived`      | Get archived habits                          |
| `PATCH`  | `/api/habits/reorder`       | Reorder habits (drag-and-drop)               |
| `GET`    | `/api/habits/:id`           | Get a specific habit                         |
| `PATCH`  | `/api/habits/:id`           | Update a habit                               |
| `DELETE` | `/api/habits/:id`           | Delete a habit                               |
| `POST`   | `/api/habits/:id/archive`   | Archive a habit                              |
| `POST`   | `/api/habits/:id/unarchive` | Unarchive a habit                            |
| `POST`   | `/api/habits/:id/pause`     | Pause a habit (vacation mode)                |
| `POST`   | `/api/habits/:id/resume`    | Resume a paused habit                        |
| `POST`   | `/api/habits/:id/stack`     | Stack/chain a habit after another            |

### Tracking (`/api/tracking`)

| Method   | Endpoint                   | Description                               |
| -------- | -------------------------- | ----------------------------------------- |
| `GET`    | `/api/tracking/today`      | Get today's habits with completion status |
| `POST`   | `/api/tracking/check-in`   | Log a habit completion                    |
| `DELETE` | `/api/tracking/check-in`   | Undo a habit check-in                     |
| `GET`    | `/api/tracking/date/:date` | Get habits for a specific date            |
| `GET`    | `/api/tracking/history`    | Get tracking history (calendar/heatmap)   |
| `GET`    | `/api/tracking/milestones` | Get user milestones                       |

### Analytics (`/api/analytics`)

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| `GET`  | `/api/analytics/overview`   | Dashboard overview stats         |
| `GET`  | `/api/analytics/weekly`     | Weekly analytics breakdown       |
| `GET`  | `/api/analytics/monthly`    | Monthly analytics breakdown      |
| `GET`  | `/api/analytics/heatmap`    | Year heatmap data                |
| `GET`  | `/api/analytics/habits/:id` | Habit-specific statistics        |
| `GET`  | `/api/analytics/streaks`    | Streak leaderboard               |
| `GET`  | `/api/analytics/insights`   | AI-like insights and suggestions |
| `GET`  | `/api/analytics/calendar`   | Day-by-day calendar data         |
| `GET`  | `/api/analytics/categories` | Category breakdown               |
| `GET`  | `/api/analytics/comparison` | Week-over-week comparison        |
| `GET`  | `/api/analytics/trend`      | Monthly trend (last 30 days)     |

### Templates (`/api/templates`)

| Method | Endpoint                 | Description                    |
| ------ | ------------------------ | ------------------------------ |
| `GET`  | `/api/templates`         | Get all habit templates        |
| `GET`  | `/api/templates/:id`     | Get a specific template        |
| `POST` | `/api/templates/:id/use` | Create a habit from a template |

### Books (`/api/books`)

| Method   | Endpoint                  | Description                            |
| -------- | ------------------------- | -------------------------------------- |
| `GET`    | `/api/books`              | Get all books (supports query filters) |
| `GET`    | `/api/books/stats`        | Get reading statistics                 |
| `GET`    | `/api/books/:id`          | Get a specific book                    |
| `POST`   | `/api/books`              | Add a new book                         |
| `PUT`    | `/api/books/:id`          | Update book details                    |
| `DELETE` | `/api/books/:id`          | Delete a book                          |
| `PUT`    | `/api/books/:id/progress` | Update reading progress (set page)     |
| `POST`   | `/api/books/:id/log`      | Log a reading session                  |
| `GET`    | `/api/books/:id/logs`     | Get reading logs for a book            |

### Challenges (`/api/challenges`)

| Method   | Endpoint                       | Description                        |
| -------- | ------------------------------ | ---------------------------------- |
| `GET`    | `/api/challenges`              | Get all challenges                 |
| `GET`    | `/api/challenges/:id`          | Get a specific challenge           |
| `POST`   | `/api/challenges`              | Create a new challenge             |
| `PUT`    | `/api/challenges/:id`          | Update a challenge                 |
| `DELETE` | `/api/challenges/:id`          | Delete a challenge                 |
| `POST`   | `/api/challenges/:id/sync`     | Sync challenge progress for a date |
| `GET`    | `/api/challenges/:id/progress` | Get detailed challenge progress    |

### Users (`/api/users`)

| Method   | Endpoint             | Description                                       |
| -------- | -------------------- | ------------------------------------------------- |
| `GET`    | `/api/users/profile` | Get user profile (with level, badges, milestones) |
| `PUT`    | `/api/users/profile` | Update user profile                               |
| `GET`    | `/api/users/export`  | Export all user data                              |
| `GET`    | `/api/users/api-key` | Get current API key                               |
| `POST`   | `/api/users/api-key` | Generate a new API key                            |
| `DELETE` | `/api/users/api-key` | Revoke API key                                    |

## Database Models

The database uses PostgreSQL with Prisma ORM. Key models:

- **User** - User accounts with optional API key support
- **Habit** - Habits with frequency config, pause/vacation mode, stacking, and archiving
- **HabitLog** - Daily habit completion entries (supports boolean, numeric, and duration types)
- **Milestone** - Achievement tracking (streak and completion milestones)
- **HabitTemplate** - Pre-made habit templates for quick setup
- **Book** - Book reading tracker with status and ratings
- **ReadingLog** - Daily reading session logs
- **Challenge** - Time-bound challenges linking multiple habits
- **ChallengeHabit** - Many-to-many relation between challenges and habits
- **ChallengeProgress** - Daily progress tracking for challenges

### Enums

| Enum              | Values                                             | Description         |
| ----------------- | -------------------------------------------------- | ------------------- |
| `Frequency`       | `DAILY`, `WEEKLY`                                  | Habit frequency     |
| `HabitType`       | `BOOLEAN`, `NUMERIC`, `DURATION`                   | Habit tracking type |
| `MilestoneType`   | `STREAK`, `COMPLETIONS`                            | Milestone category  |
| `BookStatus`      | `WANT_TO_READ`, `READING`, `FINISHED`, `ABANDONED` | Book reading status |
| `ChallengeStatus` | `ACTIVE`, `COMPLETED`, `FAILED`, `CANCELLED`       | Challenge state     |

## Error Handling

The API uses a centralized error handler with a custom `AppError` class. All errors follow a consistent response format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Prisma-specific errors (unique constraint violations, record not found, etc.) are automatically mapped to user-friendly error messages.

## Testing

Tests are written with Jest and Supertest, covering all API endpoints:

```bash
# Run all tests
npm test

# Run a specific test suite
npm run test:habits

# Run with coverage
npm run test:coverage
```
