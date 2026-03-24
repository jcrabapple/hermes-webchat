import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, MessageSquare, Clock, Zap } from 'lucide-react'
import { listLiveSessions } from '../../lib/adminApi'
import type { LiveSession } from '../../types/admin'
import { relativeTime } from '../../utils/date'

type FilterStatus = 'all' | LiveSession['status']
type FilterPlatform = 'all' | string

const PLATFORM_COLORS: Record<string, string> = {
  telegram:  '#26a5e4',
  discord:   '#5865f2',
  slack:     '#4a154b',
  whatsapp:  '#25d366',
  signal:    '#3a76f0',
  api:       '#f59e0b',
}

const STATUS_COLORS: Record<LiveSession['status'], { bg: string; text: string; dot: string }> = {
  active:    { bg: 'rgba(16,185,129,0.15)',  text: '#34d399', dot: '#10b981' },
  idle:      { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', dot: '#6b7280' },
  running:   { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24', dot: '#f59e0b' },
  error:     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', dot: '#ef4444' },
  completed: { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', dot: '#3b82f6' },
}

function PlatformBadge({ platform }: { platform?: string }) {
  if (!platform) return null
  const color = PLATFORM_COLORS[platform] ?? '#9ca3af'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ background: `${color}20`, color }}
    >
      {platform}
    </span>
  )
}

function StatusDot({ status }: { status: LiveSession['status'] }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: c.dot,
          boxShadow: status === 'active' || status === 'running' ? `0 0 6px ${c.dot}` : 'none',
        }}
      />
      {status}
    </span>
  )
}

function formatTokens(n?: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function LiveSessionsPanel() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

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

  const platforms = Array.from(new Set(sessions.map(s => s.platform).filter(Boolean)))

  const filtered = sessions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (platformFilter !== 'all' && s.platform !== platformFilter) return false
    return true
  })

  const totalTokens = sessions.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0)
  const totalCost   = sessions.reduce((sum, s) => sum + (s.estimatedCostUsd ?? 0), 0)

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
            {sessions.length} sessions · {formatTokens(totalTokens)} tokens
            {totalCost > 0 && ` · $${totalCost.toFixed(4)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className="w-8 h-5 rounded-full relative transition-colors flex-shrink-0"
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
        {/* Platform filters */}
        <button
          onClick={() => setPlatformFilter('all')}
          className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
          style={{
            background: platformFilter === 'all' ? 'var(--accent-muted)' : 'var(--bg-elevated)',
            borderColor: platformFilter === 'all' ? 'var(--accent-border)' : 'var(--border-default)',
            color: platformFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          All platforms
        </button>
        {platforms.map(p => {
          const color = PLATFORM_COLORS[p!] ?? '#9ca3af'
          const active = platformFilter === p
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(active ? 'all' : p!)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap capitalize transition-all"
              style={{
                background: active ? `${color}20` : 'var(--bg-elevated)',
                borderColor: active ? color : 'var(--border-default)',
                color: active ? color : 'var(--text-secondary)',
              }}
            >
              {p}
            </button>
          )
        })}

        <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-subtle)' }} />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as FilterStatus)}
          className="px-2 py-1 rounded-lg text-xs outline-none border"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="completed">Completed</option>
          <option value="error">Error</option>
        </select>
      </div>

      {error && (
        <div
          className="mx-6 mt-4 flex items-start gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {sessions.length === 0 ? 'No sessions found' : 'No sessions match the filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => (
              <div
                key={s.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
              >
                {/* Platform icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${PLATFORM_COLORS[s.platform ?? ''] ?? '#9ca3af'}18` }}
                >
                  <MessageSquare size={14} style={{ color: PLATFORM_COLORS[s.platform ?? ''] ?? '#9ca3af' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.title}
                    </span>
                    <PlatformBadge platform={s.platform} />
                    <StatusDot status={s.status} />
                    {s.chatType && (
                      <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                        {s.chatType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.totalTokens !== undefined && s.totalTokens > 0 && (
                      <span className="flex items-center gap-1">
                        <Zap size={10} />
                        {formatTokens(s.totalTokens)} tokens
                      </span>
                    )}
                    {s.estimatedCostUsd !== undefined && s.estimatedCostUsd > 0 && (
                      <span>${s.estimatedCostUsd.toFixed(4)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {relativeTime(s.updatedAt)}
                    </span>
                    <span className="font-mono opacity-60 text-xs truncate max-w-xs">{s.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
