# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR) at http://localhost:5173
npm run build     # Type-check (tsc -b) then bundle for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

A full-featured, dark-themed React/TypeScript/Vite chat interface for the Hermes Agent API server — an AI agent gateway with an OpenAI-compatible REST API.

### Routing (`src/App.tsx`)

Two routes via react-router-dom:
- `/` → `LoginScreen`: collects gateway URL + optional auth token. Auto-redirects to `/chat` if gateway URL is already stored.
- `/chat` → `ChatLayout`: full-screen sidebar + main chat panel

### Theme system (`src/index.css`, `src/context/SettingsContext.tsx`)

Tailwind v4 with CSS custom properties as the design system. All colors use `var(--bg-base)`, `var(--accent)`, etc. Theme switching works by setting `data-theme` and `data-accent` attributes on `document.documentElement`. The `SettingsProvider` context applies the theme on mount and on every settings change. Four themes: dark (default), light, oled, system. Six accent colors: cyan, violet, emerald, amber, rose, blue.

**PostCSS uses `@tailwindcss/postcss`** (not the old `postcss7-compat` package — that was the previous incorrect config).

### State management

No global state library. State is organized into three layers:

1. **`src/lib/storage.ts`** — all localStorage operations. Single source of truth for reads/writes. Keys: `hermes-gateway-url`, `hermes-auth-token`, `hermes-settings`, `hermes-sessions`, `hermes-messages-{sessionId}`, `hermes-active-session`.

2. **Hooks** (`src/hooks/`):
   - `useSessions` — CRUD for the session list; keeps React state in sync with localStorage
   - `useChat` — streaming chat state machine: `messages`, `streamingContent` (ephemeral, not persisted until stream completes), `status`, `error`
   - `useConnectionStatus` — pings `/v1/models` to detect gateway reachability
   - `useSettings` is handled by `SettingsProvider` in context

3. **`src/context/SettingsContext.tsx`** — provides `settings` + `updateSettings` to the whole tree; writes through to localStorage immediately.

### API layer (`src/lib/api.ts`)

Two functions:
- `streamMessage(messages, model, maxTokens, systemPrompt, callbacks, signal)` — SSE streaming via native `fetch` + `ReadableStream`. Parses `data:` lines, calls `onChunk` per delta, `onDone` with token usage on `[DONE]`, `onError` on failure. Uses `AbortSignal` for cancellation.
- `testConnection()` — `HEAD` / `GET` to `/v1/models` with 5-second timeout; returns `{ ok, latencyMs, error }`.

**Do not use axios** — streaming requires direct `ReadableStream` access that axios doesn't expose.

### Key streaming detail

During streaming, chunks accumulate in `streamingContent` (React state only). The assistant message is NOT written to localStorage until the stream completes (avoids per-chunk storage writes). If the user refreshes mid-stream, the incomplete response is lost — this is intentional.

### Component tree

```
ChatLayout
├── Sidebar
│   └── SessionListItem (×n)
│       ConnectionBadge
├── ChatMain
│   ├── MessageList
│   │   ├── MessageBubble → MarkdownRenderer / ToolCallDisplay
│   │   └── StreamingIndicator
│   └── InputBar
└── SettingsModal → Modal
```

### Markdown rendering (`src/components/MarkdownRenderer.tsx`)

Uses `react-markdown` + `remark-gfm` + `rehype-highlight`. Code blocks get a custom component with a copy button and language label. The `hljs` color theme is overridden in `index.css` to match the design tokens. Inline code uses `var(--accent)` color. The `pre` wrapper is suppressed to avoid double-nesting with the custom code block component.

### Session management

Sessions are local-only (Hermes doesn't expose a session persistence API). Each session has its messages stored separately under `hermes-messages-{id}`. Session titles auto-set to the first 60 characters of the first user message. Sessions are sorted newest-first in the sidebar.

### Types (`src/types/index.ts`)

Canonical types for the whole app. `HermesSettings` includes `systemPrompt` and `maxTokens` (not `maxIterations`). `SessionMessage` is the persisted message type (has `sessionId`). `HermesMessage` is the legacy type kept for compatibility.
