# Hermes Webchat

A full-featured, dark-themed web chat interface for the Hermes Agent API server — an AI agent gateway with an OpenAI-compatible REST API.

## Features

- **Streaming responses** — real-time token-by-token output via SSE
- **Session management** — create, rename, and delete chat sessions, all stored locally in the browser
- **Markdown rendering** — full GFM support with syntax-highlighted code blocks and a one-click copy button
- **Tool call display** — visualize agent tool invocations and their results inline in the conversation
- **Themeable UI** — four themes (Dark, Light, OLED, System) and six accent colors
- **Configurable model settings** — set the model name, max tokens (512–32 768), and a global system prompt
- **Connection status indicator** — live badge shows gateway reachability and latency
- **Auth token support** — optional Bearer token sent with every request

## Requirements

- Node.js 18+ and npm
- A running Hermes Agent gateway that exposes an OpenAI-compatible REST API (e.g. at `http://127.0.0.1:8642`)

## Quick start

```bash
# 1. Clone the repository
git clone https://github.com/jcrabapple/hermes-webchat.git
cd hermes-webchat

# 2. Install dependencies
npm install

# 3. Start the development server
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

> The app communicates with two endpoints on your gateway:
> - `POST /v1/chat/completions` — streaming chat (SSE)
> - `GET /v1/models` — connection health check

## Production build

```bash
npm run build       # Type-checks and bundles to dist/
npm run preview     # Serves the production build locally for verification
```

Deploy the contents of `dist/` to any static file host (Nginx, Caddy, Vercel, Cloudflare Pages, etc.).

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

## Configuration

All settings are stored in `localStorage` — there is no server-side config. Settings can be changed at any time from the **Settings** panel (gear icon in the sidebar).

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

All data (sessions, messages, settings) is stored exclusively in your browser's `localStorage`. Nothing is sent to any third-party server — only to the Hermes gateway URL you configure.

Incomplete responses (e.g. from a page refresh mid-stream) are discarded; only fully completed assistant messages are persisted.

## Development

```bash
npm run dev     # Start Vite dev server with HMR at http://localhost:5173
npm run lint    # Run ESLint
npm run build   # Type-check (tsc) + production bundle
```

**Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, react-markdown, highlight.js, react-router-dom v7, lucide-react.

## License

MIT
