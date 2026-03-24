/**
 * Hermes Admin Server
 * Exposes REST endpoints by reading/writing ~/.hermes/ files directly.
 * Run with: node server/admin.mjs
 * Listens on port 8644 (override with ADMIN_PORT env var)
 */

import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { parse as parseUrl } from 'node:url'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'

const HERMES = join(homedir(), '.hermes')
const PORT   = parseInt(process.env.ADMIN_PORT ?? '8644', 10)

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

async function writeJson(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

async function readBody(req) {
  return new Promise(resolve => {
    let data = ''
    req.on('data', c => { data += c })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

function send(res, status, body) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

function err(res, status, message) {
  send(res, status, { error: { message } })
}

// ── Memory ────────────────────────────────────────────────────────────────────
// Files: ~/.hermes/memories/MEMORY.md  (agent notes)
//        ~/.hermes/memories/USER.md    (user profile)
// Format: plain text, entries separated by §

async function parseMemFile(name) {
  const path = join(HERMES, 'memories', name)
  try {
    const text = await readFile(path, 'utf-8')
    return text.split('§').map(s => s.trim()).filter(Boolean)
  } catch { return [] }
}

async function writeMemFile(name, entries) {
  const path = join(HERMES, 'memories', name)
  await writeFile(path, entries.join('\n§\n'), 'utf-8')
}

async function getMemory(_req, res) {
  const memEntries  = await parseMemFile('MEMORY.md')
  const userEntries = await parseMemFile('USER.md')
  send(res, 200, {
    memories: [
      ...memEntries .map((content, i) => ({ id: `memory-${i}`, content, file: 'memory' })),
      ...userEntries.map((content, i) => ({ id: `user-${i}`,   content, file: 'user'   })),
    ],
  })
}

async function createMemory(req, res) {
  const { content, file = 'memory' } = await readBody(req)
  if (!content?.trim()) return err(res, 400, 'content is required')
  const name    = file === 'user' ? 'USER.md' : 'MEMORY.md'
  const entries = await parseMemFile(name)
  entries.push(content.trim())
  await writeMemFile(name, entries)
  send(res, 201, { memory: { id: `${file}-${entries.length - 1}`, content: content.trim(), file } })
}

async function updateMemory(req, res, id) {
  const { content } = await readBody(req)
  if (!content?.trim()) return err(res, 400, 'content is required')
  const [fileKey, idxStr] = id.split('-')
  const idx  = parseInt(idxStr, 10)
  const name = fileKey === 'user' ? 'USER.md' : 'MEMORY.md'
  const entries = await parseMemFile(name)
  if (idx < 0 || idx >= entries.length) return err(res, 404, 'Entry not found')
  entries[idx] = content.trim()
  await writeMemFile(name, entries)
  send(res, 200, { memory: { id, content: content.trim(), file: fileKey } })
}

async function deleteMemory(req, res, id) {
  const [fileKey, idxStr] = id.split('-')
  const idx  = parseInt(idxStr, 10)
  const name = fileKey === 'user' ? 'USER.md' : 'MEMORY.md'
  const entries = await parseMemFile(name)
  if (idx < 0 || idx >= entries.length) return err(res, 404, 'Entry not found')
  entries.splice(idx, 1)
  await writeMemFile(name, entries)
  res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
  res.end()
}

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
// File: ~/.hermes/cron/jobs.json  { jobs: [...] }

const CRONS_FILE = join(HERMES, 'cron', 'jobs.json')

async function readCrons() {
  const data = await readJson(CRONS_FILE, { jobs: [] })
  return data.jobs ?? []
}

async function writeCrons(jobs) {
  await writeJson(CRONS_FILE, { jobs })
}

async function getCrons(_req, res) {
  send(res, 200, { crons: await readCrons() })
}

async function createCron(req, res) {
  const body = await readBody(req)
  const { name, schedule, prompt, model, enabled = true, skills = [], deliver } = body
  if (!name || !schedule || !prompt) return err(res, 400, 'name, schedule, and prompt are required')
  const jobs = await readCrons()
  const id = Math.random().toString(36).slice(2, 14)
  const now = new Date().toISOString()
  const job = {
    id,
    name,
    prompt,
    skills,
    model: model || null,
    provider: null,
    base_url: null,
    schedule: typeof schedule === 'string'
      ? { kind: 'cron', expr: schedule, display: schedule }
      : schedule,
    schedule_display: typeof schedule === 'string' ? schedule : schedule.expr,
    repeat: { times: null, completed: 0 },
    enabled,
    state: enabled ? 'scheduled' : 'paused',
    paused_at: null,
    paused_reason: null,
    created_at: now,
    next_run_at: null,
    last_run_at: null,
    last_status: null,
    last_error: null,
    deliver: deliver || null,
    origin: null,
  }
  jobs.push(job)
  await writeCrons(jobs)
  send(res, 201, { cron: job })
}

async function updateCron(req, res, id) {
  const body = await readBody(req)
  const jobs = await readCrons()
  const idx  = jobs.findIndex(j => j.id === id)
  if (idx === -1) return err(res, 404, 'Cron job not found')

  // Handle enabled/pause toggle
  if ('enabled' in body && body.enabled !== jobs[idx].enabled) {
    body.state = body.enabled ? 'scheduled' : 'paused'
    if (!body.enabled) body.paused_at = new Date().toISOString()
    else               body.paused_at = null
  }

  // Normalize schedule string → object
  if (typeof body.schedule === 'string') {
    body.schedule = { kind: 'cron', expr: body.schedule, display: body.schedule }
    body.schedule_display = body.schedule.expr
  }

  jobs[idx] = { ...jobs[idx], ...body }
  await writeCrons(jobs)
  send(res, 200, { cron: jobs[idx] })
}

async function deleteCron(_req, res, id) {
  const jobs = await readCrons()
  const filtered = jobs.filter(j => j.id !== id)
  if (filtered.length === jobs.length) return err(res, 404, 'Cron job not found')
  await writeCrons(filtered)
  res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
  res.end()
}

async function runCron(_req, res, id) {
  const result = spawnSync('hermes', ['cron', 'run', id], {
    encoding: 'utf-8',
    timeout: 10_000,
  })
  if (result.error) {
    // Fall back: just mark last_run_at
    const jobs = await readCrons()
    const idx  = jobs.findIndex(j => j.id === id)
    if (idx !== -1) {
      jobs[idx].last_run_at = new Date().toISOString()
      await writeCrons(jobs)
    }
  }
  send(res, 200, { ok: true })
}

// ── Sessions ──────────────────────────────────────────────────────────────────
// File: ~/.hermes/sessions/sessions.json
// Format: object keyed by session_key

async function getSessions(_req, res) {
  const raw = await readJson(join(HERMES, 'sessions', 'sessions.json'), {})
  const now = Date.now()

  const sessions = Object.values(raw).map(s => {
    const updatedMs = new Date(s.updated_at).getTime()
    const ageMin    = (now - updatedMs) / 60_000
    const status    = ageMin < 5 ? 'active' : ageMin < 120 ? 'idle' : 'completed'

    // Determine type from session_id pattern
    const type = s.session_id?.includes('cron') ? 'cron' : 'chat'

    return {
      id:              s.session_id,
      type,
      title:           s.display_name ?? s.session_key,
      status,
      platform:        s.platform,
      chatType:        s.chat_type,
      model:           s.model ?? null,
      createdAt:       s.created_at,
      updatedAt:       s.updated_at,
      totalTokens:     s.total_tokens ?? 0,
      estimatedCostUsd: s.estimated_cost_usd ?? 0,
      sessionKey:      s.session_key,
    }
  })

  // Sort newest-updated first
  sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  send(res, 200, { sessions })
}

// ── Config ────────────────────────────────────────────────────────────────────

async function getConfig(_req, res) {
  try {
    const text = await readFile(join(HERMES, 'config.yaml'), 'utf-8')
    send(res, 200, { config: text })
  } catch (e) {
    err(res, 500, e.message)
  }
}

async function updateConfig(req, res) {
  const { config } = await readBody(req)
  if (typeof config !== 'string') return err(res, 400, 'config must be a YAML string')
  try {
    await writeFile(join(HERMES, 'config.yaml'), config, 'utf-8')
    send(res, 200, { ok: true })
  } catch (e) {
    err(res, 500, e.message)
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

const ROUTES = [
  { method: 'GET',    re: /^\/v1\/memory$/,            handler: getMemory    },
  { method: 'POST',   re: /^\/v1\/memory$/,            handler: createMemory },
  { method: 'PUT',    re: /^\/v1\/memory\/(.+)$/,      handler: (q,r,m) => updateMemory(q,r,m[1]) },
  { method: 'DELETE', re: /^\/v1\/memory\/(.+)$/,      handler: (q,r,m) => deleteMemory(q,r,m[1]) },

  { method: 'GET',    re: /^\/v1\/crons$/,             handler: getCrons     },
  { method: 'POST',   re: /^\/v1\/crons$/,             handler: createCron   },
  { method: 'POST',   re: /^\/v1\/crons\/(.+)\/run$/,  handler: (q,r,m) => runCron(q,r,m[1])    },
  { method: 'PUT',    re: /^\/v1\/crons\/(.+)$/,       handler: (q,r,m) => updateCron(q,r,m[1]) },
  { method: 'DELETE', re: /^\/v1\/crons\/(.+)$/,       handler: (q,r,m) => deleteCron(q,r,m[1]) },

  { method: 'GET',    re: /^\/v1\/sessions$/,          handler: getSessions  },

  { method: 'GET',    re: /^\/v1\/config$/,            handler: getConfig    },
  { method: 'PUT',    re: /^\/v1\/config$/,            handler: updateConfig },

  { method: 'GET',    re: /^\/health$/,                handler: (_q,r) => send(r,200,{status:'ok'}) },
]

// ── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const { pathname } = parseUrl(req.url ?? '/')

  for (const { method, re, handler } of ROUTES) {
    if (req.method !== method) continue
    const match = pathname.match(re)
    if (!match) continue
    try {
      await handler(req, res, match)
    } catch (e) {
      console.error(e)
      err(res, 500, e.message ?? 'Internal server error')
    }
    return
  }

  err(res, 404, `No route for ${req.method} ${pathname}`)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Hermes admin server running at http://127.0.0.1:${PORT}`)
  console.log(`Hermes data directory: ${HERMES}`)
})
