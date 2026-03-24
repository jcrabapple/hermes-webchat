import React, { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, AlertCircle, RefreshCw, X, KeyRound, CheckCircle,
} from 'lucide-react'
import {
  listProviders, createProvider, updateProvider, deleteProvider,
  listModels, createModel, updateModel, deleteModel,
} from '../../lib/adminApi'
import type { Provider, ModelDef } from '../../types/admin'
import Modal from '../Modal'

const PROVIDER_TYPES: Provider['type'][] = ['openai', 'anthropic', 'ollama', 'groq', 'gemini', 'custom']

const PROVIDER_COLORS: Record<Provider['type'], { bg: string; text: string }> = {
  openai:    { bg: 'rgba(16,163,127,0.15)',  text: '#10a37f' },
  anthropic: { bg: 'rgba(210,105,30,0.15)',  text: '#d2691e' },
  ollama:    { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  groq:      { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c' },
  gemini:    { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  custom:    { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
}

const CAPABILITIES = ['chat', 'vision', 'tools', 'embedding'] as const
type Capability = typeof CAPABILITIES[number]

function ProviderBadge({ type }: { type: Provider['type'] }) {
  const c = PROVIDER_COLORS[type]
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {type}
    </span>
  )
}

interface ProviderForm {
  name: string
  type: Provider['type']
  baseUrl: string
  apiKey: string
  enabled: boolean
}

interface ModelForm {
  id: string
  name: string
  providerId: string
  contextLength: string
  capabilities: ModelDef['capabilities']
  enabled: boolean
}

const EMPTY_PROVIDER: ProviderForm = { name: '', type: 'openai', baseUrl: '', apiKey: '', enabled: true }
const EMPTY_MODEL = (providers: Provider[]): ModelForm => ({
  id: '',
  name: '',
  providerId: providers[0]?.id ?? '',
  contextLength: '',
  capabilities: ['chat'],
  enabled: true,
})

export default function ProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<ModelDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Provider modal
  const [providerModal, setProviderModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [providerForm, setProviderForm] = useState<ProviderForm>(EMPTY_PROVIDER)

  // Model modal
  const [modelModal, setModelModal] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelDef | null>(null)
  const [modelForm, setModelForm] = useState<ModelForm>(EMPTY_MODEL([]))

  const [saving, setSaving] = useState(false)
  const [deleteProvider_, setDeleteProvider] = useState<Provider | null>(null)
  const [deleteModel_, setDeleteModel] = useState<ModelDef | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [pRes, mRes] = await Promise.all([listProviders(), listModels()])
    setLoading(false)
    if (pRes.error) { setError(pRes.error); return }
    if (mRes.error) { setError(mRes.error); return }
    setProviders(pRes.data?.providers ?? [])
    setModels(mRes.data?.data ?? [])
  }

  useEffect(() => { load() }, [])

  // ── Provider actions ──────────────────────────────────────────

  const openCreateProvider = () => {
    setEditingProvider(null)
    setProviderForm(EMPTY_PROVIDER)
    setProviderModal(true)
  }

  const openEditProvider = (p: Provider) => {
    setEditingProvider(p)
    setProviderForm({ name: p.name, type: p.type, baseUrl: p.baseUrl ?? '', apiKey: '', enabled: p.enabled })
    setProviderModal(true)
  }

  const handleSaveProvider = async () => {
    if (!providerForm.name.trim()) return
    setSaving(true)
    const payload = {
      name: providerForm.name,
      type: providerForm.type,
      baseUrl: providerForm.baseUrl || undefined,
      apiKey: providerForm.apiKey || undefined,
      enabled: providerForm.enabled,
    }
    if (editingProvider) {
      const { error } = await updateProvider(editingProvider.id, payload)
      if (!error) await load()
      else setError(error)
    } else {
      const { error } = await createProvider(payload)
      if (!error) await load()
      else setError(error)
    }
    setSaving(false)
    setProviderModal(false)
  }

  const handleDeleteProvider = async () => {
    if (!deleteProvider_) return
    const { error } = await deleteProvider(deleteProvider_.id)
    if (!error) setProviders(prev => prev.filter(p => p.id !== deleteProvider_.id))
    else setError(error)
    setDeleteProvider(null)
  }

  const handleToggleProvider = async (p: Provider) => {
    const { error } = await updateProvider(p.id, { enabled: !p.enabled })
    if (!error) setProviders(prev => prev.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x))
    else setError(error)
  }

  // ── Model actions ─────────────────────────────────────────────

  const openCreateModel = () => {
    setEditingModel(null)
    setModelForm(EMPTY_MODEL(providers))
    setModelModal(true)
  }

  const openEditModel = (m: ModelDef) => {
    setEditingModel(m)
    setModelForm({
      id: m.id,
      name: m.name,
      providerId: m.providerId,
      contextLength: m.contextLength ? String(m.contextLength) : '',
      capabilities: m.capabilities ?? ['chat'],
      enabled: m.enabled,
    })
    setModelModal(true)
  }

  const handleSaveModel = async () => {
    if (!modelForm.id.trim() || !modelForm.name.trim()) return
    setSaving(true)
    const payload: Omit<ModelDef, 'id'> = {
      name: modelForm.name,
      providerId: modelForm.providerId,
      contextLength: modelForm.contextLength ? parseInt(modelForm.contextLength, 10) : undefined,
      capabilities: modelForm.capabilities,
      enabled: modelForm.enabled,
    }
    if (editingModel) {
      const { error } = await updateModel(editingModel.id, payload)
      if (!error) await load()
      else setError(error)
    } else {
      const { error } = await createModel({ ...payload, id: modelForm.id } as ModelDef)
      if (!error) await load()
      else setError(error)
    }
    setSaving(false)
    setModelModal(false)
  }

  const handleDeleteModel = async () => {
    if (!deleteModel_) return
    const { error } = await deleteModel(deleteModel_.id)
    if (!error) setModels(prev => prev.filter(m => m.id !== deleteModel_.id))
    else setError(error)
    setDeleteModel(null)
  }

  const toggleCapability = (cap: Capability) => {
    setModelForm(f => {
      const caps = (f.capabilities ?? []) as Capability[]
      return {
        ...f,
        capabilities: caps.includes(cap) ? caps.filter(c => c !== cap) : [...caps, cap],
      }
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
      >
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Providers &amp; Models
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {providers.length} {providers.length === 1 ? 'provider' : 'providers'} · {models.length} {models.length === 1 ? 'model' : 'models'}
          </p>
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div
          className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Providers section */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Providers
            </h2>
            <button
              onClick={openCreateProvider}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              <Plus size={12} />
              Add Provider
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-20">
              <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : providers.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No providers configured
            </p>
          ) : (
            <div className="space-y-2">
              {providers.map(p => (
                <div
                  key={p.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    opacity: p.enabled ? 1 : 0.6,
                  }}
                >
                  <button
                    onClick={() => handleToggleProvider(p)}
                    className="flex-shrink-0 w-8 h-5 rounded-full relative transition-colors"
                    style={{ background: p.enabled ? 'var(--accent)' : 'var(--bg-overlay)' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: p.enabled ? 'calc(100% - 18px)' : '2px' }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </span>
                      <ProviderBadge type={p.type} />
                      {p.hasApiKey && (
                        <span title="API key configured"><KeyRound size={12} style={{ color: 'var(--success)' }} /></span>
                      )}
                    </div>
                    {p.baseUrl && (
                      <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {p.baseUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => openEditProvider(p)}
                      className="p-1.5 rounded hover:bg-white/10"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteProvider(p)}
                      className="p-1.5 rounded hover:bg-white/10"
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-6 border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Models section */}
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Models
            </h2>
            <button
              onClick={openCreateModel}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              <Plus size={12} />
              Add Model
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-20">
              <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : models.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No models configured
            </p>
          ) : (
            <div className="space-y-2">
              {models.map(m => {
                const provider = providers.find(p => p.id === m.providerId)
                return (
                  <div
                    key={m.id}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                    style={{
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      opacity: m.enabled ? 1 : 0.6,
                    }}
                  >
                    <CheckCircle
                      size={14}
                      style={{ color: m.enabled ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 } as React.CSSProperties}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {m.id}
                        </span>
                        {m.name !== m.id && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.name}</span>
                        )}
                        {provider && <ProviderBadge type={provider.type} />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {m.contextLength && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {(m.contextLength / 1000).toFixed(0)}k ctx
                          </span>
                        )}
                        {m.capabilities?.map(cap => (
                          <span
                            key={cap}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openEditModel(m)}
                        className="p-1.5 rounded hover:bg-white/10"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteModel(m)}
                        className="p-1.5 rounded hover:bg-white/10"
                        style={{ color: 'var(--error)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Provider Modal */}
      <Modal open={providerModal} onClose={() => setProviderModal(false)} className="max-w-md">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {editingProvider ? 'Edit Provider' : 'Add Provider'}
          </h2>
          <button onClick={() => setProviderModal(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              type="text"
              value={providerForm.name}
              onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))}
              placeholder="My OpenAI"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select
              value={providerForm.type}
              onChange={e => setProviderForm(f => ({ ...f, type: e.target.value as Provider['type'] }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Base URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="url"
              value={providerForm.baseUrl}
              onChange={e => setProviderForm(f => ({ ...f, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              API Key {editingProvider?.hasApiKey && <span style={{ color: 'var(--success)' }}>(currently set — leave blank to keep)</span>}
            </label>
            <input
              type="password"
              value={providerForm.apiKey}
              onChange={e => setProviderForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder={editingProvider?.hasApiKey ? '••••••••' : 'sk-...'}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={providerForm.enabled}
              onChange={e => setProviderForm(f => ({ ...f, enabled: e.target.checked }))}
              className="accent-[var(--accent)]"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enabled</span>
          </label>
        </div>
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button onClick={() => setProviderModal(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={handleSaveProvider}
            disabled={saving || !providerForm.name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Model Modal */}
      <Modal open={modelModal} onClose={() => setModelModal(false)} className="max-w-md">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {editingModel ? 'Edit Model' : 'Add Model'}
          </h2>
          <button onClick={() => setModelModal(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Model ID
              </label>
              <input
                type="text"
                value={modelForm.id}
                onChange={e => setModelForm(f => ({ ...f, id: e.target.value }))}
                placeholder="gpt-4o"
                disabled={!!editingModel}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono disabled:opacity-50"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Display Name
              </label>
              <input
                type="text"
                value={modelForm.name}
                onChange={e => setModelForm(f => ({ ...f, name: e.target.value }))}
                placeholder="GPT-4o"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Provider</label>
              <select
                value={modelForm.providerId}
                onChange={e => setModelForm(f => ({ ...f, providerId: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              >
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Context Length <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(tokens)</span>
              </label>
              <input
                type="number"
                value={modelForm.contextLength}
                onChange={e => setModelForm(f => ({ ...f, contextLength: e.target.value }))}
                placeholder="128000"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map(cap => {
                const active = modelForm.capabilities?.includes(cap)
                return (
                  <button
                    key={cap}
                    onClick={() => toggleCapability(cap)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all border"
                    style={{
                      background: active ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                      borderColor: active ? 'var(--accent-border)' : 'var(--border-default)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {cap}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={modelForm.enabled}
              onChange={e => setModelForm(f => ({ ...f, enabled: e.target.checked }))}
              className="accent-[var(--accent)]"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enabled</span>
          </label>
        </div>
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button onClick={() => setModelModal(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={handleSaveModel}
            disabled={saving || !modelForm.id.trim() || !modelForm.name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Delete Provider confirm */}
      <Modal open={!!deleteProvider_} onClose={() => setDeleteProvider(null)} className="max-w-sm">
        <div className="px-5 py-5">
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Delete provider?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium">{deleteProvider_?.name}</span> and all associated models will be removed.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteProvider(null)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleDeleteProvider} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--error)', color: '#fff' }}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Delete Model confirm */}
      <Modal open={!!deleteModel_} onClose={() => setDeleteModel(null)} className="max-w-sm">
        <div className="px-5 py-5">
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Delete model?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-mono font-medium">{deleteModel_?.id}</span> will be permanently removed.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteModel(null)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleDeleteModel} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--error)', color: '#fff' }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
