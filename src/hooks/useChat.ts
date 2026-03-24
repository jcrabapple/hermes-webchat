import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SessionMessage, Session } from '../types'
import { streamMessage } from '../lib/api'
import * as storage from '../lib/storage'
import { useSettings } from '../context/SettingsContext'

type ChatStatus = 'idle' | 'streaming' | 'error'

interface UseChatOptions {
  session: Session | null
  onSessionUpdate: (id: string, patch: Partial<Session>) => void
}

export function useChat({ session, onSessionUpdate }: UseChatOptions) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load messages when session changes
  useEffect(() => {
    if (!session) {
      setMessages([])
      return
    }
    setMessages(storage.getMessages(session.id))
    setStreamingContent('')
    setStatus('idle')
    setError(null)
  }, [session?.id])

  const sendMessage = useCallback((content: string) => {
    if (!session || status === 'streaming' || !content.trim()) return

    setError(null)

    const userMsg: SessionMessage = {
      id: uuidv4(),
      sessionId: session.id,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    // Append user message to state + storage
    setMessages(prev => {
      const next = [...prev, userMsg]
      storage.saveMessages(session.id, next)
      return next
    })

    // Auto-title on first message
    if (session.messageCount === 0) {
      const title = content.trim().slice(0, 60).replace(/\n/g, ' ')
      onSessionUpdate(session.id, {
        title,
        messageCount: 1,
        updatedAt: userMsg.timestamp,
      })
    } else {
      onSessionUpdate(session.id, {
        messageCount: session.messageCount + 1,
        updatedAt: userMsg.timestamp,
      })
    }

    setStatus('streaming')
    setStreamingContent('')

    const abort = new AbortController()
    abortRef.current = abort

    let accumulated = ''

    // Build messages for API (include current user message)
    const allMessages = [...messages, userMsg]

    streamMessage(
      allMessages,
      settings.model,
      settings.maxTokens,
      settings.systemPrompt,
      {
        onChunk: (delta) => {
          accumulated += delta
          setStreamingContent(accumulated)
        },
        onDone: (usage) => {
          const assistantMsg: SessionMessage = {
            id: uuidv4(),
            sessionId: session.id,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date().toISOString(),
            tokenCount: usage?.totalTokens,
          }
          setMessages(prev => {
            const next = [...prev, assistantMsg]
            storage.saveMessages(session.id, next)
            return next
          })
          setStreamingContent('')
          setStatus('idle')
          onSessionUpdate(session.id, {
            messageCount: (session.messageCount || 0) + 2,
            updatedAt: assistantMsg.timestamp,
          })
        },
        onError: (err) => {
          setError(err.message)
          setStreamingContent('')
          setStatus('error')
        },
      },
      abort.signal
    )
  }, [session, status, messages, settings, onSessionUpdate])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
    setStreamingContent('')
    setStatus('idle')
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { messages, status, streamingContent, error, sendMessage, cancelStream, clearError }
}
