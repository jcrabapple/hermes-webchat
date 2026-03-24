import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ChatMain from './ChatMain'
import SettingsModal from './SettingsModal'
import { useSessions } from '../hooks/useSessions'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import type { Session } from '../types'

export default function ChatLayout() {
  const { sessions, activeSessionId, selectSession, createSession, renameSession, deleteSession, updateSessionMeta } =
    useSessions()
  const { status: connectionStatus, ping } = useConnectionStatus()
  const [showSettings, setShowSettings] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null

  // Create a session automatically if there are none
  useEffect(() => {
    if (sessions.length === 0) {
      createSession()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSession = (id: string) => {
    selectSession(id)
    setMobileSidebarOpen(false)
  }

  const handleCreateSession = () => {
    createSession()
    setMobileSidebarOpen(false)
  }

  const handleSessionUpdate = (id: string, patch: Partial<Session>) => {
    updateSessionMeta(id, patch)
  }

  const sidebarProps = {
    sessions,
    activeSessionId,
    connectionStatus,
    onSelectSession: handleSelectSession,
    onCreateSession: handleCreateSession,
    onRenameSession: renameSession,
    onDeleteSession: deleteSession,
    onOpenSettings: () => setShowSettings(true),
    onPingConnection: ping,
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />
          <div className="relative z-10 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Sidebar {...sidebarProps} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <ChatMain
        session={activeSession}
        onSessionUpdate={handleSessionUpdate}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
