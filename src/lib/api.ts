// Utility functions for connecting to Hermes Agent

const getGatewayUrl = (): string | null => {
  return localStorage.getItem('hermes-gateway-url')
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('hermes-auth-token')
}

// Interface for Hermes message
export interface HermesMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  model?: string
  platform?: string
  tokens?: number
  toolCalls?: any[]
  thinking?: string
}

// Interface for Hermes session
export interface HermesSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  tokenUsage: number
}

// Send a message to Hermes Agent
export const sendMessage = async (message: string, sessionId?: string): Promise<HermesMessage> => {
  const gatewayUrl = getGatewayUrl()
  const authToken = getAuthToken()
  
  if (!gatewayUrl) {
    throw new Error('Gateway URL not configured')
  }
  
  const response = await fetch(`${gatewayUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    },
    body: JSON.stringify({
      message,
      sessionId
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// Get sessions from Hermes Agent
export const getSessions = async (): Promise<HermesSession[]> => {
  const gatewayUrl = getGatewayUrl()
  const authToken = getAuthToken()
  
  if (!gatewayUrl) {
    throw new Error('Gateway URL not configured')
  }
  
  const response = await fetch(`${gatewayUrl}/api/sessions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// Create a new session
export const createSession = async (title: string): Promise<HermesSession> => {
  const gatewayUrl = getGatewayUrl()
  const authToken = getAuthToken()
  
  if (!gatewayUrl) {
    throw new Error('Gateway URL not configured')
  }
  
  const response = await fetch(`${gatewayUrl}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    },
    body: JSON.stringify({ title })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// WebSocket connection for real-time updates
export const connectWebSocket = (
  onMessage: (data: any) => void, 
  onError?: (error: any) => void,
  onClose?: () => void
) => {
  const gatewayUrl = getGatewayUrl()
  const authToken = getAuthToken()
  
  if (!gatewayUrl) {
    throw new Error('Gateway URL not configured')
  }
  
  // Convert HTTP URL to WebSocket URL
  const wsProtocol = gatewayUrl.startsWith('https') ? 'wss' : 'ws'
  const baseUrl = gatewayUrl.replace(/^https?:\/\//, '')
  const wsUrl = `${wsProtocol}://${baseUrl}/api/ws`
  
  // Create WebSocket with authentication
  let ws: WebSocket
  if (authToken) {
    // Pass token as query parameter for better compatibility
    const urlWithAuth = `${wsUrl}?token=${encodeURIComponent(authToken)}`
    ws = new WebSocket(urlWithAuth)
  } else {
    ws = new WebSocket(wsUrl)
  }
  
  ws.onopen = () => {
    console.log('WebSocket connection established')
  }
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    if (onError) {
      onError(error)
    }
  }
  
  ws.onclose = () => {
    console.log('WebSocket connection closed')
    if (onClose) {
      onClose()
    }
  }
  
  return ws
}

// Get session messages
export const getSessionMessages = async (sessionId: string): Promise<HermesMessage[]> => {
  const gatewayUrl = getGatewayUrl()
  const authToken = getAuthToken()
  
  if (!gatewayUrl) {
    throw new Error('Gateway URL not configured')
  }
  
  const response = await fetch(`${gatewayUrl}/api/sessions/${sessionId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}