# Habit Tracker API Contract

> Base URL: `http://localhost:8080/api`  
> All endpoints (except auth) require `Authorization: Bearer <token>` header

---

## Authentication

### POST `/auth/register`

Create a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token"
  }
}
```

---

### POST `/auth/login`

Authenticate and receive JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token"
  }
}
```

**Note:** Also sets an HTTP-only cookie `refreshToken` for token refresh.

---

### POST `/auth/refresh`

Refresh access token using refresh token cookie.

**Request:**
No body required. The refresh token is sent automatically via HTTP-only cookie.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token"
  }
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired refresh token"
  }
}
```

---

### POST `/auth/logout`

Logout and invalidate refresh token. **Requires authentication.**

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/auth/me`

Get current authenticated user. **Requires authentication.**

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "timezone": "America/New_York",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

---

## Habits

### GET `/habits`

Get all habits for the authenticated user.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `isActive` | boolean | - | Filter by active status |
| `category` | string | - | Filter by category |
| `frequency` | string | - | Filter by frequency (DAILY, WEEKLY) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habits": [
      {
        "id": "uuid",
        "name": "Morning Exercise",
        "description": "30 min workout",
        "category": "Health",
        "frequency": "DAILY",
        "frequencyConfig": {
          "type": "DAILY",
          "daysOfWeek": null,
          "timesPerWeek": null
        },
        "habitType": "BOOLEAN",
        "targetValue": null,
        "unit": null,
        "color": "#10B981",
        "icon": "🏃",
        "isActive": true,
        "currentStreak": 5,
        "longestStreak": 12,
        "totalCompletions": 42,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### POST `/habits`

Create a new habit.

**Request:**

```json
{
  "name": "Morning Exercise",
  "description": "30 min workout every morning",
  "category": "Health",
  "frequency": "DAILY",
  "frequencyConfig": {
    "type": "DAILY",
    "daysOfWeek": null,
    "timesPerWeek": null
  },
  "habitType": "BOOLEAN",
  "targetValue": null,
  "unit": null,
  "color": "#10B981",
  "icon": "🏃"
}
```

**Frequency Config Examples:**

```json
// Daily habit
{ "type": "DAILY", "daysOfWeek": null, "timesPerWeek": null }

// Weekly - specific days (Mon, Wed, Fri)
{ "type": "WEEKLY", "daysOfWeek": [1, 3, 5], "timesPerWeek": null }

// Weekly - X times per week (any days)
{ "type": "WEEKLY", "daysOfWeek": null, "timesPerWeek": 3 }
```

**Habit Types:**

- `BOOLEAN` - Yes/No (did you do it?)
- `NUMERIC` - Count (glasses of water: 8)
- `DURATION` - Minutes (meditation: 20 min)

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "uuid",
      "name": "Morning Exercise",
      "...": "..."
    }
  }
}
```

---

### GET `/habits/:id`

Get a single habit with stats.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "uuid",
      "name": "Morning Exercise",
      "description": "30 min workout",
      "category": "Health",
      "frequency": "DAILY",
      "frequencyConfig": { "type": "DAILY" },
      "habitType": "BOOLEAN",
      "color": "#10B981",
      "icon": "🏃",
      "isActive": true,
      "currentStreak": 5,
      "longestStreak": 12,
      "totalCompletions": 42,
      "completionRate": 85.5,
      "lastCompletedAt": "2026-01-29T08:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-29T08:00:00Z"
    }
  }
}
```

---

### PATCH `/habits/:id`

Update a habit.

**Request:** (partial update)

```json
{
  "name": "Evening Exercise",
  "isActive": false
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habit": { "...": "updated habit" }
  }
}
```

---

### DELETE `/habits/:id`

Delete a habit and all its logs.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Habit deleted successfully"
}
```

---

## Tracking (Daily Check-ins)

### GET `/tracking/today`

Get today's check-in status for all habits.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "date": "2026-01-29",
    "habits": [
      {
        "habitId": "uuid",
        "name": "Morning Exercise",
        "category": "Health",
        "habitType": "BOOLEAN",
        "targetValue": null,
        "color": "#10B981",
        "icon": "🏃",
        "isCompleted": true,
        "value": null,
        "logId": "log-uuid",
        "completedAt": "2026-01-29T08:00:00Z",
        "notes": "Felt great!",
        "currentStreak": 6
      },
      {
        "habitId": "uuid-2",
        "name": "Drink Water",
        "category": "Health",
        "habitType": "NUMERIC",
        "targetValue": 8,
        "unit": "glasses",
        "color": "#3B82F6",
        "icon": "💧",
        "isCompleted": false,
        "value": 5,
        "logId": "log-uuid-2",
        "currentStreak": 0
      }
    ],
    "summary": {
      "total": 5,
      "completed": 3,
      "completionRate": 60
    }
  }
}
```

