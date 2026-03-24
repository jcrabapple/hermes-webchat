import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Play, AlertCircle, RefreshCw, X, CheckCircle, XCircle, Clock } from 'lucide-react'
import { listCrons, createCron, updateCron, deleteCron, runCronNow } from '../../lib/adminApi'
import type { CronJob } from '../../types/admin'
import Modal from '../Modal'
import { relativeTime } from '../../utils/date'

/** Convert common cron expressions to human-readable strings */
function humanSchedule(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return expr
  const [min, hour, dom, , dow] = parts

  if (min === '*' && hour === '*') return 'Every minute'
  if (min.startsWith('*/') && hour === '*') return `Every ${min.slice(2)} minutes`
  if (hour.startsWith('*/') && min === '0') return `Every ${hour.slice(2)} hours`

  const h = parseInt(hour, 10)
  const m = parseInt(min, 10)
  const timeStr = isNaN(h) ? `${hour}:${min}` : `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`

  if (dom === '*' && dow === '*') return `Daily at ${timeStr}`
  if (dom === '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayName = days[parseInt(dow, 10)]
    return `Weekly on ${dayName ?? dow} at ${timeStr}`
  }
  return expr
}

interface FormState {
  name: string
  schedule: string
  prompt: string
  model: string
  enabled: boolean
}

const EMPTY_FORM: FormState = { name: '', schedule: '0 9 * * *', prompt: '', model: '', enabled: true }

export default function CronsPanel() {
  const [crons, setCrons] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CronJob | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CronJob | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await listCrons()
    setLoading(false)
    if (error) { setError(error); return }
    setCrons(data?.crons ?? [])
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (c: CronJob) => {
    setEditing(c)
    setForm({ name: c.name, schedule: c.schedule, prompt: c.prompt, model: c.model ?? '', enabled: c.enabled })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.schedule.trim() || !form.prompt.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      schedule: form.schedule,
      prompt: form.prompt,
      model: form.model || undefined,
      enabled: form.enabled,
    }
    if (editing) {
      const { error } = await updateCron(editing.id, payload)
      if (!error) await load()
      else setError(error)
    } else {
      const { error } = await createCron(payload)
      if (!error) await load()
      else setError(error)
    }
    setSaving(false)
    setModalOpen(false)
  }

  const handleToggle = async (c: CronJob) => {
    const { error } = await updateCron(c.id, { enabled: !c.enabled })
    if (!error) setCrons(prev => prev.map(x => x.id === c.id ? { ...x, enabled: !x.enabled } : x))
    else setError(error)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await deleteCron(deleteTarget.id)
    if (!error) setCrons(prev => prev.filter(c => c.id !== deleteTarget.id))
    else setError(error)
    setDeleteTarget(null)
  }

  const handleRunNow = async (c: CronJob) => {
    setRunningId(c.id)
    await runCronNow(c.id)
    setRunningId(null)
    await load()
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
            Cron Jobs
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {crons.length} {crons.length === 1 ? 'job' : 'jobs'} · {crons.filter(c => c.enabled).length} active
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            New Job
          </button>
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
        ) : crons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No cron jobs yet</p>
            <button onClick={openCreate} className="text-xs" style={{ color: 'var(--accent)' }}>
              Create first job →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {crons.map(c => (
              <div
                key={c.id}
                className="group flex items-start gap-4 px-4 py-4 rounded-xl transition-colors hover:bg-white/5"
                style={{
                  border: `1px solid ${c.enabled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                  background: 'var(--bg-surface)',
                  opacity: c.enabled ? 1 : 0.65,
                }}
              >
                {/* Enable toggle */}
                <button
                  onClick={() => handleToggle(c)}
                  className="mt-0.5 flex-shrink-0 w-8 h-5 rounded-full relative transition-colors"
                  style={{ background: c.enabled ? 'var(--accent)' : 'var(--bg-overlay)' }}
                  title={c.enabled ? 'Disable' : 'Enable'}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: c.enabled ? 'calc(100% - 18px)' : '2px' }}
                  />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {c.name}
                    </span>
                    {c.lastResult === 'success' && (
                      <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                    )}
                    {c.lastResult === 'error' && (
                      <XCircle size={13} style={{ color: 'var(--error)' }} />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {humanSchedule(c.schedule)}
                      <span className="font-mono opacity-60">({c.schedule})</span>
                    </span>
                    {c.model && (
                      <span
                        className="px-1.5 py-0.5 rounded font-mono"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                      >
                        {c.model}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs line-clamp-1"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}
                  >
                    {c.prompt}
                  </p>
                  <div className="flex gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.lastRun && <span>Last run {relativeTime(c.lastRun)}</span>}
                    {c.nextRun && <span>· Next {relativeTime(c.nextRun)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleRunNow(c)}
                    disabled={runningId === c.id}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 disabled:opacity-30"
                    style={{ color: 'var(--success)' }}
                    title="Run now"
                  >
                    {runningId === c.id
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <Play size={13} />}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
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
            {editing ? 'Edit Cron Job' : 'New Cron Job'}
          </h2>
          <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Daily summary"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Schedule <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(cron)</span>
              </label>
              <input
                type="text"
                value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                placeholder="0 9 * * *"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
              {form.schedule && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>
                  {humanSchedule(form.schedule)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Model <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="hermes-agent"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Prompt
            </label>
            <textarea
              value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              rows={5}
              placeholder="Write a brief summary of today's tasks and priorities..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--mono)',
              }}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="accent-[var(--accent)]"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enabled</span>
          </label>
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
            disabled={saving || !form.name.trim() || !form.schedule.trim() || !form.prompt.trim()}
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
            Delete cron job?
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium">{deleteTarget?.name}</span> will be permanently deleted.
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
