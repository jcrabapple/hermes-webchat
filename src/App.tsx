import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import ChatInterface from './components/ChatInterface'

function App() {
  const [gatewayUrl, setGatewayUrl] = useState('')
  
  // Check if we have a stored gateway URL
  useState(() => {
    const storedUrl = localStorage.getItem('hermes-gateway-url')
    if (storedUrl) {
      setGatewayUrl(storedUrl)
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LoginScreen onLogin={(url) => {
          setGatewayUrl(url)
          localStorage.setItem('hermes-gateway-url', url)
        }} />} />
        <Route path="/chat" element={<ChatInterface gatewayUrl={gatewayUrl} />} />
      </Routes>
    </div>
  )
}

export default App