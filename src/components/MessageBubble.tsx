import MarkdownRenderer from './MarkdownRenderer'
import ToolCallDisplay from './ToolCallDisplay'
import type { SessionMessage } from '../types'

interface MessageBubbleProps {
  message: SessionMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
        style={
          isUser
            ? {
                background: 'var(--accent-muted)',
                border: '1px solid var(--accent-border)',
                color: 'var(--text-primary)',
                borderBottomRightRadius: 4,
              }
            : {
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderBottomLeftRadius: 4,
              }
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
        )}

        {message.toolCalls?.map(tc => (
          <ToolCallDisplay key={tc.id} toolCall={tc} />
        ))}

        {message.thinking && (
          <ThinkingBlock content={message.thinking} />
        )}

        {message.tokenCount && (
          <p className="text-right mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {message.tokenCount} tokens
          </p>
        )}
      </div>
    </div>
  )
}

function ThinkingBlock({ content }: { content: string }) {
  return (
    <details className="mt-2">
      <summary
        className="text-xs cursor-pointer select-none"
        style={{ color: 'var(--text-muted)' }}
      >
        Thinking...
      </summary>
      <pre
        className="mt-1 text-xs whitespace-pre-wrap rounded p-2"
        style={{
          color: 'var(--text-muted)',
          background: 'var(--bg-overlay)',
          fontFamily: 'var(--mono)',
        }}
      >
        {content}
      </pre>
    </details>
  )
}
