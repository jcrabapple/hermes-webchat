// Hermes Agent Types

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
  arguments: Record<string, any>
  result?: any
}

export interface HermesSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  tokenUsage: number
}

export interface HermesSettings {
  theme: 'dark' | 'light' | 'oled' | 'system'
  accentColor: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'
  model: string
  maxIterations: number
}

export interface ConnectionStatus {
  isConnected: boolean
  isConnecting: boolean
  error?: string
}