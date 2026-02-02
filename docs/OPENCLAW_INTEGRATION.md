# OpenClaw Integration Guide

This guide explains how to integrate the Habit Tracker with [OpenClaw](https://openclaw.ai), enabling you to track habits via messaging apps like Telegram, WhatsApp, Discord, and more.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Flow](#architecture-flow)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [How It Works](#how-it-works)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Example Conversations](#example-conversations)

---

## Overview

### What is OpenClaw?

OpenClaw is an open-source AI assistant that runs on your computer. It connects to messaging platforms (Telegram, WhatsApp, Discord, etc.) and can perform tasks using "skills" - specialized instruction sets that teach it how to interact with different APIs.

### What does this integration do?

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   You on    │ ──── │  OpenClaw   │ ──── │ Habit       │ ──── │  Database   │
│  Telegram   │      │  Gateway    │      │ Tracker API │      │ (PostgreSQL)│
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
     │                     │                     │
     │ "Done with          │ Reads skill,        │ POST /api/bot/
     │  meditation"        │ calls API           │ check-in-by-name
     │                     │                     │
     ▼                     ▼                     ▼
  Message sent ──────► AI processes ──────► Habit logged ──────► Synced to app
```

**Benefits:**

- 📱 Track habits from any messaging app you already use
- 🗣️ Natural language - just say "drank 3 glasses of water"
- 🔔 Get reminders when you miss habits
- 🔄 Everything syncs back to the web app

---

## Architecture Flow

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR COMPUTER                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         OpenClaw Gateway                              │   │
│  │                                                                       │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │  │  Telegram   │    │   Claude/   │    │    Skills Directory     │  │   │
│  │  │  WhatsApp   │───▶│   OpenAI    │───▶│  ~/.openclaw/skills/    │  │   │
│  │  │  Discord    │    │    LLM      │    │                         │  │   │
│  │  └─────────────┘    └─────────────┘    │  ┌───────────────────┐  │  │   │
│  │                                         │  │ habit-tracker/    │  │  │   │
│  │                                         │  │  └── SKILL.md     │  │  │   │
│  │                                         │  └───────────────────┘  │  │   │
│  │                                         └─────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      │ HTTP API Calls                        │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Habit Tracker Backend                            │   │
│  │                      (Docker Container)                               │   │
│  │                                                                       │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │  │ Bot Routes  │───▶│ Bot Service │───▶│    PostgreSQL DB        │  │   │
│  │  │ /api/bot/*  │    │             │    │                         │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────────────────┘  │   │
│  │        │                                                             │   │
│  │        │ Authenticates via X-API-Key header                          │   │
│  │        ▼                                                             │   │
│  │  ┌─────────────┐                                                     │   │
│  │  │ API Key     │  Matches user's apiKey field in User table          │   │
│  │  │ Middleware  │                                                     │   │
│  │  └─────────────┘                                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Logging a Habit

```
Step 1: User Message
────────────────────
You (Telegram): "Done with 30 minutes of meditation"

Step 2: OpenClaw Gateway Receives Message
─────────────────────────────────────────
OpenClaw receives the message from Telegram webhook/polling.

Step 3: LLM Processes with Skill Context
────────────────────────────────────────
The AI (Claude/GPT) reads the habit-tracker SKILL.md and understands:
- This is a habit check-in request
- "meditation" is the habit name
- "30 minutes" is the value
- Type is DURATION

Step 4: API Call to Habit Tracker
─────────────────────────────────
OpenClaw executes:
  curl -X POST "$HABIT_TRACKER_API_URL/api/bot/habits/check-in-by-name" \
    -H "X-API-Key: $HABIT_TRACKER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"name": "meditation", "value": 30, "completed": true}'

Step 5: Backend Processes Request
─────────────────────────────────
1. botRequestLogger middleware logs the incoming request
2. apiKeyAuth middleware validates the API key
3. bot.controller receives the request
4. bot.service finds the habit via fuzzy matching
5. tracking.service logs the check-in
6. Response sent back with confirmation

Step 6: Response to User
────────────────────────
OpenClaw replies via Telegram:
"✅ Logged: Meditation - 30/30 minutes. Goal reached! 🎉 Streak: 5 days."
```

---

## Prerequisites

Before setting up the integration, you need:

| Requirement               | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| **OpenClaw installed**    | Install via `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| **Habit Tracker running** | Backend accessible (locally or deployed)                        |
| **API Key generated**     | Get from Settings → API Access in the web app                   |
| **Messaging platform**    | Telegram connected to OpenClaw                                  |

---

## Step-by-Step Setup

### Step 1: Generate an API Key

1. Open the Habit Tracker web app
2. Go to **Settings** → **API Access**
3. Click **"Generate API Key"**
4. **Copy and save** the key (it won't be shown again!)

> ⚠️ **Security**: Your API key provides full access to your habits. Keep it secret!

### Step 2: Install OpenClaw

```bash
# One-line installer (macOS/Linux)
curl -fsSL https://openclaw.ai/install.sh | bash

# Or via npm
npm install -g openclaw
```

### Step 3: Copy the Skill to OpenClaw

From the habit-tracker project directory:

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.openclaw/skills

# Copy the habit-tracker skill
cp -r openclaw/habit-tracker ~/.openclaw/skills/
```

### Step 4: Configure Environment Variables

Add your API credentials to OpenClaw's config file (`~/.openclaw/openclaw.json`):

```json
{
  "skills": {
    "entries": {
      "habit-tracker": {
        "enabled": true,
        "env": {
          "HABIT_TRACKER_API_URL": "http://localhost:8080",
          "HABIT_TRACKER_API_KEY": "your_api_key_here"
        }
      }
    }
  }
}
```

**For deployed backends**, use your production URL:

```json
"HABIT_TRACKER_API_URL": "https://api.yourhabits.com"
```

### Step 5: Verify the Skill

```bash
# Check if skill is loaded
openclaw skills list

# Detailed skill info
openclaw skills info habit-tracker
```

You should see:

```
📦 habit-tracker ✓ Ready

Requirements:
  Environment: ✓ HABIT_TRACKER_API_URL, ✓ HABIT_TRACKER_API_KEY
```

### Step 6: Connect Telegram (or other platform)

Follow OpenClaw's documentation to connect your messaging platform. Once connected, send a message like:

```
Show my habits
```

---

## How It Works

### The Skill File (SKILL.md)

The skill file teaches OpenClaw how to interact with your Habit Tracker. It contains:

```
┌─────────────────────────────────────────────────────────────────┐
│                         SKILL.md                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │   Frontmatter   │  YAML metadata:                            │
│  │   (YAML)        │  - name: skill identifier                  │
│  │                 │  - description: when to use this skill     │
│  │                 │  - metadata: required env vars, emoji      │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │   Instructions  │  Markdown body:                            │
│  │   (Markdown)    │  - API endpoints and examples              │
│  │                 │  - Request/response formats                │
│  │                 │  - Behavior guidelines                     │
│  │                 │  - Error handling instructions             │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Key Authentication

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│    Request     │────▶│  API Key Auth  │────▶│   Bot Routes   │
│  X-API-Key:    │     │   Middleware   │     │                │
│  abc123...     │     └────────────────┘     └────────────────┘
└────────────────┘            │
                              │ Lookup user by apiKey
                              ▼
                    ┌────────────────────┐
                    │  User Table        │
                    │                    │
                    │  id: uuid          │
                    │  email: string     │
                    │  apiKey: string ◄──┤ Matches X-API-Key header
                    │  ...               │
                    └────────────────────┘
```

### Environment Variable Flow

```
~/.openclaw/openclaw.json
         │
         │ skills.entries.habit-tracker.env
         ▼
┌─────────────────────────────────────┐
│  HABIT_TRACKER_API_URL=http://...   │
│  HABIT_TRACKER_API_KEY=abc123...    │
└─────────────────────────────────────┘
         │
         │ Injected into skill execution context
         ▼
┌─────────────────────────────────────┐
│  SKILL.md references:               │
│  $HABIT_TRACKER_API_URL             │
│  $HABIT_TRACKER_API_KEY             │
└─────────────────────────────────────┘
         │
         │ Used in curl commands
         ▼
┌─────────────────────────────────────┐
│  curl -X GET                        │
│    "$HABIT_TRACKER_API_URL/api/..." │
│    -H "X-API-Key: $HABIT_..."       │
└─────────────────────────────────────┘
```

---

## API Reference

### Bot API Endpoints

All endpoints require the `X-API-Key` header.

| Method | Endpoint                           | Description                       |
| ------ | ---------------------------------- | --------------------------------- |
| GET    | `/api/bot/habits/today`            | Get today's habits with status    |
| POST   | `/api/bot/habits/check-in`         | Log a habit by ID                 |
| POST   | `/api/bot/habits/check-in-by-name` | Log a habit by name (fuzzy match) |
| GET    | `/api/bot/habits/summary`          | Get daily completion summary      |
| POST   | `/api/bot/register-chat`           | Register chat for reminders       |

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {
    // Response payload
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

---

## Troubleshooting

### Issue: "Skill not found"

**Symptom**: `openclaw skills list` doesn't show habit-tracker

**Solution**:

```bash
# Ensure skill is in the right place
ls ~/.openclaw/skills/habit-tracker/SKILL.md

# If missing, copy it
cp -r openclaw/habit-tracker ~/.openclaw/skills/

# Refresh skills
# (Send "refresh skills" to OpenClaw or restart gateway)
```

### Issue: "Missing environment variables"

**Symptom**: Skill shows ✗ for env vars

**Solution**: Add to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "habit-tracker": {
        "env": {
          "HABIT_TRACKER_API_URL": "http://localhost:8080",
          "HABIT_TRACKER_API_KEY": "your_key_here"
        }
      }
    }
  }
}
```

### Issue: "API calls fail with 401"

**Symptom**: Unauthorized errors in backend logs

**Solution**:

1. Verify your API key is correct (regenerate if needed)
2. Check the key in OpenClaw config matches exactly
3. Ensure no extra spaces or newlines in the key

### Issue: "Rate limit error"

**Symptom**: `HTTP 429: rate_limit_error`

**Cause**: Claude/OpenAI API rate limit reached

**Solution**:

- Wait a few minutes and try again
- Check your API usage at the provider's console
- Consider upgrading your API tier

### Issue: "Connection refused"

**Symptom**: Backend not reachable

**Solution**:

1. Ensure backend is running: `docker-compose -f docker-compose.dev.yml up`
2. Check the URL in your config (use `http://localhost:8080` for local)
3. For Docker on macOS/Windows, try `http://host.docker.internal:8080`

### Issue: "No response to messages"

**Symptom**: Messages appear in dashboard but no reply

**Solution**:

1. Check for rate limit errors (see above)
2. Send habit-specific messages ("show my habits" not just "hello")
3. Check OpenClaw gateway logs for errors

### Viewing Backend Logs

```bash
# Watch all logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Filter for bot requests
docker-compose -f docker-compose.dev.yml logs -f backend | grep "🤖 Bot"
```

---

## Example Conversations

### Logging a Boolean Habit

```
You: Done with journaling
Bot: ✅ Logged: Journaling - Done! Streak: 12 days.
```

### Logging a Numeric Habit

```
You: Drank 5 glasses of water
Bot: ✅ Logged: Drink Water - 5/8 glasses. Streak: 7 days.
```

### Logging a Duration Habit

```
You: Meditated for 20 minutes
Bot: ✅ Logged: Meditation - 20/30 minutes. Keep going! Streak: 3 days.
```

### Checking Today's Habits

```
You: What's left today?
Bot: 📋 Today's Progress (3/5 completed):

✅ Journaling - Done
✅ Drink Water - 8/8 glasses
✅ Exercise - 45 minutes
⬜ Meditation - 0/30 minutes
⬜ Reading - 0/20 pages

Keep it up! You're on a 7-day streak for most habits.
```

### Getting Daily Summary

```
You: How am I doing today?
Bot: 📊 Daily Summary:

Completed: 3/5 habits (60%)
Best streak: Exercise (15 days 🔥)

Remaining:
- Meditation (target: 30 min)
- Reading (target: 20 pages)

You've got this! 💪
```

### Registering for Reminders

```
You: Register this chat for reminders
Bot: ✅ Telegram chat registered! You'll now receive reminders
for habits you set up in the app. Go to Settings → Reminders
to configure reminder times.
```

---

## Security Considerations

1. **API Key Security**: Never share your API key or commit it to git
2. **HTTPS in Production**: Always use HTTPS for deployed backends
3. **Rate Limiting**: The API has rate limiting to prevent abuse
4. **Token Rotation**: Regenerate your API key periodically

---

## Need Help?

- **GitHub Issues**: Report bugs or request features
- **OpenClaw Discord**: Get help from the OpenClaw community
- **Documentation**: Check the main README.md for general setup

---

_Last updated: February 2026_
