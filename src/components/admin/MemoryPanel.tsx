import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X, AlertCircle, RefreshCw } from 'lucide-react'
import { listMemory, createMemory, updateMemory, deleteMemory } from '../../lib/adminApi'
import type { Memory } from '../../types/admin'
import Modal from '../Modal'
import { relativeTime } from '../../utils/date'

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  user:      { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  project:   { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa' },
  feedback:  { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  reference: { bg: 'rgba(16,185,129,0.15)',  text: '#34d399' },
}

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null
  const colors = TYPE_COLORS[type] ?? { bg: 'var(--bg-overlay)', text: 'var(--text-muted)' }
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {type}
    </span>
  )
}

interface FormState {
  key: string
  value: string
  type: string
}

const EMPTY_FORM: FormState = { key: '', value: '', type: '' }

export default function MemoryPanel() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Memory | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await listMemory()
    setLoading(false)
    if (error) { setError(error); return }
    setMemories(data?.memories ?? [])
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (m: Memory) => {
    setEditing(m)
    setForm({ key: m.key, value: m.value, type: m.type ?? '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.key.trim() || !form.value.trim()) return
    setSaving(true)
    if (editing) {
      const { error } = await updateMemory(editing.id, {
        key: form.key,
        value: form.value,
        type: form.type || undefined,
      })
      if (!error) await load()
      else setError(error)
    } else {
      const { error } = await createMemory({
        key: form.key,
        value: form.value,
        type: form.type || undefined,
      })
      if (!error) await load()
      else setError(error)
    }
    setSaving(false)
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteMemory(deleteTarget.id)
    if (!error) setMemories(prev => prev.filter(m => m.id !== deleteTarget.id))
    else setError(error)
    setDeleteTarget(null)
  }

  const filtered = search.trim()
    ? memories.filter(
        m =>
          m.key.toLowerCase().includes(search.toLowerCase()) ||
          m.value.toLowerCase().includes(search.toLowerCase())
      )
    : memories

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
      >
        <div>
          <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Memory
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            New Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 max-w-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memory..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No matching entries' : 'No memory entries yet'}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                className="text-xs"
                style={{ color: 'var(--accent)' }}
              >
                Add first entry →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div
                key={m.id}
                className="group flex items-start gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium truncate" style={{ color: 'var(--accent)' }}>
                      {m.key}
                    </span>
                    <TypeBadge type={m.type} />
                  </div>
                  <p
                    className="text-sm line-clamp-2"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}
                  >
                    {m.value}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
                    {relativeTime(m.updatedAt)}
                  </span>
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                    style={{ color: 'var(--error)' }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-lg">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {editing ? 'Edit Memory Entry' : 'New Memory Entry'}
          </h2>
          <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Key
            </label>
            <input
              type="text"
              value={form.key}
              onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
              placeholder="user_preference"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--mono)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Value
            </label>
            <textarea
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              rows={6}
              placeholder="Memory content..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--mono)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Type <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: form.type ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="">— none —</option>
              <option value="user">user</option>
              <option value="project">project</option>
              <option value="feedback">feedback</option>
              <option value="reference">reference</option>
            </select>
          </div>
        </div>
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.key.trim() || !form.value.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-sm">
        <div className="px-5 py-5">
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Delete memory entry?
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>{deleteTarget?.key}</span> will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg text-sm hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--error)', color: '#fff' }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
