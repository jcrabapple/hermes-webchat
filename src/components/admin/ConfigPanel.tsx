import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Save, RotateCcw } from 'lucide-react'
import { getConfig, updateConfig } from '../../lib/adminApi'

export default function ConfigPanel() {
  const [original, setOriginal] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isDirty = draft !== original

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await getConfig()
    setLoading(false)
    if (error) { setError(error); return }
    const text = data?.config ?? ''
    setOriginal(text)
    setDraft(text)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await updateConfig(draft)
    setSaving(false)
    if (error) { setError(error); return }
    setOriginal(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => setDraft(original)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
      >
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Configuration
          </h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            ~/.hermes/config.yaml
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Reload from disk"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {isDirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
            style={{
              background: saved ? 'var(--success)' : 'var(--accent)',
              color: '#fff',
            }}
          >
            <Save size={13} />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="px-6 py-2 flex-shrink-0"
        style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
      >
        <p className="text-xs" style={{ color: 'var(--warning)' }}>
          ⚠ Changes are written directly to disk. Hermes will pick them up on next start. Invalid YAML will break the agent.
        </p>
      </div>

      {error && (
        <div
          className="mx-6 mt-4 flex items-start gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck={false}
            className="w-full h-full rounded-xl px-4 py-3 text-xs outline-none resize-none border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: isDirty ? 'var(--accent-border)' : 'var(--border-default)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--mono)',
              lineHeight: '1.7',
              tabSize: 2,
            }}
          />
        )}
      </div>
    </div>
  )
}
