import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, RefreshCw, X, Brain, User } from 'lucide-react'
import { listMemory, createMemory, updateMemory, deleteMemory } from '../../lib/adminApi'
import type { MemoryEntry } from '../../types/admin'
import Modal from '../Modal'

type Tab = 'memory' | 'user'

const TAB_META: Record<Tab, { label: string; icon: typeof Brain; description: string }> = {
  memory: { label: 'Agent Memory',   icon: Brain, description: 'MEMORY.md — facts the agent has learned about its environment and tools' },
  user:   { label: 'User Profile',   icon: User,  description: 'USER.md — your preferences, communication style, and personal context'   },
}

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MemoryEntry
  onEdit: (e: MemoryEntry) => void
  onDelete: (e: MemoryEntry) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const lines = entry.content.split('\n')
  const preview = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  return (
    <div
      className="group px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
      style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <pre
            className="text-sm whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}
          >
            {expanded || !hasMore ? entry.content : preview}
          </pre>
          {hasMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs mt-1"
              style={{ color: 'var(--accent)' }}
            >
              {expanded ? '↑ Show less' : `↓ ${lines.length - 3} more lines`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--error)' }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MemoryPanel() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('memory')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MemoryEntry | null>(null)
  const [draft, setDraft] = useState('')
  const [draftFile, setDraftFile] = useState<Tab>('memory')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MemoryEntry | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await listMemory()
    setLoading(false)
    if (error) { setError(error); return }
    setEntries(data?.memories ?? [])
  }

  useEffect(() => { load() }, [])

  const visible = entries.filter(e => e.file === tab)

  const openCreate = () => {
    setEditing(null)
    setDraft('')
    setDraftFile(tab)
    setModalOpen(true)
  }

  const openEdit = (e: MemoryEntry) => {
    setEditing(e)
    setDraft(e.content)
    setDraftFile(e.file)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!draft.trim()) return
    setSaving(true)
    setError(null)
    if (editing) {
      const { error } = await updateMemory(editing.id, draft.trim())
      if (error) setError(error)
      else await load()
    } else {
      const { error } = await createMemory({ content: draft.trim(), file: draftFile })
      if (error) setError(error)
      else await load()
    }
    setSaving(false)
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteMemory(deleteTarget.id)
    if (error) setError(error)
    else setEntries(prev => prev.filter(e => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

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
            {entries.filter(e => e.file === 'memory').length} agent · {entries.filter(e => e.file === 'user').length} user entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex px-6 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {(Object.keys(TAB_META) as Tab[]).map(t => {
          const { label, icon: Icon } = TAB_META[t]
          const count = entries.filter(e => e.file === t).length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors mr-1"
              style={{
                borderColor: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={13} />
              {label}
              <span
                className="px-1.5 rounded text-xs"
                style={{
                  background: tab === t ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="px-6 py-2 flex-shrink-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {TAB_META[tab].description}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-6 mb-2 flex items-start gap-2 px-4 py-3 rounded-lg text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No entries in {TAB_META[tab].label}</p>
            <button onClick={openCreate} className="text-xs" style={{ color: 'var(--accent)' }}>
              Add first entry →
            </button>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {visible.map(entry => (
              <EntryCard key={entry.id} entry={entry} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {editing ? 'Edit Entry' : 'New Memory Entry'}
            </h2>
            {!editing && (
              <div className="flex items-center gap-3 mt-2">
                {(Object.keys(TAB_META) as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setDraftFile(t)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      background: draftFile === t ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                      borderColor: draftFile === t ? 'var(--accent-border)' : 'var(--border-default)',
                      color: draftFile === t ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {TAB_META[t].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={10}
            autoFocus
            placeholder="Memory entry content..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--mono)',
              lineHeight: '1.6',
            }}
          />
        </div>
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded-lg text-sm hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-sm">
        <div className="px-5 py-5">
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Delete this memory entry?
          </h2>
          <pre
            className="text-xs rounded-lg p-3 mb-4 whitespace-pre-wrap break-words max-h-32 overflow-y-auto"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
            }}
          >
            {deleteTarget?.content.slice(0, 200)}{(deleteTarget?.content.length ?? 0) > 200 ? '…' : ''}
          </pre>
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
