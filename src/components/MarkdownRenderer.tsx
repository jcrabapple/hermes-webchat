import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
}

function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const lang = className?.replace('language-', '') ?? 'plaintext'
  const code = String(children).replace(/\n$/, '')

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="relative rounded-lg my-3 overflow-hidden text-sm"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-overlay)',
        }}
      >
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs rounded px-2 py-0.5 transition-colors hover:bg-white/10"
          style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-4 m-0"
        style={{ background: 'transparent', fontFamily: 'var(--mono)', fontSize: '0.85em' }}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

const components: Components = {
  code({ className, children, ...props }) {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>
    }
    return (
      <code
        className="rounded px-1.5 py-0.5 text-sm"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--accent)',
          fontFamily: 'var(--mono)',
        }}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre({ children }) {
    // Prevent double-wrapping — our CodeBlock already renders a <pre>
    return <>{children}</>
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
        {children}
      </a>
    )
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3">
        <table>{children}</table>
      </div>
    )
  },
}

export default function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content${isStreaming ? ' streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
