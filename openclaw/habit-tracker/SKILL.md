---
name: habit-tracker
description: Track and manage daily habits via your habit tracker app
metadata:
  { 'openclaw': { 'requires': { 'env': ['HABIT_TRACKER_API_URL', 'HABIT_TRACKER_API_KEY'] } } }
---

# Habit Tracker Skill

You can help the user track their habits using their habit tracker app. The API is at `$HABIT_TRACKER_API_URL`.

## Authentication

All requests must include the header: `X-API-Key: $HABIT_TRACKER_API_KEY`

## Available Actions

### Check today's habits

`GET /api/bot/habits/today`

Returns a list of today's habits with completion status, current values, targets, and streaks.

Response example:

```json
{
  "data": {
    "habits": [
      {
        "id": "uuid",
        "name": "Drink Water",
        "type": "NUMERIC",
        "target": 8,
        "unit": "glasses",
        "completed": false,
        "currentValue": 3,
        "streak": 12
      }
    ],
    "summary": { "total": 5, "completed": 2, "remaining": 3 }
  }
}
```

### Log a habit by name (preferred)

`POST /api/bot/habits/check-in-by-name`

Body: `{ "name": "<fuzzy habit name>", "value": <number if applicable>, "completed": true }`

The API performs fuzzy matching on habit names. If the response contains a `"matches"` array, multiple habits matched — ask the user which one they meant and then use the exact habit ID endpoint.

### Log a habit by ID

`POST /api/bot/habits/check-in`

Body: `{ "habitId": "<uuid>", "completed": true, "value": <number> }`

Use this when you already know the exact habit ID (e.g., after disambiguation).

### Get daily summary

`GET /api/bot/habits/summary`

Returns completion stats, completed habits, and remaining habits with streaks.

### Register this chat for reminders

`POST /api/bot/register-chat`

Body: `{ "provider": "telegram", "chatId": "<this_chat_id>", "username": "<username>" }`

Call this when the user asks to set up reminders. Use the appropriate provider name based on the messaging platform.

## Behavior Guidelines

- When the user says things like "done with reading", "drank 3 glasses of water", "finished meditating for 20 minutes" — identify the habit and log it using check-in-by-name.
- For **NUMERIC** habits (e.g., "Drink Water"), extract the numeric value from the message (e.g., "3 glasses" → value: 3).
- For **DURATION** habits (e.g., "Meditate"), extract the time value in the habit's unit (e.g., "20 minutes" → value: 20).
- For **BOOLEAN** habits (e.g., "Journal"), just set completed: true.
- If multiple habits match, present the options and ask the user to pick one.
- After logging, always confirm with: the habit name, current progress/status, and streak count.
- If the user asks "how am I doing today?", "what's left?", or similar — use the summary endpoint.
- If the user asks to see their habits — use the today endpoint and format it as a readable list.
