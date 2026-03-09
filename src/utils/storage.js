import { supabase } from './supabase'
import { SEED_JOBS } from '../constants'

// ── JOBS ──────────────────────────────────────────────────────────────────────

export async function loadJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('data')
    .order('updated_at', { ascending: false })
  if (error || !data?.length) return SEED_JOBS
  return data.map(row => row.data)
}

export async function upsertJob(job) {
  await supabase.from('jobs').upsert({
    id: job.id,
    data: job,
    updated_at: new Date().toISOString(),
  })
}

export async function deleteJobDB(id) {
  await supabase.from('jobs').delete().eq('id', id)
}

export async function upsertManyJobs(jobs) {
  if (!jobs.length) return
  const rows = jobs.map(j => ({ id: j.id, data: j, updated_at: new Date().toISOString() }))
  await supabase.from('jobs').upsert(rows)
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = { apiKey: '', userName: '', bio: '', linkedinUrl: '', githubUrl: '', profileImage: '' }
const API_KEY_STORAGE_KEY = 'jobarc_api_key'

export async function loadSettings() {
  const { data } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'singleton')
    .single()
  const remote = data?.data ?? DEFAULT_SETTINGS
  // apiKey lives in localStorage only — never synced to Supabase
  return { ...remote, apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || '' }
}

export async function saveSettings(settings) {
  // Save apiKey locally, everything else to Supabase
  if (settings.apiKey !== undefined) {
    localStorage.setItem(API_KEY_STORAGE_KEY, settings.apiKey)
  }
  const { apiKey: _drop, ...remoteSettings } = settings
  await supabase.from('settings').upsert({
    id: 'singleton',
    data: remoteSettings,
    updated_at: new Date().toISOString(),
  })
}

// ── LAST SCAN (kept in localStorage — trivial) ────────────────────────────────

export function loadLastScan() {
  return localStorage.getItem('jobarc_last_scan') || null
}

export function saveLastScan(iso) {
  localStorage.setItem('jobarc_last_scan', iso)
}

// ── EXPORT / IMPORT ───────────────────────────────────────────────────────────

export function exportData(jobs, settings) {
  const blob = new Blob(
    [JSON.stringify({ jobs, settings, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `job-arc-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.jobs) await upsertManyJobs(data.jobs)
        if (data.settings) await saveSettings(data.settings)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}
