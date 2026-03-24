import type { Session, SessionMessage, HermesSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const KEYS = {
  GATEWAY_URL:    'hermes-gateway-url',
  AUTH_TOKEN:     'hermes-auth-token',
  SETTINGS:       'hermes-settings',
  SESSIONS:       'hermes-sessions',
  ACTIVE_SESSION: 'hermes-active-session',
  SIDEBAR:        'hermes-sidebar-collapsed',
  messages: (id: string) => `hermes-messages-${id}`,
} as const

// ── Connection config ──────────────────────────────────────────

export function getGatewayUrl(): string {
  return localStorage.getItem(KEYS.GATEWAY_URL) || 'http://127.0.0.1:8642'
}

export function setGatewayUrl(url: string): void {
  localStorage.setItem(KEYS.GATEWAY_URL, url)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(KEYS.AUTH_TOKEN)
}

export function setAuthToken(token: string): void {
  if (token) {
    localStorage.setItem(KEYS.AUTH_TOKEN, token)
  } else {
    localStorage.removeItem(KEYS.AUTH_TOKEN)
  }
}

export function clearConnection(): void {
  localStorage.removeItem(KEYS.GATEWAY_URL)
  localStorage.removeItem(KEYS.AUTH_TOKEN)
}

// ── Settings ───────────────────────────────────────────────────

export function getSettings(): HermesSettings {
  const raw = localStorage.getItem(KEYS.SETTINGS)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: HermesSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ── Sessions ───────────────────────────────────────────────────

export function getSessions(): Session[] {
  const raw = localStorage.getItem(KEYS.SESSIONS)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Session[]
  } catch {
    return []
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
}

export function saveSession(session: Session): void {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  saveSessions(sessions)
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id)
  saveSessions(sessions)
  localStorage.removeItem(KEYS.messages(id))
}

export function renameSession(id: string, title: string): void {
  const sessions = getSessions()
  const session = sessions.find(s => s.id === id)
  if (session) {
    session.title = title
    saveSessions(sessions)
  }
}

// ── Active session ─────────────────────────────────────────────

export function getActiveSessionId(): string | null {
  return localStorage.getItem(KEYS.ACTIVE_SESSION)
}

export function setActiveSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(KEYS.ACTIVE_SESSION, id)
  } else {
    localStorage.removeItem(KEYS.ACTIVE_SESSION)
  }
}

// ── Messages ───────────────────────────────────────────────────

export function getMessages(sessionId: string): SessionMessage[] {
  const raw = localStorage.getItem(KEYS.messages(sessionId))
  if (!raw) return []
  try {
    return JSON.parse(raw) as SessionMessage[]
  } catch {
    return []
  }
}

export function saveMessages(sessionId: string, messages: SessionMessage[]): void {
  localStorage.setItem(KEYS.messages(sessionId), JSON.stringify(messages))
}

export function appendMessage(sessionId: string, msg: SessionMessage): void {
  const messages = getMessages(sessionId)
  messages.push(msg)
  saveMessages(sessionId, messages)
}

export function updateLastMessage(
  sessionId: string,
  updater: (msg: SessionMessage) => SessionMessage
): void {
  const messages = getMessages(sessionId)
  if (messages.length === 0) return
  messages[messages.length - 1] = updater(messages[messages.length - 1])
  saveMessages(sessionId, messages)
}

// ── Sidebar state ──────────────────────────────────────────────

export function getSidebarCollapsed(): boolean {
  return localStorage.getItem(KEYS.SIDEBAR) === 'true'
}

export function setSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(KEYS.SIDEBAR, String(collapsed))
}
