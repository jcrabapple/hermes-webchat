import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, MessageSquare, Clock, Bot, Layers, ExternalLink } from 'lucide-react'
import { listLiveSessions } from '../../lib/adminApi'
import type { LiveSession } from '../../types/admin'
import { relativeTime } from '../../utils/date'
import { useNavigate } from 'react-router-dom'

type FilterType = 'all' | LiveSession['type']
type FilterStatus = 'all' | LiveSession['status']

const TYPE_META: Record<LiveSession['type'], { label: string; icon: typeof MessageSquare; color: string }> = {
  chat:       { label: 'Chat',       icon: MessageSquare, color: '#60a5fa' },
  cron:       { label: 'Cron',       icon: Clock,         color: '#fbbf24' },
  agent:      { label: 'Agent',      icon: Bot,           color: '#a78bfa' },
  background: { label: 'Background', icon: Layers,        color: '#34d399' },
}

const STATUS_COLORS: Record<LiveSession['status'], { bg: string; text: string; dot: string }> = {
  active:    { bg: 'rgba(16,185,129,0.15)', text: '#34d399', dot: '#10b981' },
  idle:      { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', dot: '#6b7280' },
  running:   { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', dot: '#f59e0b' },
  error:     { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', dot: '#ef4444' },
  completed: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', dot: '#3b82f6' },
}

function TypeBadge({ type }: { type: LiveSession['type'] }) {
  const meta = TYPE_META[type]
  const Icon = meta.icon
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `${meta.color}20`, color: meta.color }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  )
}

function StatusBadge({ status }: { status: LiveSession['status'] }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: c.dot,
          boxShadow: status === 'running' ? `0 0 6px ${c.dot}` : 'none',
          animation: status === 'running' ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {status}
    </span>
  )
}

const TYPE_FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'chat',       label: 'Chat' },
  { id: 'cron',       label: 'Cron' },
  { id: 'agent',      label: 'Agent' },
  { id: 'background', label: 'Background' },
]

export default function LiveSessionsPanel() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await listLiveSessions()
    setLoading(false)
    if (error) { setError(error); return }
    setSessions(data?.sessions ?? [])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [autoRefresh])

  const handleOpenChat = (session: LiveSession) => {
    if (session.type === 'chat') {
      navigate('/chat')
    }
  }

  const filtered = sessions.filter(s => {
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  // Counts by type for filter pills
  const counts = sessions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
      >
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Live Sessions
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {sessions.length} total ·{' '}
            {sessions.filter(s => s.status === 'running' || s.status === 'active').length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className="flex-shrink-0 w-8 h-5 rounded-full relative transition-colors"
              style={{ background: autoRefresh ? 'var(--accent)' : 'var(--bg-overlay)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: autoRefresh ? 'calc(100% - 18px)' : '2px' }}
              />
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto</span>
          </label>
          <button
            onClick={load}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-2 px-6 py-3 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {TYPE_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTypeFilter(id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border"
            style={{
              background: typeFilter === id ? 'var(--accent-muted)' : 'var(--bg-elevated)',
              borderColor: typeFilter === id ? 'var(--accent-border)' : 'var(--border-default)',
              color: typeFilter === id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {label}
            {id !== 'all' && counts[id] !== undefined && (
              <span
                className="px-1 rounded text-xs"
                style={{ background: typeFilter === id ? 'var(--accent)' : 'var(--bg-overlay)', color: typeFilter === id ? '#fff' : 'var(--text-muted)' }}
              >
                {counts[id]}
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: 'var(--border-subtle)' }} />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as FilterStatus)}
          className="px-2 py-1 rounded-lg text-xs outline-none border"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          <option value="all">All statuses</option>
          <option value="running">Running</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="error">Error</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {sessions.length === 0 ? 'No active sessions' : 'No sessions match the current filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => {
              const meta = TYPE_META[s.type]
              const Icon = meta.icon
              return (
                <div
                  key={s.id}
                  className="group flex items-start gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
                >
                  {/* Type icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}18` }}
                  >
                    <Icon size={15} style={{ color: meta.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.title}
                      </span>
                      <TypeBadge type={s.type} />
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.model && (
                        <span
                          className="font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          {s.model}
                        </span>
                      )}
                      {s.messageCount !== undefined && (
                        <span>{s.messageCount} messages</span>
                      )}
                      <span>Started {relativeTime(s.createdAt)}</span>
                      <span>· Active {relativeTime(s.updatedAt)}</span>
                    </div>
                    {s.parentSessionId && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Sub-agent of <span className="font-mono">{s.parentSessionId}</span>
                      </p>
                    )}
                  </div>

                  {/* Open link for chat sessions */}
                  {s.type === 'chat' && (
                    <button
                      onClick={() => handleOpenChat(s)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 flex-shrink-0"
                      style={{ color: 'var(--accent)' }}
                      title="Open in chat"
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
