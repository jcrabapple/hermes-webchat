import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import LoginScreen from './components/LoginScreen'
import ChatLayout from './components/ChatLayout'
import AdminShell from './components/admin/AdminShell'
import MemoryPanel from './components/admin/MemoryPanel'
import CronsPanel from './components/admin/CronsPanel'
import ProvidersPanel from './components/admin/ProvidersPanel'
import LiveSessionsPanel from './components/admin/LiveSessionsPanel'
import { getGatewayUrl } from './lib/storage'

function AppRoutes() {
  const navigate = useNavigate()

  // Auto-redirect to chat if gateway is already configured
  useEffect(() => {
    const url = getGatewayUrl()
    if (url && window.location.pathname === '/') {
      navigate('/chat', { replace: true })
    }
  }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="/admin/memory" replace />} />
        <Route path="memory"    element={<MemoryPanel />} />
        <Route path="crons"     element={<CronsPanel />} />
        <Route path="providers" element={<ProvidersPanel />} />
        <Route path="sessions"  element={<LiveSessionsPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  )
}
