# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Habit Tracker seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Preferred:** Use [GitHub Security Advisories](https://github.com/bhavinvirani/habit-tracker/security/advisories/new) to privately report a vulnerability.

**Alternative:** Email the maintainer directly at [bhavinvirani@users.noreply.github.com](mailto:bhavinvirani@users.noreply.github.com) with the subject line `[SECURITY] Habit Tracker Vulnerability`.

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment:** Within 48 hours of your report
- **Initial Assessment:** Within 5 business days
- **Resolution:** We aim to resolve critical vulnerabilities within 14 days

### Disclosure Policy

- Please do **not** open a public GitHub issue for security vulnerabilities
- We will coordinate with you on disclosure timing
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Measures

This project implements the following security measures:

- **Authentication:** JWT with short-lived access tokens (15min) and rotating refresh tokens (7 days)
- **Password Security:** bcrypt hashing with account lockout after failed attempts
- **Input Validation:** Zod schemas on all endpoints
- **Rate Limiting:** Tiered rate limiting (auth, read, write, sensitive operations)
- **Security Headers:** Helmet with CSP, HSTS, and other protections
- **CORS:** Configurable origin whitelist
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **Cookie Security:** httpOnly, secure, sameSite flags on refresh tokens
