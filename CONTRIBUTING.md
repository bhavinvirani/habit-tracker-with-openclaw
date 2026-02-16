# Contributing to Habit Tracker

Thank you for your interest in contributing to Habit Tracker! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Code Style](#code-style)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS/Windows) or Docker Engine + Docker Compose (Linux)
- [Node.js](https://nodejs.org/) >= 18.0.0
- [npm](https://www.npmjs.com/) >= 9.0.0
- [Git](https://git-scm.com/)

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**

   ```bash
   git clone https://github.com/<your-username>/habit-tracker.git
   cd habit-tracker
   ```

3. **Add the upstream remote:**

   ```bash
   git remote add upstream https://github.com/bhavinvirani/habit-tracker.git
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Start the development environment:**

   ```bash
   # Using Docker (recommended)
   make up

   # Or without Docker
   npm run dev
   ```

6. **Verify everything is working:**

   | Service  | URL                          |
   | -------- | ---------------------------- |
   | Frontend | http://localhost:3000        |
   | Backend  | http://localhost:8080        |
   | Health   | http://localhost:8080/health |

> For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Development Workflow

### Branch Naming

Create a branch from `dev` using one of these prefixes:

| Prefix      | Use Case                          | Example                     |
| ----------- | --------------------------------- | --------------------------- |
| `feat/`     | New feature                       | `feat/habit-reminders`      |
| `fix/`      | Bug fix                           | `fix/streak-calculation`    |
| `docs/`     | Documentation changes             | `docs/update-api-reference` |
| `chore/`    | Maintenance, dependencies         | `chore/update-prisma`       |
| `refactor/` | Code refactoring (no new feature) | `refactor/auth-middleware`  |
| `test/`     | Adding or updating tests          | `test/analytics-endpoints`  |

```bash
git checkout dev
git pull upstream dev
git checkout -b feat/my-feature
```

### Running Tests

```bash
# Run all backend tests
npm run test --workspace=backend

# Run a specific test suite
npm run test:auth --workspace=backend
npm run test:habits --workspace=backend

# Run tests with coverage
npm run test:coverage --workspace=backend
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Format all files
npm run format
```

Pre-commit hooks will automatically lint and format staged files.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commit messages are validated by commitlint.

### Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Formatting, missing semi colons, etc.                   |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Changes to the build system or dependencies             |
| `ci`       | Changes to CI configuration files and scripts           |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Reverts a previous commit                               |

### Examples

```bash
feat: add habit reminder notifications
fix: correct streak calculation for weekly habits
docs: update API endpoint documentation
refactor(auth): simplify token refresh logic
test: add tests for analytics service
chore: update dependencies
feat!: redesign habit creation flow   # Breaking change
```

### Scopes (Optional)

Use a scope to provide additional context: `auth`, `habits`, `tracking`, `analytics`, `books`, `challenges`, `bot`, `ui`, `api`, `db`.

## Pull Request Process

1. **Ensure your branch is up to date:**

   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

2. **Push your branch:**

   ```bash
   git push origin feat/my-feature
   ```

3. **Open a Pull Request** targeting the `dev` branch.

4. **Fill out the PR template** completely.

5. **Ensure all checks pass:**
   - CI pipeline (lint, typecheck, tests, build)
   - No merge conflicts

6. **Request a review** from the maintainers.

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Write a clear description of what changed and why
- Link related issues using `Closes #123` or `Fixes #123`
- Include screenshots for UI changes
- Add or update tests for new functionality
- Update documentation if behavior changes

## Reporting Issues

### Bug Reports

Use the [Bug Report template](https://github.com/bhavinvirani/habit-tracker/issues/new?template=bug_report.yml) and include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots if applicable

### Feature Requests

Use the [Feature Request template](https://github.com/bhavinvirani/habit-tracker/issues/new?template=feature_request.yml) and include:

- The problem or motivation
- Your proposed solution
- Alternatives you've considered

### Good First Issues

Looking for something to work on? Check out issues labeled [`good first issue`](https://github.com/bhavinvirani/habit-tracker/labels/good%20first%20issue).

## Code Style

### General

- TypeScript strict mode is enabled in all workspaces
- Single quotes, trailing commas (es5), 100 character line width, 2-space indent
- Unused variables prefixed with `_` are allowed

### Backend

- Controllers handle request/response only — business logic goes in services
- All inputs validated with Zod schemas via middleware
- All endpoints return `ApiResponse<T>` format: `{ success, data?, error?, meta? }`
- Use `AppError` for error handling

### Frontend

- Functional components with hooks
- Zustand for auth state, React Query for server state
- Tailwind CSS for styling
- Path alias `@/` maps to `src/`

> For detailed patterns and examples, see [.claude/docs/PATTERNS.md](.claude/docs/PATTERNS.md) and [.claude/docs/CODE_STYLE.md](.claude/docs/CODE_STYLE.md).

---

Thank you for contributing!
