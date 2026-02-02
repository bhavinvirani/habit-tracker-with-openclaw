---
name: habit-tracker
description: Track and manage daily habits via your habit tracker app. Use this skill when the user wants to log habits, check habit progress, see their habits list, get daily summaries, or set up reminders. Responds to messages like "done with reading", "drank 3 glasses", "what's left today?", "show my habits", "register this chat", "how am I doing", or any habit-related updates.
metadata:
  {
    'openclaw':
      { 'emoji': '✅', 'requires': { 'env': ['HABIT_TRACKER_API_URL', 'HABIT_TRACKER_API_KEY'] } },
  }
---

# Habit Tracker Skill

Help users track their daily habits through natural conversation. This skill connects to a habit tracking API to log progress, check status, and manage reminders.

## Configuration

- **Base URL**: `$HABIT_TRACKER_API_URL`
- **Authentication**: Include `X-API-Key: $HABIT_TRACKER_API_KEY` header in ALL requests

## Quick Reference

| User Intent      | Endpoint                           | Method |
| ---------------- | ---------------------------------- | ------ |
| Log a habit      | `/api/bot/habits/check-in-by-name` | POST   |
| See all habits   | `/api/bot/habits/today`            | GET    |
| Daily summary    | `/api/bot/habits/summary`          | GET    |
| Set up reminders | `/api/bot/register-chat`           | POST   |

---

## API Request Patterns

### Standard GET Request

```bash
curl -s -X GET "$HABIT_TRACKER_API_URL/api/bot/habits/today" \
  -H "X-API-Key: $HABIT_TRACKER_API_KEY" \
  -H "Content-Type: application/json"
```

### Standard POST Request

```bash
curl -s -X POST "$HABIT_TRACKER_API_URL/api/bot/habits/check-in-by-name" \
  -H "X-API-Key: $HABIT_TRACKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "reading", "completed": true}'
```

---

## Endpoints

### 1. Get Today's Habits

**`GET /api/bot/habits/today`**

