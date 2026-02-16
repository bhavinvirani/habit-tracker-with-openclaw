# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0](https://github.com/bhavinvirani/habit-tracker-with-openclaw/compare/1.1.0...v1.2.0) (2026-02-16)


### Features

* add API docs, remove eslint-disable any casts, add GitHub community files ([c00221e](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/c00221e165e484b7f7940f5a861229d60c6b0b86))
* add vercel analytics ([2d1e878](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/2d1e8781ba97186361f9c26a65585c5bf8932fe2))
* add Vercel Analytics integration and update README with new features and commands ([b81bf35](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/b81bf35edc5bff049f838e815ecdcb08515dbf34))
* add vercel speed insights ([bf851de](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/bf851debe48c2e9d4a04bcd82c3c37f2587f7ebd))
* add vercel speed insights ([bdb6582](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/bdb6582a0f14064e26098a7c75efa7be81199215))


### Bug Fixes

* correct Vercel outputDirectory path to fix build deployment ([a718ab8](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/a718ab8ec13f2d9e2116f63e66baae9f6a5a3c1a))
* improve chart rendering, responsiveness, and accessibility in Analytics ([e745130](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/e745130659eec6d080dc030d078a14f9511e8a63))

## [1.0.0] - 2026-02-15

### Added

- **Habit Management**: Create, edit, delete, archive, pause/resume, and reorder habits
- **Habit Stacking**: Link habits together for routine building
- **Daily Tracking**: Check-in and undo check-in with date-specific tracking
- **Analytics Dashboard**: Overview, weekly/monthly breakdowns, heatmap, streaks, insights, calendar, category breakdown, week comparison, monthly trend, productivity score, best performing analysis, correlations, and predictions
- **Book Tracking**: Full CRUD with reading progress, session logging, and statistics
- **Challenges**: Create time-bound habit challenges with progress syncing
- **Templates**: Pre-built habit templates for quick setup
- **Reminders**: Habit-specific reminders with notification settings
- **User Management**: Profile management, password change, data export, API key management
- **Telegram Bot Integration**: Track habits and receive reminders via Telegram
- **OpenClaw Integration**: Natural language habit tracking across messaging apps
- **Authentication**: JWT-based auth with refresh token rotation, account lockout
- **Security**: Rate limiting, Zod validation, Helmet headers, CORS whitelist
- **CI/CD**: GitHub Actions for lint, typecheck, test, and build
- **Docker**: Full containerization with dev and production configurations
- **API Versioning**: v1 API with backward compatibility