---

### POST `/tracking/check-in`

Log a habit completion (tick the checkbox).

**Request:**

```json
{
  "habitId": "uuid",
  "date": "2026-01-29",
  "completed": true,
  "value": null,
  "notes": "Morning run completed!"
}
```

**For numeric/duration habits:**

```json
{
  "habitId": "uuid",
  "date": "2026-01-29",
  "completed": true,
  "value": 8,
  "notes": "Drank 8 glasses of water"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "log": {
      "id": "log-uuid",
      "habitId": "uuid",
      "date": "2026-01-29",
      "completed": true,
      "value": null,
      "notes": "Morning run completed!",
      "createdAt": "2026-01-29T08:00:00Z"
    },
    "streak": {
      "current": 6,
      "longest": 12,
      "isNewRecord": false
    },
    "milestone": null
  }
}
```

**When milestone is reached:**

```json
{
  "success": true,
  "data": {
    "log": { "...": "..." },
    "streak": { "current": 7, "longest": 12 },
    "milestone": {
      "type": "STREAK",
      "value": 7,
      "title": "1 Week Streak! 🔥",
      "message": "You've completed this habit 7 days in a row!"
    }
  }
}
```

---

### DELETE `/tracking/check-in`

Undo a check-in (untick).

**Request:**

```json
{
  "habitId": "uuid",
  "date": "2026-01-29"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Check-in removed"
}
```

---

### GET `/tracking/history`

Get tracking history for calendar/heatmap.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string | yes | Start date (YYYY-MM-DD) |
| `endDate` | string | yes | End date (YYYY-MM-DD) |
| `habitId` | string | no | Filter by specific habit |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2026-01-29",
        "totalHabits": 5,
        "completedHabits": 4,
        "completionRate": 80,
        "logs": [
          {
            "habitId": "uuid",
            "habitName": "Morning Exercise",
            "completed": true,
            "value": null
          }
        ]
      },
      {
        "date": "2026-01-28",
        "totalHabits": 5,
        "completedHabits": 5,
        "completionRate": 100,
        "logs": ["..."]
      }
    ]
  }
}
```

---

### GET `/tracking/date/:date`

Get all habits and their status for a specific date.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "date": "2026-01-25",
    "habits": [
      {
        "habitId": "uuid",
        "name": "Morning Exercise",
        "isCompleted": true,
        "value": null,
        "notes": "30 min run",
        "completedAt": "2026-01-25T08:30:00Z"
      }
    ]
  }
}
```

---

## Analytics

### GET `/analytics/overview`

Get dashboard overview stats.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalHabits": 5,
      "activeHabits": 4,
      "completedToday": 3,
      "pendingToday": 1,
      "overallCompletionRate": 78.5,
      "currentBestStreak": {
        "habitId": "uuid",
        "habitName": "Morning Exercise",
        "streak": 12
      },
      "totalCompletionsAllTime": 342,
      "thisWeek": {
        "completed": 18,
        "total": 28,
        "rate": 64.3
      },
      "thisMonth": {
        "completed": 85,
        "total": 112,
        "rate": 75.9
      }
    }
  }
}
```

---

### GET `/analytics/weekly`

Get weekly breakdown for charts.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `weeks` | number | 4 | Number of weeks to include |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "weekly": [
      {
        "weekStart": "2026-01-27",
        "weekEnd": "2026-02-02",
        "days": [
          { "date": "2026-01-27", "day": "Mon", "completed": 4, "total": 5, "rate": 80 },
          { "date": "2026-01-28", "day": "Tue", "completed": 5, "total": 5, "rate": 100 },
          { "date": "2026-01-29", "day": "Wed", "completed": 3, "total": 5, "rate": 60 }
        ],
        "summary": {
          "completed": 12,
          "total": 15,
          "rate": 80
        }
      }
    ]
  }
}
```

---

### GET `/analytics/monthly`

