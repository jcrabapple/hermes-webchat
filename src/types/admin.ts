// ── Memory ────────────────────────────────────────────────────────────────────
// Sourced from ~/.hermes/memories/MEMORY.md and USER.md
// Entries are §-separated plain text blocks

export interface MemoryEntry {
  id: string          // e.g. "memory-0" or "user-3"
  content: string     // the full text of the entry
  file: 'memory' | 'user'
}

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
// Sourced from ~/.hermes/cron/jobs.json

export interface CronSchedule {
  kind: string        // "cron"
  expr: string        // e.g. "0 9 * * 6"
  display: string     // same as expr or human label
}

export interface CronJob {
  id: string
  name: string
  prompt: string
  skills?: string[]
  model?: string | null
  provider?: string | null
  schedule: CronSchedule
  schedule_display?: string
  repeat?: { times: number | null; completed: number }
  enabled: boolean
  state: 'scheduled' | 'paused' | 'running' | 'error'
  paused_at?: string | null
  paused_reason?: string | null
  created_at: string
  next_run_at?: string | null
  last_run_at?: string | null
  last_status?: 'ok' | 'error' | null
  last_error?: string | null
  deliver?: string | null
}

// ── Live Sessions ─────────────────────────────────────────────────────────────
// Sourced from ~/.hermes/sessions/sessions.json

export interface LiveSession {
  id: string
  type: 'chat' | 'cron' | 'agent' | 'background'
  title: string
  status: 'active' | 'idle' | 'completed' | 'running' | 'error'
  platform?: string   // telegram, discord, slack, whatsapp, etc.
  chatType?: string   // dm, group, thread
  model?: string | null
  createdAt: string
  updatedAt: string
  totalTokens?: number
  estimatedCostUsd?: number
  sessionKey?: string
  parentSessionId?: string
}

// ── Config ────────────────────────────────────────────────────────────────────
// Raw YAML text from ~/.hermes/config.yaml

export interface HermesConfigResponse {
  config: string      // raw YAML text
}
