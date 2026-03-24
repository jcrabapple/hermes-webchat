import { useState } from 'react'
import {
  ChevronDown, ChevronRight,
  Wrench, CheckCircle, XCircle, Loader,
  FileText, Terminal, Globe, Brain, Bell, Database,
} from 'lucide-react'
import type { ToolCall } from '../types'

// ── Tool category detection ──────────────────────────────────────────────────

type ToolCategory = 'file' | 'exec' | 'web' | 'memory' | 'notify' | 'data' | 'default'

interface CategoryStyle {
  bg: string
  text: string
  border: string
  runningBorder: string
  icon: typeof Wrench
  label: string
}

const CATEGORY_STYLES: Record<ToolCategory, CategoryStyle> = {
  file:    { bg: 'rgba(59,130,246,0.1)',   text: '#60a5fa', border: 'rgba(59,130,246,0.25)',  runningBorder: 'rgba(59,130,246,0.6)',  icon: FileText,  label: 'File'    },
  exec:    { bg: 'rgba(245,158,11,0.1)',   text: '#fbbf24', border: 'rgba(245,158,11,0.25)',  runningBorder: 'rgba(245,158,11,0.6)',  icon: Terminal,  label: 'Exec'    },
  web:     { bg: 'rgba(139,92,246,0.1)',   text: '#a78bfa', border: 'rgba(139,92,246,0.25)',  runningBorder: 'rgba(139,92,246,0.6)',  icon: Globe,     label: 'Web'     },
  memory:  { bg: 'rgba(16,185,129,0.1)',   text: '#34d399', border: 'rgba(16,185,129,0.25)',  runningBorder: 'rgba(16,185,129,0.6)',  icon: Brain,     label: 'Memory'  },
  notify:  { bg: 'rgba(244,63,94,0.1)',    text: '#fb7185', border: 'rgba(244,63,94,0.25)',   runningBorder: 'rgba(244,63,94,0.6)',   icon: Bell,      label: 'Notify'  },
  data:    { bg: 'rgba(20,184,166,0.1)',   text: '#2dd4bf', border: 'rgba(20,184,166,0.25)',  runningBorder: 'rgba(20,184,166,0.6)',  icon: Database,  label: 'Data'    },
  default: { bg: 'var(--accent-muted)',    text: 'var(--accent)', border: 'var(--accent-border)', runningBorder: 'var(--accent)', icon: Wrench, label: 'Tool' },
}

function getCategory(name: string): ToolCategory {
  const n = name.toLowerCase()
  if (/read|write|edit|file|glob|directory|path|list_dir|cat|head|tail/.test(n)) return 'file'
  if (/bash|shell|exec|run|command|terminal|process/.test(n))                    return 'exec'
  if (/search|web|fetch|http|url|browse|scrape|request/.test(n))                 return 'web'
  if (/memory|remember|store|save|recall|forget/.test(n))                        return 'memory'
  if (/message|notify|email|send|alert|slack|discord/.test(n))                   return 'notify'
  if (/sql|query|database|db|select|insert|table/.test(n))                       return 'data'
  return 'default'
}

