# Discord Moderation Bot

A clean, feature-rich Discord moderation bot built with **discord.js v14**. Slash commands, per-guild warnings, and configurable auto-moderation — ready to drop into a GitHub repo.

## Features

### Slash commands
- `/ban` — ban a user (optionally delete recent messages, 0–7 days)
- `/unban` — unban a user by ID
- `/kick` — kick a member
- `/timeout` — timeout for a duration like `30s`, `10m`, `1h`, `2d` (max 28d)
- `/untimeout` — remove a timeout
- `/warn` — warn a member; auto-actions trigger at thresholds
- `/warnings list | remove | clear` — manage warnings
- `/clear` — bulk delete recent messages (optionally from one user)
- `/slowmode` — set channel slowmode (0 disables)
- `/lockdown on | off` — lock or unlock the channel for `@everyone`
- `/userinfo` — show user details, roles, and warning count
- `/help` — list all commands

### Auto-moderation (configurable)
- **Anti-spam** — timeout users who send too many messages too quickly
- **Anti-invite** — block Discord invite links
- **Anti-link** — block external links (with allowlist)
- **Bad-word filter** — delete messages containing forbidden words

### Warning thresholds
Configure automatic actions when a user reaches N warnings (timeout / kick / ban) in `config.json`.

### Mod logging
Every action is posted as an embed to a channel named `mod-logs` (configurable in `config.json`).

## Project structure

```
discord-mod-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── deploy-commands.js    # Register slash commands
│   ├── commands/             # Slash command modules
│   ├── events/               # ready, interactionCreate, messageCreate (auto-mod)
│   └── utils/                # logger, warnings store, duration parser, threshold actions
├── data/                     # JSON warning store (created at runtime)
├── config.json               # Auto-mod and threshold config
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Setup

### 1. Create your bot
1. Go to <https://discord.com/developers/applications> and create a new application.
2. Add a Bot, copy the **Token**, and copy the **Application ID** (Client ID).
3. Under **Bot → Privileged Gateway Intents**, enable:
   - **Server Members Intent**
   - **Message Content Intent**
4. Under **OAuth2 → URL Generator**, select scopes `bot` and `applications.commands`.
   Pick the bot permissions you need (at minimum: `Ban Members`, `Kick Members`, `Moderate Members`, `Manage Messages`, `Manage Channels`, `View Audit Log`, `Send Messages`, `Embed Links`).
5. Open the generated URL and invite the bot to your server.

### 2. Install
```bash
git clone https://github.com/<your-username>/discord-mod-bot.git
cd discord-mod-bot
npm install
```

### 3. Configure
```bash
cp .env.example .env
```
Fill in:
```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-client-id
GUILD_ID=optional-guild-id-for-instant-deploy
```
Set `GUILD_ID` for development (commands appear instantly). Leave blank for global registration (takes up to 1 hour to propagate).

### 4. Register slash commands
```bash
npm run deploy
```

### 5. Run the bot
```bash
npm start
```

Create a `#mod-logs` channel in your server (or change `logChannelName` in `config.json`) so the bot has somewhere to post action logs.

## Configuration (`config.json`)

```json
{
  "logChannelName": "mod-logs",
  "muteRoleName": "Muted",
  "automod": {
    "antiSpam":   { "enabled": true,  "messageLimit": 5, "intervalMs": 5000, "timeoutMs": 300000 },
    "antiInvite": { "enabled": true,  "deleteMessage": true },
    "antiLink":   { "enabled": false, "deleteMessage": true, "allowedDomains": ["youtube.com"] },
    "badWords":   { "enabled": true,  "words": ["badword1"], "deleteMessage": true, "warnUser": true }
  },
  "warnings": {
    "thresholds": [
      { "count": 3, "action": "timeout", "durationMs": 600000 },
      { "count": 5, "action": "kick" },
      { "count": 7, "action": "ban" }
    ]
  }
}
```

Members with **Manage Messages** are exempt from auto-moderation.

## Push to your GitHub

```bash
git init
git add .
git commit -m "Initial commit: Discord moderation bot"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Requirements
- Node.js **18+**
- A Discord application with the bot intents listed above

## License
MIT
