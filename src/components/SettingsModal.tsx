import { useState } from 'react'
import { X, Palette, MessageSquare, Wifi, CheckCircle, XCircle } from 'lucide-react'
import Modal from './Modal'
import { useSettings } from '../context/SettingsContext'
import { testConnection } from '../lib/api'
import { setGatewayUrl, setAuthToken, getGatewayUrl, getAuthToken } from '../lib/storage'
import type { HermesSettings } from '../types'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'appearance' | 'chat' | 'connection'

const THEMES: { id: HermesSettings['theme']; label: string }[] = [
  { id: 'dark',   label: 'Dark'   },
  { id: 'light',  label: 'Light'  },
  { id: 'oled',   label: 'OLED'   },
  { id: 'system', label: 'System' },
]

const ACCENTS: { id: HermesSettings['accentColor']; color: string }[] = [
  { id: 'cyan',    color: '#06b6d4' },
  { id: 'violet',  color: '#8b5cf6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'amber',   color: '#f59e0b' },
  { id: 'rose',    color: '#f43f5e' },
  { id: 'blue',    color: '#3b82f6' },
]

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()
  const [tab, setTab] = useState<Tab>('appearance')
  const [gatewayUrl, setGatewayUrlState] = useState(getGatewayUrl)
  const [authToken, setAuthTokenState] = useState(() => getAuthToken() ?? '')
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  const handleTestConnection = async () => {
    setGatewayUrl(gatewayUrl)
    setAuthToken(authToken)
    setTestResult('testing')
    const res = await testConnection()
    if (res.ok) {
      setTestResult('ok')
    } else {
      setTestResult('error')
      setTestError(res.error ?? 'Connection failed')
    }
  }

  const handleSaveConnection = () => {
    setGatewayUrl(gatewayUrl)
    setAuthToken(authToken)
    onClose()
  }

  const tabs: { id: Tab; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat',       label: 'Chat',       icon: MessageSquare },
    { id: 'connection', label: 'Connection', icon: Wifi },
  ]

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b px-5"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 transition-colors mr-1"
            style={{
              borderColor: tab === id ? 'var(--accent)' : 'transparent',
              color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5" style={{ minHeight: 280 }}>
        {tab === 'appearance' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => updateSettings({ theme: id })}
                    className="py-2 rounded-lg text-sm font-medium transition-all border"
                    style={{
                      background: settings.theme === id ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                      borderColor: settings.theme === id ? 'var(--accent-border)' : 'var(--border-default)',
                      color: settings.theme === id ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Accent Color
              </label>
              <div className="flex gap-3">
                {ACCENTS.map(({ id, color }) => (
                  <button
                    key={id}
                    onClick={() => updateSettings({ accentColor: id })}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background: color,
                      outline: settings.accentColor === id ? `3px solid ${color}` : '3px solid transparent',
                      outlineOffset: 2,
                    }}
                    title={id}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'chat' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Model
              </label>
              <input
                type="text"
                value={settings.model}
                onChange={e => updateSettings({ model: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="hermes-agent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Max Tokens: {settings.maxTokens.toLocaleString()}
              </label>
              <input
                type="range"
                min={512}
                max={32768}
                step={512}
                value={settings.maxTokens}
                onChange={e => updateSettings({ maxTokens: Number(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>512</span><span>32 768</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                System Prompt
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={e => updateSettings({ systemPrompt: e.target.value })}
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--mono)',
                }}
                placeholder="Optional system prompt..."
              />
            </div>
          </>
        )}

        {tab === 'connection' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Gateway URL
              </label>
              <input
                type="url"
                value={gatewayUrl}
                onChange={e => { setGatewayUrlState(e.target.value); setTestResult('idle') }}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="http://127.0.0.1:8642"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Auth Token <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <input
                type="password"
                value={authToken}
                onChange={e => { setAuthTokenState(e.target.value); setTestResult('idle') }}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Bearer token"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testResult === 'testing'}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                  cursor: testResult === 'testing' ? 'wait' : 'pointer',
                }}
              >
                {testResult === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult === 'ok' && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--success)' }}>
                  <CheckCircle size={14} /> Connected
                </span>
              )}
              {testResult === 'error' && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--error)' }}>
                  <XCircle size={14} /> {testError}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {tab === 'connection' && (
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveConnection}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Save
          </button>
        </div>
      )}
    </Modal>
  )
}
