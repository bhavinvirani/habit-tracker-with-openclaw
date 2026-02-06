# WhatsApp Integration Guide

Track your habits via WhatsApp by messaging yourself! OpenClaw intercepts your messages and logs habits automatically.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Detailed Configuration](#detailed-configuration)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What does this integration do?

With WhatsApp + OpenClaw integration:

- **📱 Message yourself on WhatsApp**: Send "Done with meditation" or "Drank 5 glasses of water" to yourself
- **🔄 OpenClaw intercepts**: The gateway processes your messages using the habit-tracker skill
- **✅ Automatic logging**: Habits are logged to your tracker without manual entry
- **📊 Get confirmations**: Receive instant feedback about your progress and streaks

**How it works**:

```
You → WhatsApp (message to yourself) → OpenClaw Gateway → Habit Tracker API → Database
                                              ↓
                                   Response back to you on WhatsApp
```

**Important**: You send messages **to yourself** on WhatsApp, not to a bot!

---

## Prerequisites

Before starting, you need:

| Requirement                     | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| **OpenClaw installed**          | Install via `npm install -g openclaw`                               |
| **WhatsApp linked to OpenClaw** | Already done if `openclaw channels list` shows WhatsApp as "linked" |
| **Habit Tracker API Key**       | Generate from Settings → API Access in web app                      |
| **Habit Tracker skill**         | Copy `openclaw/habit-tracker/` to `~/.openclaw/skills/`             |

---

## Quick Setup

Already have OpenClaw and WhatsApp linked? Here's the 30-second setup:

### 1. Verify WhatsApp is linked

```bash
openclaw channels list
# Should show: WhatsApp default: linked, enabled
```

### 2. Configure the habit-tracker skill

```bash
openclaw config set skills.entries.habit-tracker.enabled true
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_URL http://localhost:8080
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_KEY your_api_key_here
```

### 3. Start the gateway

```bash
openclaw gateway start
```

### 4. Test it!

- Open WhatsApp
- Start a chat **with yourself** (look for "Message Yourself" option)
- Send: `register this chat`
- Then try: `Done with meditation` or `Show my habits`

**That's it!** Messages you send to yourself on WhatsApp will be processed by OpenClaw and logged to your Habit Tracker.

---

## Setup Methods

### Option 1: WhatsApp Web.js (Recommended)

**Pros**:

- Free and easy to set up
- No business verification required
- Works with personal WhatsApp account
- QR code authentication

**Cons**:

- Unofficial (uses WhatsApp Web protocol)
- Requires keeping the client running
- May violate WhatsApp ToS (use at your own risk)

### Option 2: WhatsApp Business API (Official)

**Pros**:

- Official and supported by Meta
- More reliable and scalable
- Better for production use

**Cons**:

- Requires business verification
- More complex setup
- May have costs associated

**This guide covers Option 1 (WhatsApp Web.js)** as it's easier for personal use.

---

## Step-by-Step Setup (WhatsApp Web.js)

### Step 1: Install OpenClaw

If you haven't already:

```bash
npm install -g openclaw
```

### Step 2: Install WhatsApp Client for OpenClaw

OpenClaw needs to connect to WhatsApp. Install the WhatsApp connector:

```bash
# Install OpenClaw WhatsApp connector
npm install -g @openclaw/connector-whatsapp
```

Or check OpenClaw's official documentation for the latest WhatsApp connector package.

### Step 3: Configure WhatsApp Connector

Start the WhatsApp connector:

```bash
openclaw connector add whatsapp
```

This will:

1. Set up WhatsApp Web.js client
2. Generate a QR code in your terminal
3. Wait for you to scan it with WhatsApp mobile app

**To scan the QR code**:

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code shown in your terminal

Once scanned, OpenClaw will be connected to your WhatsApp account!

### Step 4: Copy the Habit Tracker Skill

From your habit-tracker project directory:

```bash
# Copy the skill to OpenClaw
cp -r openclaw/habit-tracker ~/.openclaw/skills/
```

### Step 5: Configure Environment Variables

**Option A: Using CLI (Recommended)**

```bash
# Enable the skill
openclaw config set skills.entries.habit-tracker.enabled true

# Set your API URL
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_URL http://localhost:8080

# Set your API key (get from Settings → API Access)
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_KEY your_api_key_here
```

**Option B: Manual Configuration**

Edit `~/.openclaw/openclaw.json`:

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

### Step 6: Start OpenClaw Gateway

```bash
openclaw gateway start
```

This keeps the gateway running and listening for WhatsApp messages.

### Step 7: Register Your WhatsApp Chat

Send this message to yourself (or the bot) on WhatsApp:

```
register this chat
```

OpenClaw will:

1. Call the Habit Tracker API
2. Register your WhatsApp number/chat ID
3. Confirm the registration

You should see a confirmation message!

---

## Configuring OpenClaw

### Environment Variables

Make sure these are set correctly:

```bash
# View current config
openclaw config get skills.entries.habit-tracker

# Update API URL (for deployed backend)
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_URL https://api.yourhabits.com
```

### Verify Setup

```bash
# Check if skill is loaded
openclaw skills list

# Check detailed info
openclaw skills info habit-tracker
```

You should see:

```
📦 habit-tracker ✓ Ready

Requirements:
  Environment: ✓ HABIT_TRACKER_API_URL, ✓ HABIT_TRACKER_API_KEY
```

---

## Testing the Integration

### Test Messages

Try sending these messages on WhatsApp:

**Viewing habits**:

```
Show my habits
What's left today?
How am I doing?
```

**Logging habits**:

```
Done with meditation
Drank 3 glasses of water
Meditated for 30 minutes
Finished my workout
Read for 20 minutes
```

**Expected responses**:

```
✅ Logged: Meditation - 30/30 minutes. Goal reached! 🎉
Streak: 5 days - keep it going!
```

### Check Backend Logs

Watch for bot requests in your backend:

```bash
docker-compose -f docker-compose.dev.yml logs -f backend | grep "🤖 Bot"
```

---

## Troubleshooting

### Issue: QR code not appearing

**Symptom**: Terminal doesn't show QR code when starting WhatsApp connector

**Solution**:

1. Make sure you have the latest OpenClaw version: `npm update -g openclaw`
2. Check if WhatsApp connector is properly installed
3. Try running with debug mode: `DEBUG=* openclaw connector add whatsapp`

### Issue: "WhatsApp session expired"

**Symptom**: Connection drops after some time

**Solution**:

1. Unlink the device from WhatsApp mobile app
2. Re-run the connector setup: `openclaw connector remove whatsapp && openclaw connector add whatsapp`
3. Scan the new QR code

### Issue: Messages not being received

**Symptom**: Sending messages but no response

**Checklist**:

- [ ] OpenClaw gateway is running: `openclaw gateway status`
- [ ] WhatsApp connector is active
- [ ] Chat is registered (send "register this chat" again)
- [ ] API key is valid (regenerate if needed)
- [ ] Backend is running and accessible

**Debug commands**:

```bash
# Check OpenClaw gateway logs
openclaw gateway logs

# Test API connection directly
curl -X GET "$HABIT_TRACKER_API_URL/api/bot/habits/today" \
  -H "X-API-Key: $HABIT_TRACKER_API_KEY"
```

### Issue: "Failed to register chat"

**Symptom**: Registration message returns an error

**Solution**:

1. Verify your API key is correct
2. Check backend logs for specific error
3. Ensure backend has `TELEGRAM_BOT_TOKEN` or notification settings configured
4. Try registering via API directly:

```bash
curl -X POST http://localhost:8080/api/bot/register-chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "whatsapp",
    "chatId": "YOUR_WHATSAPP_NUMBER",
    "username": "Your Name"
  }'
```

### Issue: High memory/CPU usage

**Symptom**: WhatsApp Web.js client consuming lots of resources

**Solution**:

- This is normal for WhatsApp Web.js (it runs a headless Chrome browser)
- Consider upgrading to WhatsApp Business API for production use
- Restart the connector periodically: `openclaw connector restart whatsapp`

---

## Running in Production

### Keep the Gateway Running

**Option 1: PM2 (Recommended)**

```bash
# Install PM2
npm install -g pm2

# Start OpenClaw gateway with PM2
pm2 start openclaw -- gateway start
pm2 save
pm2 startup
```

**Option 2: Systemd Service**

Create `/etc/systemd/system/openclaw.service`:

```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/home/your_username
ExecStart=/usr/bin/openclaw gateway start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable openclaw
sudo systemctl start openclaw
```

### Security Considerations

1. **API Key Security**: Store API keys securely, never commit to git
2. **WhatsApp Account**: Use a dedicated number for bots (not your primary account)
3. **Rate Limiting**: Be mindful of WhatsApp's rate limits to avoid bans
4. **Terms of Service**: WhatsApp Web.js is unofficial; use at your own risk

---

## Differences from Telegram Integration

| Feature                     | Telegram         | WhatsApp              |
| --------------------------- | ---------------- | --------------------- |
| **Setup Complexity**        | Easy (bot token) | Medium (QR code scan) |
| **Official API**            | Yes              | Unofficial (Web.js)   |
| **Requires Client Running** | No               | Yes (for Web.js)      |
| **Rich Formatting**         | Full Markdown    | Limited               |
| **Media Support**           | Full             | Limited in Web.js     |

---

## Alternative: WhatsApp Business API (Official)

For production or business use, consider the official WhatsApp Business API:

1. **Sign up**: https://business.whatsapp.com/products/business-platform
2. **Get verified**: Complete Meta business verification
3. **Get credentials**: Obtain phone number ID and access token
4. **Configure webhook**: Point to your OpenClaw instance
5. **Use official SDK**: Replace WhatsApp Web.js with official API

**Benefits**:

- Official support from Meta
- Better reliability and uptime
- Higher rate limits
- Cloud-hosted (no local client needed)

**Drawbacks**:

- Requires business verification (can take days/weeks)
- May have associated costs
- More complex setup

---

## Need Help?

- **OpenClaw Docs**: https://openclaw.ai/docs
- **GitHub Issues**: Report bugs or request features
- **Telegram Integration**: See [TELEGRAM_INTEGRATION.md](./TELEGRAM_INTEGRATION.md) for comparison

---

_Last updated: February 2026_