Get monthly breakdown.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `months` | number | 6 | Number of months to include |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "monthly": [
      {
        "month": "2026-01",
        "monthName": "January 2026",
        "completed": 85,
        "total": 112,
        "rate": 75.9,
        "byCategory": [
          { "category": "Health", "completed": 50, "total": 60, "rate": 83.3 },
          { "category": "Productivity", "completed": 35, "total": 52, "rate": 67.3 }
        ]
      }
    ]
  }
}
```

---

### GET `/analytics/heatmap`

Get heatmap data for GitHub-style calendar.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | number | current | Year to get data for |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "year": 2026,
    "heatmap": [
      { "date": "2026-01-01", "count": 5, "level": 4 },
      { "date": "2026-01-02", "count": 3, "level": 2 },
      { "date": "2026-01-03", "count": 0, "level": 0 }
    ],
    "legend": {
      "0": "No activity",
      "1": "1-2 habits",
      "2": "3-4 habits",
      "3": "5-6 habits",
      "4": "7+ habits"
    }
  }
}
```

---

### GET `/analytics/habit/:habitId`

Get detailed stats for a specific habit.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "uuid",
      "name": "Morning Exercise"
    },
    "stats": {
      "totalCompletions": 42,
      "currentStreak": 6,
      "longestStreak": 12,
      "averagePerWeek": 5.2,
      "completionRate": {
        "allTime": 85.5,
        "thisWeek": 100,
        "thisMonth": 90,
        "last30Days": 87
      },
      "bestDay": "Monday",
      "worstDay": "Sunday",
      "byDayOfWeek": [
        { "day": "Mon", "rate": 95 },
        { "day": "Tue", "rate": 88 },
        { "day": "Wed", "rate": 82 },
        { "day": "Thu", "rate": 85 },
        { "day": "Fri", "rate": 78 },
        { "day": "Sat", "rate": 70 },
        { "day": "Sun", "rate": 65 }
      ]
    },
    "milestones": [
      { "type": "STREAK", "value": 7, "achievedAt": "2026-01-15" },
      { "type": "STREAK", "value": 14, "achievedAt": "2026-01-22" },
      { "type": "COMPLETIONS", "value": 50, "achievedAt": "2026-01-20" }
    ]
  }
}
```

---

### GET `/analytics/streaks`

Get all streak information.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "streaks": [
      {
        "habitId": "uuid",
        "habitName": "Morning Exercise",
        "color": "#10B981",
        "icon": "🏃",
        "currentStreak": 6,
        "longestStreak": 12,
        "lastCompletedAt": "2026-01-29T08:00:00Z",
        "isActiveToday": true
      }
    ],
    "summary": {
      "totalActiveStreaks": 3,
      "longestCurrentStreak": 12,
      "habitsAtRisk": [
        {
          "habitId": "uuid-2",
          "habitName": "Read Book",
          "currentStreak": 5,
          "lastCompleted": "2026-01-28"
        }
      ]
    }
  }
}
```

---

### GET `/analytics/insights`

Get AI-style insights and suggestions.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "streak_risk",
        "title": "Streak at Risk",
        "message": "Your 'Morning Exercise' streak of 12 days might break - you haven't logged it today!",
        "habitId": "uuid",
        "priority": "high"
      },
      {
        "type": "improvement",
        "title": "Great Progress!",
        "message": "Your completion rate improved by 15% this week compared to last week.",
        "priority": "low"
      },
      {
        "type": "suggestion",
        "title": "Try Stacking",
        "message": "You complete 'Read Book' and 'Meditation' together 80% of the time. Consider habit stacking!",
        "priority": "medium"
      }
    ]
  }
}
```

---

### GET `/analytics/calendar`

Get detailed day-by-day data for calendar view.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | string (YYYY-MM-DD) | 30 days ago | Start of range |
| `endDate` | string (YYYY-MM-DD) | today | End of range |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "days": [
      {
        "date": "2026-01-29",
        "completed": 4,
        "total": 5,
        "percentage": 80,
        "habits": [
          {
            "id": "uuid",
            "name": "Exercise",
            "color": "#10B981",
            "icon": "🏃",
            "completed": true,
            "value": null
          },
          {
            "id": "uuid-2",
            "name": "Read",
            "color": "#3B82F6",
            "icon": "📚",
            "completed": false,
            "value": null
          }
        ]
      }
    ],
    "summary": {
      "totalCompleted": 120,
      "totalPossible": 150,
      "percentage": 80
    }
  }
}
```

---

### GET `/analytics/categories`

Get category-wise completion breakdown.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Health",
        "habitCount": 3,
        "completedToday": 2,
        "completionRate": 85.5,
        "habits": ["Exercise", "Drink Water", "Sleep 8hrs"]
      },
      {
        "category": "Learning",
        "habitCount": 2,
        "completedToday": 1,
        "completionRate": 72.3,
        "habits": ["Read Book", "Practice Coding"]
      }
    ]
  }
}
```

---

### GET `/analytics/comparison`

Get week-over-week comparison.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "thisWeek": {
      "completed": 28,
      "total": 35,
      "percentage": 80
    },
    "lastWeek": {
      "completed": 25,
      "total": 35,
      "percentage": 71.4
    },
    "change": {
      "absolute": 3,
      "percentage": 8.6,
      "trend": "improving"
    }
  }
}
```

