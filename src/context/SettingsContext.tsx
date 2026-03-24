import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { HermesSettings } from '../types'
import { getSettings, saveSettings } from '../lib/storage'

interface SettingsContextValue {
  settings: HermesSettings
  updateSettings: (patch: Partial<HermesSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function resolveTheme(theme: HermesSettings['theme']): string {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HermesSettings>(getSettings)

  useEffect(() => {
    const apply = (s: HermesSettings) => {
      document.documentElement.setAttribute('data-theme', resolveTheme(s.theme))
      document.documentElement.setAttribute('data-accent', s.accentColor)
    }
    apply(settings)

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => apply(settings)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings])

  const updateSettings = (patch: Partial<HermesSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
