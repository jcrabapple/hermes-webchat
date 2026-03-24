import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginScreenProps {
  onLogin?: (url: string) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [authToken, setAuthToken] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save to localStorage
    localStorage.setItem('hermes-gateway-url', gatewayUrl)
    if (authToken) {
      localStorage.setItem('hermes-auth-token', authToken)
    }
    
    // Navigate to chat interface or call onLogin callback
    if (onLogin) {
      onLogin(gatewayUrl)
    } else {
      navigate('/chat')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to Hermes Agent
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Connect to your Hermes Agent gateway
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="gateway-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gateway URL
              </label>
              <input
                id="gateway-url"
                name="gateway-url"
                type="url"
                required
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder="https://your-hermes-gateway.com"
              />
            </div>
            <div>
              <label htmlFor="auth-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Auth Token (optional)
              </label>
              <input
                id="auth-token"
                name="auth-token"
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Connect to Hermes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}