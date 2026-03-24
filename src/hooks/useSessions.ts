import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Session } from '../types'
import * as storage from '../lib/storage'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => storage.getSessions())
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(
    () => storage.getActiveSessionId()
  )

  const selectSession = useCallback((id: string) => {
    setActiveSessionIdState(id)
    storage.setActiveSessionId(id)
  }, [])

  const createSession = useCallback((): Session => {
    const session: Session = {
      id: uuidv4(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    }
    storage.saveSession(session)
    setSessions(prev => [session, ...prev])
    selectSession(session.id)
    return session
  }, [selectSession])

  const renameSession = useCallback((id: string, title: string) => {
    storage.renameSession(id, title)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }, [])

  const deleteSession = useCallback((id: string) => {
    storage.deleteSession(id)
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      return next
    })
    setActiveSessionIdState(prev => {
      if (prev === id) {
        const remaining = storage.getSessions()
        const next = remaining[0]?.id ?? null
        storage.setActiveSessionId(next)
        return next
      }
      return prev
    })
  }, [])

  const updateSessionMeta = useCallback((id: string, patch: Partial<Session>) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      // Move updated session to top
      const idx = next.findIndex(s => s.id === id)
      if (idx > 0) {
        const [item] = next.splice(idx, 1)
        next.unshift(item)
      }
      storage.saveSessions(next)
      return next
    })
  }, [])

  return {
    sessions,
    activeSessionId,
    selectSession,
    createSession,
    renameSession,
    deleteSession,
    updateSessionMeta,
  }
}
