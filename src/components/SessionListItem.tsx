import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { Session } from '../types'
import { relativeTime } from '../utils/date'

interface SessionListItemProps {
  session: Session
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export default function SessionListItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: SessionListItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitRename = () => {
    const val = draft.trim()
    if (val && val !== session.title) onRename(val)
    else setDraft(session.title)
    setEditing(false)
  }

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all select-none"
      style={{
        background: isActive ? 'var(--bg-overlay)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onClick={() => { if (!editing && !confirmDelete) onSelect() }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') { setDraft(session.title); setEditing(false) }
          }}
          onBlur={commitRename}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b"
          style={{
            color: 'var(--text-primary)',
            borderColor: 'var(--accent)',
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p
            className="text-sm truncate leading-snug"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {session.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {relativeTime(session.updatedAt)}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!editing && !confirmDelete && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); setDraft(session.title); setEditing(true) }}
            className="p-1 rounded transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Rename"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="p-1 rounded transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Delete?</span>
          <button
            onClick={() => { onDelete(); setConfirmDelete(false) }}
            className="p-1 rounded hover:bg-white/10"
            style={{ color: 'var(--error)' }}
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="p-1 rounded hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
