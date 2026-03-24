# Hermes Webchat

A full-featured, dark-themed web chat interface for the Hermes Agent API server — an AI agent gateway with an OpenAI-compatible REST API.

## Features

- **Streaming responses** — real-time token-by-token output via SSE
- **Session management** — create, rename, and delete chat sessions, all stored locally in the browser
- **Markdown rendering** — full GFM support with syntax-highlighted code blocks and a one-click copy button
- **Tool call display** — color-coded badges, inline parameter preview, and expandable results for every agent tool call
- **Themeable UI** — four themes (Dark, Light, OLED, System) and six accent colors
- **Configurable model settings** — set the model name, max tokens (512–32 768), and a global system prompt
- **Connection status indicator** — live badge shows gateway reachability and latency
- **Auth token support** — optional Bearer token sent with every request
- **Administration panel** — manage memory, cron jobs, live sessions, and config directly from the UI

## Requirements

- Node.js 18+ and npm
- A running Hermes Agent gateway with the API server enabled (e.g. at `http://127.0.0.1:8642`)

Enable the API server in `~/.hermes/.env` if not already set:
```
API_SERVER_ENABLED=true
API_SERVER_PORT=8642
```

Then start the gateway:
```bash
hermes gateway start   # as a background service
# or
hermes gateway         # foreground with live logs
```

## Quick start

```bash
# 1. Clone the repository
git clone https://github.com/jcrabapple/hermes-webchat.git
cd hermes-webchat

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Connecting to your Hermes gateway

On the login screen, enter:

| Field | Description |
|---|---|
| **Gateway URL** | Base URL of your Hermes Agent server, e.g. `http://127.0.0.1:8642` |
| **Auth Token** | Bearer token if your gateway requires authentication (optional) |

The app remembers your gateway URL across page reloads. To change it later, open **Settings → Connection**.

> The app communicates with these endpoints on your gateway:
> - `POST /v1/chat/completions` — streaming chat (SSE)
> - `GET /v1/models` — connection health check

## Administration panel

The admin panel gives you a UI over your local `~/.hermes/` files. It requires a companion server that runs alongside the web UI and reads/writes those files directly.

### Starting the admin server

```bash
npm run admin
# Starts on http://127.0.0.1:8644
```

Run this in a separate terminal alongside `npm run dev`. Once it's up, click **Administration** at the bottom of the chat sidebar.

### Admin pages

#### Memory (`~/.hermes/memories/`)

View, add, edit, and delete entries from the agent's two memory files:

| Tab | File | Purpose |
|---|---|---|
| Agent Memory | `MEMORY.md` | Facts the agent has learned — tools, conventions, environment |
| User Profile | `USER.md` | Your preferences, communication style, and personal context |

Entries are stored as `§`-delimited text blocks. The admin server reads and writes this format directly — no reformatting needed.

#### Cron Jobs (`~/.hermes/cron/jobs.json`)

Full CRUD for scheduled agent tasks:

- Enable/disable individual jobs with a toggle
- See state (Scheduled, Paused, Running, Error), last run time, next run time, and run count
- Expand any job to see its full prompt and skill list
- **Run now** button triggers an immediate execution via `hermes cron run <id>`
- Create or edit jobs with name, cron expression (with human-readable preview), prompt, model, and skills

#### Configuration (`~/.hermes/config.yaml`)

A full YAML editor for your Hermes config file. Changes are written directly to disk — Hermes picks them up on next start. The editor highlights unsaved changes and warns before writing.

#### Live Sessions (`~/.hermes/sessions/sessions.json`)

Monitor all active gateway sessions across every connected platform:

- Per-platform filter pills (Telegram, Discord, Slack, WhatsApp, etc.)
- Status badges: Active (last 5 min), Idle, Completed
- Token counts and estimated cost per session
- Auto-refresh every 5 seconds (toggle on/off)

## Tool call visualization

Every agent tool call is displayed inline in the conversation with:

- **Color-coded category badge** — file ops (blue), shell execution (amber), web/search (violet), memory (green), notifications (rose), database (teal)
- **Inline parameter preview** — see the key arguments without expanding
- **Running glow animation** — pulsing border while the tool is executing
- **Expandable detail view** — full key/value argument list and smart-truncated result with "show all" for long outputs

## Production build

```bash
npm run build       # Type-checks and bundles to dist/
npm run preview     # Serves the production build locally for verification
```

Deploy the contents of `dist/` to any static file host (Nginx, Caddy, Vercel, Cloudflare Pages, etc.). Note: the admin server (`npm run admin`) must run on the same machine as your `~/.hermes/` directory — it is not a static asset.

### Example: serving with Nginx

```nginx
server {
    listen 80;
    root /var/www/hermes-webchat/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Chat settings

All chat settings are stored in `localStorage` and can be changed at any time from the gear icon in the sidebar.

### Appearance

| Setting | Options | Default |
|---|---|---|
| Theme | Dark, Light, OLED, System | Dark |
| Accent color | Cyan, Violet, Emerald, Amber, Rose, Blue | Cyan |

### Chat

| Setting | Range / type | Default |
|---|---|---|
| Model | Any model name your gateway accepts | `hermes-agent` |
| Max tokens | 512 – 32 768 | 4 096 |
| System prompt | Free text | _(empty)_ |

### Connection

The gateway URL and auth token can be updated here without going back to the login screen. Use **Test Connection** to verify reachability before saving.

## Data & privacy

Chat sessions and messages are stored exclusively in your browser's `localStorage`. Nothing is sent to any third-party server — only to the Hermes gateway URL you configure.

The admin server reads and writes your local `~/.hermes/` files directly and listens only on `127.0.0.1` (loopback) — it is not accessible from other machines.

Incomplete responses (e.g. from a page refresh mid-stream) are discarded; only fully completed assistant messages are persisted.

## Development

```bash
npm run dev     # Vite dev server with HMR at http://localhost:5173
npm run admin   # Admin companion server at http://127.0.0.1:8644
npm run lint    # ESLint
npm run build   # Type-check (tsc) + production bundle
```

**Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, react-markdown, highlight.js, react-router-dom v7, lucide-react.

## License

MIT
