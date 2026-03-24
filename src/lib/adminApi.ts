/**
 * Admin API client — calls the companion admin server at localhost:8644.
 * Start it with: node server/admin.mjs  (or npm run admin)
 */

import type { MemoryEntry, CronJob, LiveSession, HermesConfigResponse } from '../types/admin'

const ADMIN_BASE = 'http://127.0.0.1:8644'

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${ADMIN_BASE}${path}`, init)
    if (res.status === 204) return { data: null, error: null }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: body?.error?.message ?? `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Friendlier message when the admin server isn't running
    const friendly = msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('Failed')
      ? 'Admin server not running — start it with: node server/admin.mjs'
      : msg
    return { data: null, error: friendly }
  }
}

function jsonBody(data: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}

// ── Memory ────────────────────────────────────────────────────────────────────

export const listMemory = () =>
  apiFetch<{ memories: MemoryEntry[] }>('/v1/memory')

export const createMemory = (entry: { content: string; file: 'memory' | 'user' }) =>
  apiFetch<{ memory: MemoryEntry }>('/v1/memory', jsonBody(entry))

export const updateMemory = (id: string, content: string) =>
  apiFetch<{ memory: MemoryEntry }>(`/v1/memory/${id}`, {
    ...jsonBody({ content }),
    method: 'PUT',
  })

export const deleteMemory = (id: string) =>
  apiFetch<null>(`/v1/memory/${id}`, { method: 'DELETE' })

// ── Cron Jobs ─────────────────────────────────────────────────────────────────

export const listCrons = () =>
  apiFetch<{ crons: CronJob[] }>('/v1/crons')

export const createCron = (c: {
  name: string
  schedule: string
  prompt: string
  model?: string
  skills?: string[]
  deliver?: string
  enabled: boolean
}) => apiFetch<{ cron: CronJob }>('/v1/crons', jsonBody(c))

export const updateCron = (id: string, c: Partial<CronJob>) =>
  apiFetch<{ cron: CronJob }>(`/v1/crons/${id}`, { ...jsonBody(c), method: 'PUT' })

export const deleteCron = (id: string) =>
  apiFetch<null>(`/v1/crons/${id}`, { method: 'DELETE' })

export const runCronNow = (id: string) =>
  apiFetch<{ ok: boolean }>(`/v1/crons/${id}/run`, { method: 'POST' })

// ── Sessions ──────────────────────────────────────────────────────────────────

export const listLiveSessions = () =>
  apiFetch<{ sessions: LiveSession[] }>('/v1/sessions')

// ── Config ────────────────────────────────────────────────────────────────────

export const getConfig = () =>
  apiFetch<HermesConfigResponse>('/v1/config')

export const updateConfig = (config: string) =>
  apiFetch<{ ok: boolean }>('/v1/config', { ...jsonBody({ config }), method: 'PUT' })
