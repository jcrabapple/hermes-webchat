import { getGatewayUrl, getAuthToken } from './storage'
import type { Memory, CronJob, Provider, ModelDef, LiveSession } from '../types/admin'

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${getGatewayUrl()}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    })
    if (res.status === 204) return { data: null, error: null }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: body?.error?.message ?? `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Memory ──────────────────────────────────────────────────────────────────

export const listMemory = () =>
  apiFetch<{ memories: Memory[] }>('/v1/memory')

export const createMemory = (m: { key: string; value: string; type?: string }) =>
  apiFetch<{ memory: Memory }>('/v1/memory', {
    method: 'POST',
    body: JSON.stringify(m),
  })

export const updateMemory = (id: string, m: { key?: string; value?: string; type?: string }) =>
  apiFetch<{ memory: Memory }>(`/v1/memory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(m),
  })

export const deleteMemory = (id: string) =>
  apiFetch<null>(`/v1/memory/${id}`, { method: 'DELETE' })

// ── Cron Jobs ────────────────────────────────────────────────────────────────

export const listCrons = () =>
  apiFetch<{ crons: CronJob[] }>('/v1/crons')

export const createCron = (c: {
  name: string
  schedule: string
  prompt: string
  model?: string
  enabled: boolean
}) => apiFetch<{ cron: CronJob }>('/v1/crons', { method: 'POST', body: JSON.stringify(c) })

export const updateCron = (id: string, c: Partial<CronJob>) =>
  apiFetch<{ cron: CronJob }>(`/v1/crons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(c),
  })

export const deleteCron = (id: string) =>
  apiFetch<null>(`/v1/crons/${id}`, { method: 'DELETE' })

export const runCronNow = (id: string) =>
  apiFetch<{ ok: boolean }>(`/v1/crons/${id}/run`, { method: 'POST' })

// ── Providers ────────────────────────────────────────────────────────────────

export const listProviders = () =>
  apiFetch<{ providers: Provider[] }>('/v1/providers')

export const createProvider = (p: {
  name: string
  type: Provider['type']
  baseUrl?: string
  apiKey?: string
  enabled: boolean
}) => apiFetch<{ provider: Provider }>('/v1/providers', { method: 'POST', body: JSON.stringify(p) })

export const updateProvider = (
  id: string,
  p: Partial<Omit<Provider, 'id' | 'createdAt' | 'hasApiKey'>> & { apiKey?: string }
) =>
  apiFetch<{ provider: Provider }>(`/v1/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(p),
  })

export const deleteProvider = (id: string) =>
  apiFetch<null>(`/v1/providers/${id}`, { method: 'DELETE' })

// ── Models ───────────────────────────────────────────────────────────────────

export const listModels = () =>
  apiFetch<{ data: ModelDef[] }>('/v1/models')

export const createModel = (m: Omit<ModelDef, 'id'>) =>
  apiFetch<{ model: ModelDef }>('/v1/models', { method: 'POST', body: JSON.stringify(m) })

export const updateModel = (id: string, m: Partial<ModelDef>) =>
  apiFetch<{ model: ModelDef }>(`/v1/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(m),
  })

export const deleteModel = (id: string) =>
  apiFetch<null>(`/v1/models/${id}`, { method: 'DELETE' })

// ── Live Sessions ────────────────────────────────────────────────────────────

export const listLiveSessions = () =>
  apiFetch<{ sessions: LiveSession[] }>('/v1/sessions')
