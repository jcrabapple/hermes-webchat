import { useState, useCallback, useEffect } from 'react'
import type { ConnectionStatus } from '../types'
import { testConnection } from '../lib/api'
import { getGatewayUrl } from '../lib/storage'

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'unknown' })

  const ping = useCallback(async () => {
    setStatus({ state: 'connecting' })
    const result = await testConnection()
    if (result.ok) {
      setStatus({ state: 'connected', latencyMs: result.latencyMs })
    } else {
      setStatus({ state: 'error', error: result.error })
    }
  }, [])

  // Ping once on mount, and whenever gateway URL changes
  useEffect(() => {
    const url = getGatewayUrl()
    if (url) ping()
  }, [ping])

  return { status, ping }
}