Returns all habits for today with their current status.

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2026-02-01",
    "habits": [
      {
        "id": "uuid-here",
        "name": "Drink Water",
        "type": "NUMERIC",
        "target": 8,
        "unit": "glasses",
        "category": "Health",
        "completed": false,
        "currentValue": 3,
        "streak": 12
      }
    ],
    "summary": { "total": 5, "completed": 2, "remaining": 3 }
  }
}
```

**When to use**: User asks "show my habits", "what do I need to do today", "list my habits"

---

### 2. Log a Habit by Name (Primary Method)

**`POST /api/bot/habits/check-in-by-name`**

Use fuzzy matching to find and log a habit. This is the preferred method.

**Request Body:**

```json
{
  "name": "water",
  "completed": true,
  "value": 3
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Partial or full habit name (fuzzy matched) |
| `completed` | boolean | ✅ | Whether the habit is done |
| `value` | number | ❌ | For NUMERIC/DURATION habits only |

**Success Response:**

```json
{
  "success": true,
  "message": "Logged: Drink Water - 3/8 glasses. Streak: 12 days.",
  "data": {
    "habit": "Drink Water",
    "status": "3/8 glasses",
    "completed": false,
    "streak": 12
  }
}
```

**Ambiguous Match Response (multiple habits matched):**

```json
{
  "success": true,
  "message": "Multiple habits match. Please specify which one.",
  "data": {
    "matches": [
      {
        "id": "uuid-1",
        "name": "Morning Reading",
        "type": "DURATION",
        "target": 30,
        "unit": "minutes"
      },
      {
        "id": "uuid-2",
        "name": "Evening Reading",
        "type": "DURATION",
        "target": 20,
        "unit": "pages"
      }
    ]
  }
}
```

**⚠️ Handling Ambiguous Matches:**
When response contains a `matches` array, ask the user which habit they meant, then use check-in by ID endpoint.

---

### 3. Log a Habit by ID

**`POST /api/bot/habits/check-in`**

Use when you have the exact habit ID (after disambiguation).

**Request Body:**

```json
{
  "habitId": "uuid-here",
  "completed": true,
  "value": 30
}
```

---

### 4. Get Daily Summary

**`GET /api/bot/habits/summary`**

Returns a summary with completed habits, remaining habits, and streaks.

---

### 5. Register Chat for Reminders

**`POST /api/bot/register-chat`**

**Request Body:**

```json
{
  "provider": "telegram",
  "chatId": "123456789",
  "username": "johndoe"
}
```

Provider options: `telegram`, `whatsapp`, `discord`

---

## Habit Types & Value Extraction

### BOOLEAN Habits

- Examples: "Journal", "Take vitamins", "Make bed"
- Value: Not needed, just set `completed: true`
- User: "Done with journaling" → `{"name": "journal", "completed": true}`

### NUMERIC Habits

- Examples: "Drink Water" (8 glasses), "Steps" (10000)
- Value: Extract the number from user message
- User: "Drank 5 glasses" → `{"name": "water", "completed": true, "value": 5}`

### DURATION Habits

- Examples: "Meditation" (30 min), "Reading" (20 min)
- Value: Extract time in minutes
- User: "Meditated for 25 minutes" → `{"name": "meditation", "completed": true, "value": 25}`
- User: "Read for half an hour" → `{"name": "reading", "completed": true, "value": 30}`

---

## Behavior Guidelines

### Message Interpretation

1. **Detect Intent**:
   - Logging: "done with...", "finished...", "completed...", "did...", numbers + habit
   - Viewing: "show...", "list...", "what's...", "my habits"
   - Summary: "how am I...", "progress", "summary", "status"
   - Reminders: "register", "set up reminders", "notifications"

2. **Extract Habit Info**:
   - Identify habit name (even partial: "water" → "Drink Water")
   - Extract numeric values if present
   - Convert time expressions ("half an hour" → 30, "an hour" → 60)

3. **Handle Uncertainty**:
   - If unsure which habit, ask for clarification
   - If value unclear for NUMERIC/DURATION, ask: "How many?" or "How long?"

### Response Formatting

After logging, always include:

- ✅ Habit name
- 📊 Current progress (e.g., "5/8 glasses" or "Done")
- 🔥 Current streak

Example: `✅ Logged: Meditation - 25/30 minutes. Streak: 5 days.`

For habit lists:

```
📋 Today's Habits (3/5):
✅ Journaling - Done
✅ Drink Water - 8/8 glasses
⬜ Meditation - 0/30 minutes
```

---

## Error Handling

| Error            | User Message                                                         |
| ---------------- | -------------------------------------------------------------------- |
| 401 Unauthorized | "I can't connect. Please check your API key setup."                  |
| 404 Not Found    | "I couldn't find that habit. Try 'show my habits' to see your list." |
| No match found   | "I couldn't find a habit called '[name]'. What did you mean?"        |
| Multiple matches | Show options and ask user to pick one                                |
| Network error    | "I can't reach the habit tracker. Is the server running?"            |

---

## Example Conversations

### Basic Viewing

```
User: Show my habits
Bot: 📋 Today's Habits (2/4):
✅ Drink Water - 6/8 glasses
✅ Morning Stretch - Done
⬜ Reading - 0/30 minutes
⬜ Meditation - 0/20 minutes

User: What's left today?
Bot: You have 2 habits remaining:
⬜ Reading - 0/30 minutes
⬜ Meditation - 0/20 minutes

User: What do I need to do?
Bot: 📋 Today's Habits (1/5):
✅ Morning Stretch - Done
⬜ Drink Water - 3/8 glasses (5 more to go!)
⬜ Reading - 0/30 minutes
⬜ Meditation - 0/20 minutes
⬜ Journaling - Not started
```

### Logging Boolean Habits

```
User: Done with journaling
Bot: ✅ Logged: Journaling - Done. Streak: 14 days! 🔥

User: Finished my morning stretch
Bot: ✅ Logged: Morning Stretch - Done. Streak: 7 days!

User: I took my vitamins
Bot: ✅ Logged: Take Vitamins - Done. Keep it up! Streak: 3 days.

User: Made my bed
Bot: ✅ Logged: Make Bed - Done. Streak: 21 days! 🏆

User: completed workout
Bot: ✅ Logged: Workout - Done. Streak: 5 days! 💪
```

### Logging Numeric Habits

```
User: Drank 5 glasses of water
Bot: ✅ Logged: Drink Water - 5/8 glasses. 3 more to reach your goal! Streak: 12 days.

User: Had 3 more glasses
Bot: ✅ Logged: Drink Water - 8/8 glasses. Goal reached! 🎉 Streak: 12 days.

User: Just walked 5000 steps
Bot: ✅ Logged: Daily Steps - 5000/10000 steps. Halfway there! Streak: 4 days.

User: ate 2 servings of veggies
Bot: ✅ Logged: Eat Vegetables - 2/3 servings. Almost there! Streak: 8 days.

User: 10000 steps done!
Bot: ✅ Logged: Daily Steps - 10000/10000 steps. Goal reached! 🎉 Streak: 5 days!
```

### Logging Duration Habits

```
User: Just finished 30 minutes of reading
Bot: ✅ Logged: Reading - 30/30 minutes. Goal reached! 🎉 Streak: 8 days.

User: Meditated for 25 minutes
Bot: ✅ Logged: Meditation - 25/30 minutes. So close! Streak: 15 days.

User: Did meditation
Bot: How long did you meditate? Your goal is 30 minutes.

User: About 15 minutes
Bot: ✅ Logged: Meditation - 15/30 minutes. Halfway there! Streak: 15 days.

User: Read for half an hour
Bot: ✅ Logged: Reading - 30/30 minutes. Goal reached! 🎉 Streak: 9 days.

User: studied for an hour
Bot: ✅ Logged: Study Session - 60/45 minutes. Exceeded goal! 🚀 Streak: 3 days.

User: practiced piano for 20 mins
Bot: ✅ Logged: Piano Practice - 20/30 minutes. Great start! Streak: 11 days.

User: exercised for 45 minutes
Bot: ✅ Logged: Exercise - 45/30 minutes. Exceeded goal! 🚀 Streak: 6 days.
```

### Natural Language Variations

```
User: I finally sat down and cleared my mind for 20 minutes
Bot: ✅ Logged: Meditation - 20/30 minutes. Nice work! Streak: 15 days.

User: Just got back from a walk, about 7k steps
Bot: ✅ Logged: Daily Steps - 7000/10000 steps. Getting there! Streak: 4 days.

User: Been drinking water all day, probably 6 glasses so far
Bot: ✅ Logged: Drink Water - 6/8 glasses. 2 more to go! Streak: 12 days.

User: Squeezed in some reading before bed, maybe 20 mins
Bot: ✅ Logged: Reading - 20/30 minutes. Almost there! Streak: 8 days.

User: Morning routine done - stretched and made bed
Bot: ✅ Logged: Morning Stretch - Done. Streak: 7 days.
Which other habit did you complete? I can log "Make Bed" too if you'd like.

User: Yeah log that too
Bot: ✅ Logged: Make Bed - Done. Streak: 21 days! 🏆
```

### Asking for Clarification

```
User: Did reading
Bot: How long did you read for? Your goal is 30 minutes.

User: 25
Bot: ✅ Logged: Reading - 25/30 minutes. Almost there! Streak: 8 days.

---

User: Logged water
Bot: How many glasses did you drink?

User: 4
Bot: ✅ Logged: Drink Water - 4/8 glasses. Halfway there! Streak: 12 days.

---

User: Done with exercise
Bot: I see you have multiple exercise habits:
1. Morning Workout (30 mins)
2. Evening Walk (20 mins)
Which one did you complete?

User: The morning one
Bot: ✅ Logged: Morning Workout - Done. Great start to the day! 💪 Streak: 5 days.
```

### Progress & Summary

```
User: How am I doing?
Bot: 📊 Daily Summary: 4/5 completed (80%)
✅ Drink Water - 8/8 glasses
✅ Morning Stretch - Done
✅ Journaling - Done
✅ Meditation - 30/30 minutes
⬜ Reading - 0/30 minutes

Top streak: Journaling (14 days 🔥)

User: What's my progress?
Bot: 📊 You're doing great today!
• 3/5 habits completed (60%)
• Current streaks: 🔥 Journaling (14), Drink Water (12), Stretch (7)
• Best streak this month: Journaling at 14 days!

User: Summary
Bot: 📊 Daily Progress: 2/4 (50%)
Remaining:
• Reading - 10/30 mins (20 more minutes)
• Meditation - Not started

You've got this! 💪
```

### Reminders & Chat Registration

```
User: Set up reminders
Bot: I'll register this chat for habit reminders. What platform are we on?

User: Telegram
Bot: ✅ Chat registered! You'll receive reminders for incomplete habits in the evening.

---

User: Register this chat for notifications
Bot: ✅ Done! This Telegram chat is now registered for habit reminders. I'll nudge you if you forget to log habits.

User: Stop reminders
Bot: Reminders disabled for this chat. You can re-enable them anytime by saying "set up reminders".
```

### Edge Cases & Error Handling

```
User: Logged sleeping
Bot: I couldn't find a habit called "sleeping". Here are your current habits:
• Drink Water, Morning Stretch, Reading, Meditation, Journaling
Which one did you mean?

User: Hello
Bot: Hey! Ready to track your habits? You can:
• Say "show my habits" to see today's list
• Log progress like "drank 5 glasses of water"
• Ask "how am I doing?" for a summary

User: What can you do?
Bot: I can help you track your daily habits! Try:
📋 "Show my habits" - see today's list
✅ "Done with [habit]" - log a completion
📊 "How am I doing?" - daily summary
🔔 "Set up reminders" - get notifications

User: Thanks!
Bot: You're welcome! Keep up the great work on your habits! 🌟
```

### Motivational Responses

```
User: Completed all my habits!
Bot: 🎉 Amazing! You've completed all 5 habits today!
Current streaks:
🔥 Journaling - 14 days (your best!)
🔥 Drink Water - 12 days
🔥 Meditation - 8 days
Keep this momentum going! 💪

User: Finally hit my water goal
Bot: ✅ Logged: Drink Water - 8/8 glasses. Goal reached! 🎉
That's 12 days in a row - you're building a solid hydration habit! 💧

User: Reached 30 day streak on meditation!
Bot: 🏆 INCREDIBLE! 30 days of consistent meditation!
You've officially built a habit. This is a major milestone - celebrate it! 🧘‍♀️✨
```
