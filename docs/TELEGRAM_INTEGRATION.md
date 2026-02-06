# Telegram Integration Guide

Get habit reminders and notifications directly in Telegram! This guide walks you through setting up the Telegram integration step-by-step.

---

## Table of Contents

1. [Overview](#overview)
2. [What You'll Need](#what-youll-need)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Configuration](#configuration)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)
7. [Advanced: OpenClaw Integration](#advanced-openclaw-integration)

---

## Overview

### What does this integration do?

The Telegram integration enables:

- **📬 Habit Reminders**: Get notified when it's time to complete your habits
- **🔔 Notifications**: Receive alerts about streaks, milestones, and achievements
- **📊 Updates**: Get daily summaries of your progress

**Note**: For full conversational habit tracking ("Done with meditation", "Show my habits"), see the [OpenClaw Integration Guide](./OPENCLAW_INTEGRATION.md).

---

## What You'll Need

Before starting, make sure you have:

| Requirement           | Description                                   |
| --------------------- | --------------------------------------------- |
| Telegram Account      | A Telegram account on your phone or desktop   |
| Habit Tracker Running | Backend must be running (locally or deployed) |
| 10 minutes            | Time needed to complete the setup             |

---

## Step-by-Step Setup

### Step 1: Create a Telegram Bot

1. **Open Telegram** and search for [@BotFather](https://t.me/botfather)
2. **Start a chat** with BotFather and send `/start`
3. **Create a new bot** by sending `/newbot`
4. **Choose a name** for your bot (e.g., "My Habit Tracker")
5. **Choose a username** for your bot (must end in "bot", e.g., "myhabittracker_bot")

![BotFather conversation example](https://i.imgur.com/example.png)

6. **Copy the bot token** - BotFather will send you something like:

   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

   **⚠️ Important**: Keep this token secret! Anyone with it can control your bot.

### Step 2: Configure Environment Variables

#### For Docker Development

1. **Open your project's `.env` file** or create one:

   ```bash
   cd /path/to/habit-tracker/backend
   touch .env
   ```

2. **Add the Telegram bot token**:

   ```bash
   # Telegram Integration
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

3. **The docker-compose.dev.yml is already configured** to read this value:

   ```yaml
   environment:
     TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:-}
   ```

4. **Restart your containers** to apply the change:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml up -d
   ```

#### For Production Deployment

Add the environment variable to your deployment platform:

**Railway**:

```bash
railway variables set TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Render**:

1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add key: `TELEGRAM_BOT_TOKEN`, value: your token

**Heroku**:

```bash
heroku config:set TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Docker Compose (Production)**:
Add to your `docker-compose.yml` or use a `.env` file:

```yaml
environment:
  TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
```

### Step 3: Get Your Telegram Chat ID

To receive notifications, the system needs to know your Telegram chat ID.

**Option A: Using a Bot (Easiest)**

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a chat and send any message
3. The bot will reply with your user info including your **Chat ID**
4. Copy the number (e.g., `123456789`)

**Option B: Using Your Bot**

1. Send any message to your bot (the one you created with BotFather)
2. Visit this URL in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Look for `"chat":{"id":123456789}` in the JSON response
4. Copy the chat ID

### Step 4: Connect Your Chat to the Habit Tracker

You can connect your Telegram chat through the API or the web app (if implemented).

**Via API (using curl)**:

```bash
curl -X POST http://localhost:8080/api/bot/register-chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "telegram",
    "chatId": "123456789",
    "username": "your_telegram_username"
  }'
```

**How to get your API key**:

1. Log into the Habit Tracker web app
2. Go to **Settings** → **API Access**
3. Click **"Generate API Key"**
4. Copy and save the key

**Expected Response**:

```json
{
  "success": true,
  "message": "telegram chat registered for reminders",
  "data": {
    "id": "abc-123",
    "provider": "telegram",
    "chatId": "123456789",
    "username": "your_username",
    "isActive": true
  }
}
```

---

## Configuration

### Setting Up Reminders

Once your Telegram chat is connected:

1. Go to the **Habit Tracker web app**
2. Navigate to **Settings** → **Reminders**
3. **Enable reminders** for specific habits
4. **Set reminder times** (e.g., "9:00 AM daily")
5. **Save your settings**

### Reminder Behavior

- Reminders are sent only for **active habits**
- You'll receive notifications for habits that **haven't been completed** today
- The system checks your timezone from your account settings
- Reminders include habit details and current streak info

---

## Testing the Integration

### Test Telegram Connection

Send a test notification using the backend directly:

```bash
# Via docker
docker-compose -f docker-compose.dev.yml exec backend npx ts-node -e "
const { sendToUser } = require('./src/services/notifier.service');
sendToUser('YOUR_USER_ID', '🎉 Test notification from Habit Tracker!');
"
```

If configured correctly, you should receive a message in Telegram!

### Test via Logs

Watch your backend logs to verify the integration:

```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

You should see:

```
[INFO] Telegram message sent { chatId: '123456789' }
```

### Test Reminder Flow

1. **Create a habit** with a reminder time in the next 5 minutes
2. **Wait for the reminder time**
3. **Check Telegram** - you should receive a notification like:

   ```
   ⏰ Reminder: Time to complete "Meditation"

   Current streak: 5 days 🔥
   Target: 30 minutes
   ```

---

## Troubleshooting

### Issue: "TELEGRAM_BOT_TOKEN not set" in logs

**Symptom**: Backend logs show a warning about missing token

**Solution**:

1. Verify `.env` file exists in `backend/` directory
2. Check the token is correctly formatted (no extra spaces)
3. Restart docker containers: `docker-compose -f docker-compose.dev.yml restart backend`
4. Verify environment variable is loaded:
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend env | grep TELEGRAM
   ```

### Issue: Not receiving notifications

**Symptom**: No messages appear in Telegram

**Checklist**:

- [ ] Bot token is correct (test it using `getUpdates` API)
- [ ] Chat ID is correct and registered in the database
- [ ] `isActive` flag is `true` for your connected app
- [ ] Reminders are enabled for the habit in settings
- [ ] Backend service is running without errors
- [ ] Check backend logs for Telegram errors

**Test the bot manually**:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "YOUR_CHAT_ID", "text": "Test"}'
```

If this fails, your token or chat ID is incorrect.

### Issue: "Unauthorized" error from Telegram API

**Symptom**: Backend logs show 401 errors from `api.telegram.org`

**Cause**: Invalid or expired bot token

**Solution**:

1. Go back to [@BotFather](https://t.me/botfather)
2. Send `/mybots` → Select your bot → "API Token"
3. Regenerate the token if needed
4. Update your `.env` file with the new token
5. Restart the backend

### Issue: "Chat not found" error

**Symptom**: 400 error with "chat not found" message

**Cause**: Invalid chat ID or user hasn't started the bot

**Solution**:

1. **Start a conversation** with your bot in Telegram (send `/start`)
2. **Verify your chat ID** using [@userinfobot](https://t.me/userinfobot)
3. **Update the registration** with the correct chat ID

### Issue: Messages sent but delayed

**Symptom**: Notifications arrive several minutes late

**Possible causes**:

- Backend server time is incorrect (check timezone settings)
- Database not properly indexed (run migrations)
- Background job scheduler not running (check logs for cron job status)

**Solution**:

```bash
# Check server time
docker-compose -f docker-compose.dev.yml exec backend date

# Verify cron jobs are running
docker-compose -f docker-compose.dev.yml logs -f backend | grep "reminder"
```

### Viewing Logs

**Filter for Telegram-related logs**:

```bash
docker-compose -f docker-compose.dev.yml logs -f backend | grep -i telegram
```

**Check database connections**:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
# Navigate to ConnectedApp table and verify your entry
```

---

## Advanced: OpenClaw Integration

For **conversational habit tracking** where you can say things like:

- "Done with meditation"
- "Drank 3 glasses of water"
- "Show my habits for today"

See the full [OpenClaw Integration Guide](./OPENCLAW_INTEGRATION.md), which builds on top of this Telegram setup.

**Key Differences**:

| Basic Telegram         | OpenClaw Integration                    |
| ---------------------- | --------------------------------------- |
| One-way notifications  | Two-way conversations                   |
| Reminders only         | Full habit tracking via chat            |
| Quick setup (10 min)   | Requires OpenClaw installation (30 min) |
| Built-in functionality | Requires skill configuration            |

---

## Security Best Practices

1. **Never commit your bot token** to git
   - Add `.env` to `.gitignore` (already done in this project)

2. **Regenerate tokens periodically**
   - Use BotFather to generate new tokens every few months

3. **Limit bot permissions**
   - Only give the bot access to send messages (default)
   - Disable inline mode if not needed

4. **Use HTTPS in production**
   - Always deploy with SSL/TLS enabled
   - Verify `TELEGRAM_BOT_TOKEN` is set in production environment

5. **Monitor usage**
   - Check backend logs regularly for suspicious activity
   - Set up alerts for failed authentication attempts

---

## API Reference

### Register Chat Endpoint

**POST** `/api/bot/register-chat`

Register a Telegram chat to receive notifications.

**Headers**:

```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body**:

```json
{
  "provider": "telegram",
  "chatId": "123456789",
  "username": "your_telegram_username"
}
```

**Response (201 Created)**:

```json
{
  "success": true,
  "message": "telegram chat registered for reminders",
  "data": {
    "id": "uuid",
    "provider": "telegram",
    "chatId": "123456789",
    "username": "your_username",
    "isActive": true,
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

### Disconnect Integration

**DELETE** `/api/integrations/telegram`

Disconnect your Telegram integration.

**Headers**:

```
Authorization: Bearer your_jwt_token
```

**Response (204 No Content)**:

```
(empty body)
```

---

## Need Help?

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/habit-tracker/issues)
- **Documentation**: Check [README.md](../README.md) for general setup
- **OpenClaw Guide**: See [OPENCLAW_INTEGRATION.md](./OPENCLAW_INTEGRATION.md) for advanced features

---

_Last updated: February 2026_