---

### GET `/analytics/trend`

Get monthly trend data (last 30 days rolling).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "trend": [
      { "date": "2026-01-01", "completed": 4, "total": 5, "percentage": 80 },
      { "date": "2026-01-02", "completed": 5, "total": 5, "percentage": 100 }
    ],
    "average": 82.5,
    "best": { "date": "2026-01-15", "percentage": 100 },
    "worst": { "date": "2026-01-10", "percentage": 40 }
  }
}
```

---

### GET `/analytics/productivity`

Get comprehensive productivity score with breakdown.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "score": 78,
    "grade": "B",
    "trend": "improving",
    "breakdown": {
      "consistency": 32,
      "streaks": 24,
      "completion": 22
    }
  }
}
```

**Score Components:**

- `consistency` (0-40): Days with at least one completion in last 30 days
- `streaks` (0-30): Based on current active streak lengths
- `completion` (0-30): Overall completion rate

**Grades:**

- A: 85-100
- B: 70-84
- C: 55-69
- D: 40-54
- F: 0-39

---

### GET `/analytics/performance`

Get best and worst performing days/habits analysis.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "bestDayOfWeek": {
      "day": "Monday",
      "dayNumber": 1,
      "completionRate": 92.5
    },
    "worstDayOfWeek": {
      "day": "Saturday",
      "dayNumber": 6,
      "completionRate": 55.0
    },
    "byDayOfWeek": [
      { "day": "Sunday", "dayNumber": 0, "completionRate": 65.0, "completions": 13 },
      { "day": "Monday", "dayNumber": 1, "completionRate": 92.5, "completions": 18 }
    ],
    "mostConsistentHabit": {
      "id": "uuid",
      "name": "Morning Exercise",
      "color": "#10B981",
      "rate": 96.7
    },
    "leastConsistentHabit": {
      "id": "uuid-2",
      "name": "Evening Journal",
      "color": "#F59E0B",
      "rate": 43.3
    }
  }
}
```

---

### GET `/analytics/correlations`

Find habits that tend to be completed together (or inversely).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "correlations": [
      {
        "habit1": { "id": "uuid-1", "name": "Morning Exercise" },
        "habit2": { "id": "uuid-2", "name": "Healthy Breakfast" },
        "correlation": 0.82,
        "interpretation": "Strong positive - often completed together"
      },
      {
        "habit1": { "id": "uuid-3", "name": "Late Night TV" },
        "habit2": { "id": "uuid-4", "name": "Early Wake Up" },
        "correlation": -0.65,
        "interpretation": "Strong negative - rarely done on same day"
      }
    ]
  }
}
```

**Correlation Values:**

- `> 0.5`: Strong positive correlation
- `0.2 to 0.5`: Moderate positive correlation
- `-0.2 to 0.2`: Weak/no correlation
- `-0.5 to -0.2`: Moderate negative correlation
- `< -0.5`: Strong negative correlation

---

### GET `/analytics/predictions`

Get streak milestone predictions and risk assessment.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "habitId": "uuid",
        "habitName": "Morning Exercise",
        "currentStreak": 25,
        "predictedDaysToMilestone": 5,
        "nextMilestone": 30,
        "riskLevel": "low",
        "riskReason": null
      },
      {
        "habitId": "uuid-2",
        "habitName": "Read Book",
        "currentStreak": 12,
        "predictedDaysToMilestone": 9,
        "nextMilestone": 21,
        "riskLevel": "medium",
        "riskReason": "Missed some days recently"
      },
      {
        "habitId": "uuid-3",
        "habitName": "Meditation",
        "currentStreak": 5,
        "predictedDaysToMilestone": 2,
        "nextMilestone": 7,
        "riskLevel": "high",
        "riskReason": "Declining activity pattern"
      }
    ]
  }
}
```

**Milestone Targets:** 7, 14, 21, 30, 60, 90, 100, 180, 365 days

---

## Milestones

### GET `/milestones`

Get all achieved milestones.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `habitId` | string | - | Filter by habit |
| `limit` | number | 50 | Max results |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "id": "uuid",
        "habitId": "habit-uuid",
        "habitName": "Morning Exercise",
        "type": "STREAK",
        "value": 30,
        "title": "30 Day Streak! 🔥",
        "description": "You've completed this habit 30 days in a row!",
        "achievedAt": "2026-01-29T08:00:00Z"
      },
      {
        "id": "uuid-2",
        "habitId": "habit-uuid",
        "habitName": "Morning Exercise",
        "type": "COMPLETIONS",
        "value": 100,
        "title": "100 Completions! 💯",
        "description": "You've completed this habit 100 times total!",
        "achievedAt": "2026-01-20T08:00:00Z"
      }
    ]
  }
}
```