// ── Inline param preview ─────────────────────────────────────────────────────

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'string') return v.length > 50 ? v.slice(0, 47) + '…' : v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.length} items]`
  return JSON.stringify(v).slice(0, 50)
}

function ParamPreview({ args }: { args: Record<string, unknown> }) {
  const entries = Object.entries(args).slice(0, 2)
  if (entries.length === 0) return null
  return (
    <span className="flex items-center gap-2 min-w-0 flex-1">
      {entries.map(([k, v]) => (
        <span key={k} className="flex items-center gap-1 min-w-0 text-xs truncate">
          <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
          <span
            className="font-mono truncate"
            style={{ color: 'var(--text-secondary)', maxWidth: '160px' }}
          >
            {formatValue(v)}
          </span>
        </span>
      ))}
      {Object.keys(args).length > 2 && (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          +{Object.keys(args).length - 2} more
        </span>
      )}
    </span>
  )
}

// ── Result display ───────────────────────────────────────────────────────────

function ResultDisplay({ result }: { result: unknown }) {
  const [showAll, setShowAll] = useState(false)
  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  const lines = text.split('\n')
  const truncate = lines.length > 12 && !showAll

  return (
    <div>
      <pre
        className="text-xs overflow-x-auto rounded-lg p-3"
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--mono)',
          maxHeight: showAll ? 'none' : '180px',
          overflowY: truncate ? 'hidden' : 'auto',
        }}
      >
        {truncate ? lines.slice(0, 12).join('\n') + '\n…' : text}
      </pre>
      {lines.length > 12 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-xs mt-1"
          style={{ color: 'var(--accent)' }}
        >
          {showAll ? '↑ Show less' : `↓ Show all (${lines.length} lines)`}
        </button>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface ToolCallDisplayProps {
  toolCall: ToolCall
}

export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  const category = getCategory(toolCall.name)
  const style = CATEGORY_STYLES[category]
  const Icon = style.icon
  const isRunning = toolCall.status === 'running'
  const isError = toolCall.status === 'error'

  const borderColor = isRunning
    ? style.runningBorder
    : isError
      ? 'rgba(239,68,68,0.4)'
      : style.border

  return (
    <div
      className="rounded-xl my-2 overflow-hidden text-sm transition-all"
      style={{
        border: `1px solid ${borderColor}`,
        background: isRunning ? style.bg : 'var(--bg-elevated)',
        boxShadow: isRunning ? `0 0 12px ${style.runningBorder}` : 'none',
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-white/5"
      >
        {/* Status icon */}
        <span className="flex-shrink-0">
          {toolCall.status === 'running' && (
            <Loader size={13} className="animate-spin" style={{ color: style.text }} />
          )}
          {toolCall.status === 'done' && (
            <CheckCircle size={13} style={{ color: 'var(--success)' }} />
          )}
          {toolCall.status === 'error' && (
            <XCircle size={13} style={{ color: 'var(--error)' }} />
          )}
          {(!toolCall.status || toolCall.status === 'pending') && (
            <Icon size={13} style={{ color: style.text }} />
          )}
        </span>

        {/* Category badge */}
        <span
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
          style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
        >
          <Icon size={10} />
          {style.label}
        </span>

        {/* Tool name */}
        <span
          className="font-mono text-xs font-medium flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {toolCall.name}
        </span>

        {/* Inline param preview (hidden when expanded) */}
        {!expanded && <ParamPreview args={toolCall.arguments} />}

        {/* Running pulse */}
        {isRunning && (
          <span className="flex-shrink-0 flex gap-0.5 ml-auto mr-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  background: style.text,
                  animation: `bounce 0.9s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </span>
        )}

        {/* Expand chevron */}
        <span className="flex-shrink-0 ml-auto" style={{ color: 'var(--text-muted)' }}>
          {expanded
            ? <ChevronDown size={12} />
            : <ChevronRight size={12} />}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          className="border-t px-3 py-3 space-y-3"
          style={{ borderColor: borderColor }}
        >
          {/* Arguments */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              Arguments
            </p>
            {Object.entries(toolCall.arguments).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(toolCall.arguments).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 text-xs">
                    <span
                      className="font-mono font-medium flex-shrink-0 pt-0.5"
                      style={{ color: style.text, minWidth: '80px' }}
                    >
                      {k}
                    </span>
                    <pre
                      className="flex-1 overflow-x-auto rounded p-1.5 min-w-0"
                      style={{
                        background: 'var(--bg-base)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No arguments</p>
            )}
          </div>

          {/* Result */}
          {toolCall.result !== undefined && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Result
                {isError && (
                  <span className="ml-2 font-normal" style={{ color: 'var(--error)' }}>
                    (error)
                  </span>
                )}
              </p>
              <ResultDisplay result={toolCall.result} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
