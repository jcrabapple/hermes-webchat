import { useState } from 'react'
import { Settings, Menu } from 'lucide-react'
import type { Session } from '../types'
import { useChat } from '../hooks/useChat'
import MessageList from './MessageList'
import InputBar from './InputBar'

interface ChatMainProps {
  session: Session | null
  onSessionUpdate: (id: string, patch: Partial<Session>) => void
  onOpenSettings: () => void
  onOpenSidebar?: () => void  // mobile only
}

export default function ChatMain({
  session,
  onSessionUpdate,
  onOpenSettings,
  onOpenSidebar,
}: ChatMainProps) {
  const [input, setInput] = useState('')
  const { messages, status, streamingContent, error, sendMessage, cancelStream, clearError } =
    useChat({ session, onSessionUpdate })

  const handleSend = () => {
    if (!input.trim() || status === 'streaming') return
    sendMessage(input)
    setInput('')
  }

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 md:hidden"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu size={18} />
          </button>
        )}
        <h1
          className="font-semibold text-sm truncate flex-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {session?.title ?? 'Hermes Agent'}
        </h1>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center justify-between px-4 py-2 text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}
        >
          <span>⚠ {error}</span>
          <button onClick={clearError} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={status === 'streaming'}
      />

      {/* Input */}
      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onCancel={cancelStream}
        isStreaming={status === 'streaming'}
        disabled={!session}
      />
    </div>
  )
}