---

## Categories

### GET `/categories`

Get all categories with habit counts.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "categories": [
      { "name": "Health", "habitCount": 3, "color": "#10B981" },
      { "name": "Productivity", "habitCount": 2, "color": "#3B82F6" },
      { "name": "Learning", "habitCount": 1, "color": "#8B5CF6" }
    ],
    "defaultCategories": [
      "Health",
      "Productivity",
      "Learning",
      "Fitness",
      "Mindfulness",
      "Finance",
      "Social",
      "Other"
    ]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Not allowed to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Milestone Types & Values

**Streak Milestones:**

- 7 days (1 week)
- 14 days (2 weeks)
- 30 days (1 month)
- 60 days (2 months)
- 90 days (3 months)
- 180 days (6 months)
- 365 days (1 year)

**Completion Milestones:**

- 10 completions
- 25 completions
- 50 completions
- 100 completions
- 250 completions
- 500 completions
- 1000 completions

---

## Habit Templates

### GET `/templates`

Get all available habit templates.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | - | Filter by category |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid",
        "name": "Morning Exercise",
        "description": "30 minutes of exercise every morning",
        "category": "Health",
        "icon": "🏃",
        "color": "#10B981",
        "habitType": "BOOLEAN",
        "targetValue": null,
        "unit": null,
        "frequency": "DAILY",
        "isSystem": true
      },
      {
        "id": "uuid-2",
        "name": "Drink Water",
        "description": "Stay hydrated throughout the day",
        "category": "Health",
        "icon": "💧",
        "color": "#3B82F6",
        "habitType": "NUMERIC",
        "targetValue": 8,
        "unit": "glasses",
        "frequency": "DAILY",
        "isSystem": true
      }
    ]
  }
}
```

---

### POST `/templates/:id/use`

Create a habit from a template.

**Request:** (optional overrides)

```json
{
  "name": "Custom Name",
  "color": "#FF5733"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "new-habit-uuid",
      "templateId": "template-uuid",
      "...": "habit object"
    }
  }
}
```

---

## Habit Ordering

### PATCH `/habits/reorder`

Update the sort order of habits.

**Request:**

```json
{
  "habitIds": ["uuid-1", "uuid-3", "uuid-2", "uuid-4"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Habits reordered successfully"
}
```

---

## Habit Archiving

### POST `/habits/:id/archive`

Archive a habit (keeps history, hides from daily view).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "uuid",
      "isArchived": true
    }
  }
}
```

---

### POST `/habits/:id/unarchive`

Restore an archived habit.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habit": {
      "id": "uuid",
      "isArchived": false
    }
  }
}
```

---

### GET `/habits/archived`

Get all archived habits.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "habits": [
      {
        "id": "uuid",
        "name": "Old Habit",
        "isArchived": true,
        "archivedAt": "2026-01-15T00:00:00Z",
        "totalCompletions": 45,
        "longestStreak": 14
      }
    ]
  }
}
```

---

## Books (Reading Tracker)

### GET `/books`

Get all books for the user.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter: WANT_TO_READ, READING, FINISHED, ABANDONED |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "uuid",
        "title": "Atomic Habits",
        "author": "James Clear",
        "coverUrl": "https://...",
        "totalPages": 320,
        "currentPage": 150,
        "progress": 47,
        "status": "READING",
        "rating": null,
        "startedAt": "2026-01-15T00:00:00Z",
        "finishedAt": null
      },
      {
        "id": "uuid-2",
        "title": "Deep Work",
        "author": "Cal Newport",
        "totalPages": 296,
        "currentPage": 296,
        "progress": 100,
        "status": "FINISHED",
        "rating": 5,
        "startedAt": "2025-12-01T00:00:00Z",
        "finishedAt": "2025-12-20T00:00:00Z"
      }
    ],
    "stats": {
      "totalBooks": 15,
      "reading": 2,
      "finished": 10,
      "wantToRead": 3,
      "booksThisYear": 8,
      "pagesThisYear": 2450
    }
  }
}
```

---

### GET `/books/current`

Get the currently reading book (for dashboard widget). Returns the most recently started book with status "READING".

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "book": {
      "id": "uuid",
      "title": "Atomic Habits",
      "author": "James Clear",
      "coverUrl": "https://...",
      "totalPages": 320,
      "currentPage": 150,
      "progress": 47,
      "status": "READING",
      "startedAt": "2026-01-15T00:00:00Z",
      "pagesReadThisWeek": 45,
      "estimatedDaysToFinish": 12
    }
  }
}
```

