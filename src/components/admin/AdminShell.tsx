import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brain, Clock, SlidersHorizontal, Activity, ArrowLeft, Settings } from 'lucide-react'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import ConnectionBadge from '../ConnectionBadge'
import { useState } from 'react'
import SettingsModal from '../SettingsModal'

const NAV_ITEMS = [
  { to: '/admin/memory',   label: 'Memory',        icon: Brain              },
  { to: '/admin/crons',    label: 'Cron Jobs',     icon: Clock              },
  { to: '/admin/config',   label: 'Configuration', icon: SlidersHorizontal  },
  { to: '/admin/sessions', label: 'Live Sessions', icon: Activity           },
]

export default function AdminShell() {
  const navigate = useNavigate()
  const { status: connectionStatus, ping } = useConnectionStatus()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Admin Sidebar */}
      <div
        className="flex flex-col h-full flex-shrink-0"
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-lg" role="img" aria-label="hermes">⚗️</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Administration
          </span>
        </div>

        {/* Back to chat */}
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} />
          Back to Chat
        </button>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'font-medium' : 'hover:bg-white/10'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--accent-muted)' : undefined,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-3 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <ConnectionBadge status={connectionStatus} onClick={ping} />
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <Outlet />
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
