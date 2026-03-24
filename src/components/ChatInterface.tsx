import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { connectWebSocket, sendMessage } from '../lib/api'
import SettingsPanel from './SettingsPanel'
import ToolCallDisplay from './ToolCallDisplay'
import MarkdownRenderer from './MarkdownRenderer'
import FileUpload from './FileUpload'
import type { HermesSettings, ToolCall } from '../types'
import type { HermesMessage } from '../types'

interface ChatInterfaceProps {
  gatewayUrl?: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<HermesMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({ 
    isConnected: false, 
    isConnecting: false,
    error: '' 
  })
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const gatewayUrl = localStorage.getItem('hermes-gateway-url')
    if (!gatewayUrl) {
      navigate('/')
    }
    
    // Connect to WebSocket for real-time updates
    let ws: WebSocket | null = null
    
    try {
      setConnectionStatus({ 
      isConnected: false, 
      isConnecting: true,
      error: '' 
    })
      ws = connectWebSocket(
        (data) => {
          // Handle incoming WebSocket messages
          console.log('Received WebSocket message:', data)
          
          if (data.type === 'message') {
            // Add new message to state
            const newMessage: HermesMessage = {
              id: data.payload.id || Date.now().toString(),
              role: data.payload.role,
              content: data.payload.content,
              timestamp: data.payload.timestamp || new Date().toISOString(),
              model: data.payload.model,
              platform: data.payload.platform,
              tokens: data.payload.tokens,
              toolCalls: data.payload.toolCalls,
              thinking: data.payload.thinking
            }
            setMessages(prev => [...prev, newMessage])
            setConnectionStatus({ 
              isConnected: true, 
              isConnecting: false,
              error: '' 
            })
          } else if (data.type === 'thinking') {
            // Show thinking indicator
            setIsLoading(true)
          } else if (data.type === 'done') {
            setIsLoading(false)
          } else if (data.type === 'tokens') {
            // Update token usage if needed
          }
        },
        (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus({ 
            isConnected: false, 
            isConnecting: false, 
            error: 'Connection failed' 
          })
        },
        () => {
          // Handle WebSocket close
          console.log('WebSocket connection closed')
          setConnectionStatus({ 
            isConnected: false, 
            isConnecting: false, 
            error: 'Connection closed' 
          })
        }
      )
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setConnectionStatus({ 
        isConnected: false, 
        isConnecting: false, 
        error: 'Connection failed' 
      })
    }
    
    // Cleanup WebSocket connection
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [navigate])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Add user message
    const userMessage: HermesMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send message to Hermes API
      const response = await sendMessage(input)
      
      // Add assistant response
      const assistantMessage: HermesMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        model: response.model,
        platform: response.platform,
        tokens: response.tokens,
        toolCalls: response.toolCalls,
        thinking: response.thinking
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: HermesMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  const ThinkingBlock = ({ content }: { content: string }) => {
    const [expanded, setExpanded] = useState(false)
    
    return (
      <div className="mt-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div 
          className="p-3 cursor-pointer flex justify-between items-center"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="font-medium text-blue-800 dark:text-blue-200">
            💡 Thinking...
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {expanded ? '▲ Collapse' : '▼ Expand'}
          </div>
        </div>
        
        {expanded && (
          <div className="p-3 pt-0 border-t border-blue-200 dark:border-blue-800">
            <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel 
          onSave={handleSettingsSave} 
          onCancel={() => setShowSettings(false)} 
        />
      )}
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Hermes Agent</h1>
          <div className="relative">
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus.isConnected ? 'bg-green-500' : 
              connectionStatus.isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">SESSIONS</h2>
            <div className="space-y-1">
              <div className="p-2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 cursor-pointer">
                Current Session
              </div>
              <div className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                Previous Session 1
              </div>
              <div className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                Previous Session 2
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 ml-10' 
                    : 'bg-gray-100 dark:bg-gray-800 mr-10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="flex space-x-2">
                    {message.platform && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        {message.platform}
                      </span>
                    )}
                    {message.model && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        {message.model}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-800 dark:text-gray-200">
                  <MarkdownRenderer content={message.content} />
                </div>
                
                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.toolCalls.map((toolCall: ToolCall, index: number) => (
                      <ToolCallDisplay key={`${message.id}-tool-${index}`} toolCall={toolCall} />
                    ))}
                  </div>
                )}
                
                {/* Thinking Content */}
                {message.thinking && (
                  <ThinkingBlock content={message.thinking} />
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  {message.tokens && (
                    <span>{message.tokens} tokens</span>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 mr-10">
                <div className="font-semibold text-sm mb-1">Assistant</div>
                <div className="text-gray-800 dark:text-gray-200 flex items-center">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="ml-2">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex space-x-2">
              <FileUpload onFileSelect={(file) => console.log('File selected:', file)} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                disabled={isLoading}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Shift+Enter for new line
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}