**Response when no book is being read:** `200 OK`

```json
{
  "success": true,
  "data": {
    "book": null
  }
}
```

---

### POST `/books`

Add a new book.

**Request:**

```json
{
  "title": "Atomic Habits",
  "author": "James Clear",
  "coverUrl": "https://...",
  "totalPages": 320,
  "status": "WANT_TO_READ"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "book": {
      "id": "uuid",
      "title": "Atomic Habits",
      "author": "James Clear",
      "status": "WANT_TO_READ",
      "...": "..."
    }
  }
}
```

---

### PATCH `/books/:id`

Update a book (progress, status, rating, notes).

**Request:**

```json
{
  "currentPage": 200,
  "status": "READING",
  "notes": "Great insights on habit formation"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "book": { "...": "updated book" }
  }
}
```

---

### POST `/books/:id/log`

Log reading progress for today.

**Request:**

```json
{
  "pagesRead": 25,
  "notes": "Finished chapter 5"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "log": {
      "id": "uuid",
      "date": "2026-01-29",
      "pagesRead": 25,
      "notes": "Finished chapter 5"
    },
    "book": {
      "currentPage": 175,
      "progress": 55
    }
  }
}
```

---

### DELETE `/books/:id`

Delete a book and its reading logs.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

---

### GET `/books/stats`

Get reading statistics.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "allTime": {
      "booksFinished": 45,
      "pagesRead": 14500,
      "averageRating": 4.2
    },
    "thisYear": {
      "booksFinished": 8,
      "pagesRead": 2450,
      "goal": 12,
      "onTrack": true
    },
    "thisMonth": {
      "booksFinished": 1,
      "pagesRead": 450
    },
    "byMonth": [
      { "month": "2026-01", "books": 1, "pages": 450 },
      { "month": "2025-12", "books": 2, "pages": 620 }
    ],
    "topAuthors": [
      { "author": "James Clear", "books": 2 },
      { "author": "Cal Newport", "books": 3 }
    ]
  }
}
```

---

## Challenges

### GET `/challenges`

Get all challenges.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter: ACTIVE, COMPLETED, FAILED, CANCELLED |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "uuid",
        "name": "30-Day Exercise Challenge",
        "description": "Exercise every day for 30 days",
        "duration": 30,
        "startDate": "2026-01-01",
        "endDate": "2026-01-30",
        "status": "ACTIVE",
        "daysCompleted": 25,
        "daysRemaining": 5,
        "currentStreak": 10,
        "completionRate": 83.3,
        "habits": [
          {
            "habitId": "uuid",
            "name": "Morning Exercise",
            "completedDays": 25
          }
        ]
      }
    ]
  }
}
```

---

### POST `/challenges`

Create a new challenge.

**Request:**

```json
{
  "name": "30-Day Exercise Challenge",
  "description": "Exercise every day for 30 days",
  "duration": 30,
  "startDate": "2026-02-01",
  "habitIds": ["habit-uuid-1", "habit-uuid-2"]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "uuid",
      "name": "30-Day Exercise Challenge",
      "duration": 30,
      "startDate": "2026-02-01",
      "endDate": "2026-03-02",
      "status": "ACTIVE",
      "habits": ["..."]
    }
  }
}
```

---

### GET `/challenges/:id`

Get challenge details with daily progress.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "uuid",
      "name": "30-Day Exercise Challenge",
      "status": "ACTIVE",
      "duration": 30,
      "startDate": "2026-01-01",
      "endDate": "2026-01-30",
      "habits": [
        {
          "habitId": "uuid",
          "name": "Morning Exercise",
          "icon": "🏃",
          "color": "#10B981"
        }
      ],
      "progress": [
        {
          "date": "2026-01-01",
          "day": 1,
          "habitsCompleted": 2,
          "habitsTotal": 2,
          "isComplete": true
        },
        {
          "date": "2026-01-02",
          "day": 2,
          "habitsCompleted": 1,
          "habitsTotal": 2,
          "isComplete": false
        }
      ],
      "stats": {
        "daysCompleted": 25,
        "daysTotal": 30,
        "currentStreak": 10,
        "longestStreak": 15,
        "completionRate": 83.3
      }
    }
  }
}
```

---

### DELETE `/challenges/:id`

Cancel/delete a challenge.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Challenge cancelled"
}
```

