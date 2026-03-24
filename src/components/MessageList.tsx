import { useEffect, useRef, useState, useCallback } from 'react'
import type { SessionMessage } from '../types'
import MessageBubble from './MessageBubble'
import StreamingIndicator from './StreamingIndicator'
import { formatDate, formatTime } from '../utils/date'
import { ChevronDown } from 'lucide-react'

interface MessageListProps {
  messages: SessionMessage[]
  streamingContent: string
  isStreaming: boolean
}

interface MessageGroup {
  role: 'user' | 'assistant' | 'system'
  messages: SessionMessage[]
  date: string
}

function groupMessages(messages: SessionMessage[]): { date: string; groups: MessageGroup[] }[] {
  const byDate: Record<string, MessageGroup[]> = {}
  const dateOrder: string[] = []

  for (const msg of messages) {
    const date = formatDate(msg.timestamp)
    if (!byDate[date]) {
      byDate[date] = []
      dateOrder.push(date)
    }

    const lastGroup = byDate[date].at(-1)
    if (lastGroup && lastGroup.role === msg.role) {
      lastGroup.messages.push(msg)
    } else {
      byDate[date].push({ role: msg.role, messages: [msg], date })
    }
  }

  return dateOrder.map(date => ({ date, groups: byDate[date] }))
}

function RoleAvatar({ role }: { role: 'user' | 'assistant' | 'system' }) {
  const isUser = role === 'user'
  return (
    <div
      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
      style={{
        background: isUser ? 'var(--accent-muted)' : 'var(--bg-overlay)',
        color: isUser ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${isUser ? 'var(--accent-border)' : 'var(--border-default)'}`,
      }}
    >
      {isUser ? 'U' : 'A'}
    </div>
  )
}

export default function MessageList({ messages, streamingContent, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)

  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Auto-scroll when new content arrives, unless user scrolled up
  useEffect(() => {
    if (!userScrolled) scrollToBottom()
  }, [messages, streamingContent, userScrolled, scrollToBottom])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const threshold = 80
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setUserScrolled(!atBottom)
  }

  const dated = groupMessages(messages)

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6"
      >
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <span style={{ fontSize: 32 }}>⚗️</span>
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Hermes Agent
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Start a conversation below
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {dated.map(({ date, groups }) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>{date}</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                </div>

                {/* Message groups */}
                {groups.map((group, gi) => (
                  <div
                    key={gi}
                    className={`flex gap-3 mb-4 ${group.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="pt-1">
                      <RoleAvatar role={group.role} />
                    </div>
                    <div className={`flex-1 min-w-0 space-y-0.5 ${group.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      {group.messages.map((msg, mi) => (
                        <div key={msg.id} className={`flex flex-col ${group.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                          <MessageBubble message={msg} />
                          {mi === group.messages.length - 1 && (
                            <span className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
                              {formatTime(msg.timestamp)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div className="flex gap-3 mb-4">
                <div className="pt-1"><RoleAvatar role="assistant" /></div>
                <div className="flex-1 min-w-0">
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      sessionId: '',
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date().toISOString(),
                    }}
                    isStreaming
                  />
                </div>
              </div>
            )}

            {/* Thinking indicator (before first chunk) */}
            {isStreaming && !streamingContent && (
              <div className="flex gap-3 mb-4">
                <div className="pt-1"><RoleAvatar role="assistant" /></div>
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderBottomLeftRadius: 4,
                  }}
                >
                  <StreamingIndicator />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {userScrolled && (
        <button
          onClick={() => { scrollToBottom(true); setUserScrolled(false) }}
          className="absolute bottom-4 right-4 flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all hover:scale-110"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  )
}
