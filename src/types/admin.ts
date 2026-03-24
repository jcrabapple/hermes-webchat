export interface Memory {
  id: string
  key: string
  value: string
  type?: string
  createdAt: string
  updatedAt: string
}

export interface CronJob {
  id: string
  name: string
  schedule: string       // cron expression e.g. "0 9 * * *"
  prompt: string
  model?: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  lastResult?: 'success' | 'error' | null
  createdAt: string
  updatedAt: string
}

export interface Provider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'ollama' | 'groq' | 'gemini' | 'custom'
  baseUrl?: string
  hasApiKey: boolean     // true if key is configured; key itself is never returned
  enabled: boolean
  createdAt: string
}

export interface ModelDef {
  id: string
  name: string
  providerId: string
  providerName?: string
  contextLength?: number
  capabilities?: ('chat' | 'vision' | 'tools' | 'embedding')[]
  enabled: boolean
}

export interface LiveSession {
  id: string
  type: 'chat' | 'cron' | 'agent' | 'background'
  title: string
  status: 'active' | 'idle' | 'running' | 'error' | 'completed'
  model?: string
  createdAt: string
  updatedAt: string
  messageCount?: number
  parentSessionId?: string
}