---

## User Profile

### GET `/user/profile`

Get current user profile.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "timezone": "America/New_York",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-29T00:00:00Z"
    }
  }
}
```

---

### PUT `/user/profile`

Update user profile.

**Request:**

```json
{
  "name": "John Updated",
  "timezone": "Europe/London"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Updated",
      "timezone": "Europe/London"
    }
  }
}
```

---

### GET `/user/export`

Export all user data (GDPR compliance).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": { "...": "user profile data" },
    "habits": ["...array of all habits..."],
    "habitLogs": ["...array of all logs..."],
    "books": ["...array of all books..."],
    "challenges": ["...array of all challenges..."],
    "exportedAt": "2026-01-29T12:00:00Z"
  }
}
```

---

## API Key Management

### GET `/user/api-key`

Check if user has an API key (does not return the key itself).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "hasApiKey": true,
    "createdAt": "2026-01-29T00:00:00Z"
  }
}
```

---

### POST `/user/api-key`

Generate or regenerate API key for external integrations.

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "apiKey": "ht_live_xxxxxxxxxxxxxxxxxxxx",
    "createdAt": "2026-01-29T00:00:00Z",
    "note": "Store this key securely. It won't be shown again."
  }
}
```

---

### DELETE `/user/api-key`

Revoke API key.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "API key revoked"
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Common HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid data format |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

---

## Rate Limiting

- **Auth endpoints**: 5 requests per minute per IP
- **All other endpoints**: 100 requests per minute per user

---

## AI Integration Guide

This API is designed for easy integration with AI agents, automation tools, and external applications.

### Quick Start for AI Agents

1. **Authenticate** with email/password to get JWT token
2. **Include token** in all requests: `Authorization: Bearer <token>`
3. **Use refresh endpoint** when token expires (15 min)

### Recommended Endpoints for AI

#### Daily Check-in Flow

```bash
# 1. Get today's habits
GET /api/tracking/today

# 2. Mark habit complete
POST /api/tracking/check-in
{
  "habitId": "uuid",
  "completed": true,
  "value": null,
  "date": "2026-01-29"
}

# 3. Get updated stats
GET /api/analytics/overview
```

#### Insights & Analysis

```bash
# Get productivity score
GET /api/analytics/productivity

# Get streak predictions (who's at risk?)
GET /api/analytics/predictions

# Get habit correlations
GET /api/analytics/correlations

# Get personalized insights
GET /api/analytics/insights
```

#### Reading Progress

```bash
# Get current book
GET /api/books/current

# Update pages read
PUT /api/books/:id/progress
{ "currentPage": 175 }
```

### Example: Voice Assistant Integration

```python
# Example Python code for voice assistant
import requests

BASE_URL = "http://localhost:8080/api"
TOKEN = "your-jwt-token"

headers = {"Authorization": f"Bearer {TOKEN}"}

# User says: "Mark exercise as done"
def mark_habit_done(habit_name):
    # Get today's habits
    today = requests.get(f"{BASE_URL}/tracking/today", headers=headers).json()

    # Find matching habit
    habits = today["data"]["habits"]
    habit = next((h for h in habits if habit_name.lower() in h["name"].lower()), None)

    if habit:
        # Mark complete
        requests.post(f"{BASE_URL}/tracking/check-in",
            headers=headers,
            json={"habitId": habit["id"], "completed": True}
        )
        return f"✅ {habit['name']} marked complete! Streak: {habit['currentStreak'] + 1} days"

    return "Habit not found"

# User says: "How am I doing?"
def get_summary():
    overview = requests.get(f"{BASE_URL}/analytics/overview", headers=headers).json()
    data = overview["data"]

    return f"""
    Today: {data['completedToday']}/{data['totalToday']} habits ({data['todayPercentage']}%)
    Best streak: {data['currentBestStreak']} days
    Monthly average: {data['monthlyCompletionRate']}%
    """
```

### Example: Zapier/Make.com Integration

**Trigger:** Daily at 8 PM

```
1. GET /api/tracking/today
2. Filter incomplete habits
3. Send notification: "You have 3 habits left: Exercise, Read, Meditate"
```

**Trigger:** When streak reaches milestone

```
1. GET /api/analytics/streaks
2. Check for new milestones
3. Send celebration message
```

