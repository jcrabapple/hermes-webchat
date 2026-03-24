import type { SessionMessage, TokenUsage } from '../types'
import { getGatewayUrl, getAuthToken } from './storage'

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function toApiMessages(messages: SessionMessage[]): Array<{ role: string; content: string }> {
  return messages.map(m => ({ role: m.role, content: m.content }))
}

// ── Streaming send ─────────────────────────────────────────────

export interface StreamCallbacks {
  onChunk: (delta: string) => void
  onDone: (usage: TokenUsage | null) => void
  onError: (err: Error) => void
}

export function streamMessage(
  messages: SessionMessage[],
  model: string,
  maxTokens: number,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): void {
  const gatewayUrl = getGatewayUrl()

  const apiMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...toApiMessages(messages),
  ]

  fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    signal,
    body: JSON.stringify({
      model,
      messages: apiMessages,
      stream: true,
      max_tokens: maxTokens,
    }),
  })
    .then(async response => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`${response.status}: ${err?.error?.message ?? response.statusText}`)
      }
      if (!response.body) throw new Error('Response body is null')

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      let usage: TokenUsage | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += value
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) callbacks.onChunk(delta)

            // Capture usage if present (some servers send on final chunk)
            if (json.usage) {
              usage = {
                promptTokens: json.usage.prompt_tokens,
                completionTokens: json.usage.completion_tokens,
                totalTokens: json.usage.total_tokens,
              }
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      callbacks.onDone(usage)
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)))
      }
    })
}

// ── Connection test ────────────────────────────────────────────

export async function testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const gatewayUrl = getGatewayUrl()
  const start = Date.now()
  try {
    const res = await fetch(`${gatewayUrl}/v1/models`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
