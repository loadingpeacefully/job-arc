import { SEED_JOBS } from '../constants'

const KEYS = {
  JOBS: 'pmtracker_jobs',
  SETTINGS: 'pmtracker_settings',
  LAST_SCAN: 'pmtracker_last_scan',
}

export function loadJobs() {
  try {
    const raw = localStorage.getItem(KEYS.JOBS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return SEED_JOBS
}

export function saveJobs(jobs) {
  localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { apiKey: '', userName: '', targetRole: 'Senior Product Manager', minSalary: 40 }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

export function loadLastScan() {
  return localStorage.getItem(KEYS.LAST_SCAN) || null
}

export function saveLastScan(iso) {
  localStorage.setItem(KEYS.LAST_SCAN, iso)
}

export function exportData() {
  const jobs = loadJobs()
  const settings = loadSettings()
  const blob = new Blob([JSON.stringify({ jobs, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pm-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.jobs) saveJobs(data.jobs)
        if (data.settings) saveSettings(data.settings)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}