### Example: n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Check Streaks at Risk",
      "type": "HTTP Request",
      "parameters": {
        "url": "http://localhost:8080/api/analytics/predictions",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{$json.token}}"
        }
      }
    },
    {
      "name": "Filter High Risk",
      "type": "Filter",
      "parameters": {
        "conditions": {
          "string": [{ "value1": "={{$json.riskLevel}}", "value2": "high" }]
        }
      }
    },
    {
      "name": "Send Alert",
      "type": "Telegram",
      "parameters": {
        "text": "⚠️ Streak at risk: {{$json.habitName}} ({{$json.currentStreak}} days)"
      }
    }
  ]
}
```

### Webhooks (Future)

Planned webhook events for real-time integrations:

- `habit.completed` - When a habit is checked off
- `streak.milestone` - When a streak milestone is reached
- `streak.broken` - When a streak is broken
- `challenge.completed` - When a challenge is finished

### Best Practices for AI Integration

1. **Cache tokens**: Store JWT and only refresh when expired
2. **Use bulk operations**: Fetch all habits once, don't call per habit
3. **Respect rate limits**: 100 req/min for authenticated endpoints
4. **Handle errors gracefully**: Check `success` field in responses
5. **Use insights endpoint**: Pre-computed insights are more efficient than calculating yourself

### Full Endpoint Reference

| Category       | Method | Endpoint                | Description             |
| -------------- | ------ | ----------------------- | ----------------------- |
| **Auth**       | POST   | /auth/register          | Create account          |
|                | POST   | /auth/login             | Get JWT token           |
|                | POST   | /auth/refresh           | Refresh token           |
|                | POST   | /auth/logout            | Invalidate session      |
|                | GET    | /auth/me                | Get current user        |
| **Habits**     | GET    | /habits                 | List all habits         |
|                | POST   | /habits                 | Create habit            |
|                | GET    | /habits/:id             | Get habit details       |
|                | PATCH  | /habits/:id             | Update habit            |
|                | DELETE | /habits/:id             | Delete habit            |
|                | POST   | /habits/:id/archive     | Archive habit           |
|                | POST   | /habits/:id/unarchive   | Restore habit           |
|                | GET    | /habits/archived        | List archived           |
| **Tracking**   | GET    | /tracking/today         | Today's habits + status |
|                | POST   | /tracking/check-in      | Complete a habit        |
|                | DELETE | /tracking/check-in      | Undo completion         |
|                | GET    | /tracking/history       | Historical logs         |
|                | GET    | /tracking/date/:date    | Specific day data       |
| **Analytics**  | GET    | /analytics/overview     | Dashboard stats         |
|                | GET    | /analytics/weekly       | Weekly breakdown        |
|                | GET    | /analytics/monthly      | Monthly breakdown       |
|                | GET    | /analytics/heatmap      | Year heatmap            |
|                | GET    | /analytics/habits/:id   | Per-habit stats         |
|                | GET    | /analytics/streaks      | All streaks             |
|                | GET    | /analytics/insights     | AI insights             |
|                | GET    | /analytics/calendar     | Calendar data           |
|                | GET    | /analytics/categories   | Category breakdown      |
|                | GET    | /analytics/comparison   | Week comparison         |
|                | GET    | /analytics/trend        | 30-day trend            |
|                | GET    | /analytics/productivity | Productivity score      |
|                | GET    | /analytics/performance  | Best/worst analysis     |
|                | GET    | /analytics/correlations | Habit correlations      |
|                | GET    | /analytics/predictions  | Streak predictions      |
| **Books**      | GET    | /books                  | List all books          |
|                | GET    | /books/current          | Currently reading       |
|                | POST   | /books                  | Add book                |
|                | PATCH  | /books/:id              | Update book             |
|                | DELETE | /books/:id              | Delete book             |
|                | PUT    | /books/:id/progress     | Update pages            |
|                | POST   | /books/:id/log          | Log reading session     |
|                | GET    | /books/stats            | Reading stats           |
| **Challenges** | GET    | /challenges             | List challenges         |
|                | POST   | /challenges             | Create challenge        |
|                | GET    | /challenges/:id         | Challenge details       |
|                | DELETE | /challenges/:id         | Cancel challenge        |
| **User**       | GET    | /user/profile           | Get profile             |
|                | PUT    | /user/profile           | Update profile          |
|                | GET    | /user/export            | Export all data         |
|                | GET    | /user/api-key           | Check API key           |
|                | POST   | /user/api-key           | Generate API key        |
|                | DELETE | /user/api-key           | Revoke API key          |
| **Templates**  | GET    | /templates              | Habit templates         |
|                | POST   | /templates/:id/use      | Use template            |
