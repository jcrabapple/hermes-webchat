import { useState } from 'react'
import { Plus, Search, Settings, X, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../types'
import type { ConnectionStatus } from '../types'
import SessionListItem from './SessionListItem'
import ConnectionBadge from './ConnectionBadge'

interface SidebarProps {
  sessions: Session[]
  activeSessionId: string | null
  connectionStatus: ConnectionStatus
  onSelectSession: (id: string) => void
  onCreateSession: () => void
  onRenameSession: (id: string, title: string) => void
  onDeleteSession: (id: string) => void
  onOpenSettings: () => void
  onPingConnection: () => void
  onClose?: () => void  // mobile only
}

export default function Sidebar({
  sessions,
  activeSessionId,
  connectionStatus,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onOpenSettings,
  onPingConnection,
  onClose,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = search.trim()
    ? sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        width: 'var(--sidebar-width)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="hermes">⚗️</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Hermes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateSession}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
            title="New chat"
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No results' : 'No chats yet'}
          </p>
        ) : (
          filtered.map(session => (
            <SessionListItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelectSession(session.id)}
              onRename={title => onRenameSession(session.id, title)}
              onDelete={() => onDeleteSession(session.id)}
            />
          ))
        )}
      </div>

      {/* Admin link */}
      <div
        className="px-2 pb-1 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-xs transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <LayoutDashboard size={13} />
          Administration
        </button>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-3 border-t flex-shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <ConnectionBadge status={connectionStatus} onClick={onPingConnection} />
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}
