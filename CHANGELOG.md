# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0](https://github.com/bhavinvirani/habit-tracker-with-openclaw/compare/v1.2.0...v1.3.0) (2026-02-18)


### Features

* add admin stats ([31c127b](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/31c127b8afd51ecd8f9417d675b1965ca2729c16))
* add AI insights service and report generator ([662c78a](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/662c78aeb9e043c5dccdea9c7c9667d4d6619d07))
* add feature flag system with admin endpoints ([9ef9500](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/9ef95003af361ffcec688e4da1a25e721431696b))
* add FeatureFlag, WeeklyReport models and isAdmin to User ([06bb210](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/06bb210215bfdf2f523dc68fa8582216cfa45a10))
* add isAdmin to auth responses and admin API tests ([6111b93](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/6111b93734c6e1d759ea79a971283ef6a57d00ab))
* add QuickLogDialog component and integrate it into Dashboard for quick habit logging ([84418a7](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/84418a7d7c855d5755d6f474ea475c214bb93c73))
* add Redis caching for analytics and implement request metrics ([ca66377](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/ca66377cf953f067e803230ffb03e7e92d7b111d))
* add test for frontend workspace ([4a4727a](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/4a4727a81141b7d6e23a81bab586ca9caf10dd17))
* enhance actuator stats with deployment, error, cron job, and rate limiting metrics; add seeder ([897bff6](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/897bff671c4e4044c3ff3c43a6b64b75339b0523))
* enhance UI with animated components and confetti effects; ([2fb6ac6](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/2fb6ac62ce99cc0646012802798399dd24a624c9))
* implement feature flags and AI insights reporting ([ca8465b](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/ca8465b776b8dc31dcc1a5898ad79e1181ba1169))
* implement password reset functionality ([975bd1a](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/975bd1af6d50936aeb71772b3ea51eaaa8a36591))
* prod fix ([325f069](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/325f069f564966328cc393e280e951cc0ba59582))
* update README with actuator stats and improve cookie sameSite handling for production ([abd025a](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/abd025aeda6a0a1f0c0de21dc8aac9df77a76945))
* update Register page layout and add new dependencies ([9328d5d](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/9328d5daa143d78bb28547028fbe721c5a3165f7))
* upgrade v1 ([7967288](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/7967288232ef8a7fd91d6351591d73f3562bd3c7))


### Bug Fixes

* add directUrl to Prisma datasource for Neon pooler compatibility ([50d1102](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/50d110213d26575e6b544b0001b3315bccdcbdf1))
* fix timezone issue ([89347f0](https://github.com/bhavinvirani/habit-tracker-with-openclaw/commit/89347f0e2e1a7ba27dda45e02f31250623578e24))

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
