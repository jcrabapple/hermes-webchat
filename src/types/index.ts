export interface HermesMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  model?: string
  platform?: string
  tokens?: number
  toolCalls?: ToolCall[]
  thinking?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status?: 'pending' | 'running' | 'done' | 'error'
}

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface SessionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  tokenCount?: number
  toolCalls?: ToolCall[]
  thinking?: string
}

export interface HermesSettings {
  theme: 'dark' | 'light' | 'oled' | 'system'
  accentColor: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'
  model: string
  maxTokens: number
  systemPrompt: string
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ConnectionStatus {
  state: 'unknown' | 'connected' | 'connecting' | 'disconnected' | 'error'
  error?: string
  latencyMs?: number
}

export const DEFAULT_SETTINGS: HermesSettings = {
  theme: 'dark',
  accentColor: 'cyan',
  model: 'hermes-agent',
  maxTokens: 4096,
  systemPrompt: '',
}
