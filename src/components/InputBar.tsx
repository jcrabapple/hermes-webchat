import { useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'

interface InputBarProps {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
}

export default function InputBar({
  value,
  onChange,
  onSend,
  onCancel,
  isStreaming,
  disabled,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && value.trim()) onSend()
    }
    if (e.key === 'Escape') {
      e.currentTarget.blur()
    }
  }

  const canSend = value.trim().length > 0 && !isStreaming && !disabled

  return (
    <div
      className="flex-shrink-0 px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div
        className="flex items-end gap-2 rounded-xl p-2"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Attachment button (placeholder) */}
        <button
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/10 mb-0.5"
          style={{ color: 'var(--text-muted)' }}
          title="Attach file"
          disabled={isStreaming}
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Hermes..."
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed py-1.5"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--accent)',
            minHeight: '36px',
            maxHeight: '160px',
          }}
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ background: 'var(--error)', color: '#fff' }}
            title="Stop generation"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{
              background: canSend ? 'var(--accent)' : 'var(--bg-overlay)',
              color: canSend ? '#fff' : 'var(--text-muted)',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
            title="Send message (Enter)"
          >
            <Send size={14} />
          </button>
        )}
      </div>
      <p className="text-center mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
