import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { HermesSettings } from '../types'

interface SettingsPanelProps {
  onSave: (settings: HermesSettings) => void
  onCancel: () => void
}

const THEMES = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'oled', name: 'OLED' },
  { id: 'system', name: 'System' }
]

const ACCENT_COLORS = [
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
  { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500' }
]

const MODELS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'llama-3-70b'
]

export default function SettingsPanel({ onSave, onCancel }: SettingsPanelProps) {
  const [settings, setSettings] = useState<HermesSettings>({
    theme: 'dark',
    accentColor: 'cyan',
    model: 'gpt-4',
    maxIterations: 10
  })

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('hermes-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleChange = (field: keyof HermesSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('hermes-settings', JSON.stringify(settings))
    onSave(settings)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleChange('theme', theme.id)}
                  className={`px-3 py-2 rounded text-sm ${
                    settings.theme === theme.id
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Accent Color */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Accent Color</h3>
            <div className="flex space-x-2">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleChange('accentColor', color.id)}
                  className={`w-8 h-8 rounded-full ${color.class} ${
                    settings.accentColor === color.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>
          
          {/* Model Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Model</h3>
            <select
              value={settings.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          {/* Max Iterations */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Max Iterations</h3>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.maxIterations}
              onChange={(e) => handleChange('maxIterations', parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}