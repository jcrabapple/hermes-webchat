import type { ConnectionStatus } from '../types'

interface ConnectionBadgeProps {
  status: ConnectionStatus
  onClick?: () => void
}

const LABELS: Record<ConnectionStatus['state'], string> = {
  unknown:      'Unknown',
  connected:    'Connected',
  connecting:   'Connecting',
  disconnected: 'Disconnected',
  error:        'Error',
}

const COLORS: Record<ConnectionStatus['state'], string> = {
  unknown:      'var(--text-muted)',
  connected:    'var(--success)',
  connecting:   'var(--warning)',
  disconnected: 'var(--text-muted)',
  error:        'var(--error)',
}

export default function ConnectionBadge({ status, onClick }: ConnectionBadgeProps) {
  const color = COLORS[status.state]
  const label = LABELS[status.state]
  const isPulsing = status.state === 'connecting'

  return (
    <button
      onClick={onClick}
      title={status.error ?? `${label}${status.latencyMs ? ` (${status.latencyMs}ms)` : ''}`}
      className="flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors hover:bg-white/5"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span
        className={isPulsing ? 'animate-pulse' : ''}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: status.state === 'connected' ? `0 0 6px ${color}` : 'none',
        }}
      />
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </button>
  )
}
