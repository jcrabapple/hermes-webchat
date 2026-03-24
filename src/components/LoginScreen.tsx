import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { setGatewayUrl, setAuthToken, getGatewayUrl, getAuthToken } from '../lib/storage'

export default function LoginScreen() {
  const [gatewayUrl, setGatewayUrlState] = useState(() => getGatewayUrl())
  const [authToken, setAuthTokenState] = useState(() => getAuthToken() ?? '')
  const [showToken, setShowToken] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGatewayUrl(gatewayUrl)
    setAuthToken(authToken)
    navigate('/chat')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontSize: 36,
            }}
          >
            ⚗️
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Hermes Agent
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Connect to your gateway
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Gateway URL
            </label>
            <input
              type="url"
              required
              value={gatewayUrl}
              onChange={e => setGatewayUrlState(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              placeholder="http://127.0.0.1:8642"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Auth Token{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={authToken}
                onChange={e => setAuthTokenState(e.target.value)}
                className="w-full rounded-lg px-3 py-2 pr-9 text-sm outline-none border transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Bearer token"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Connect
          </button>
        </form>
      </div>
    </div>
  )
}
