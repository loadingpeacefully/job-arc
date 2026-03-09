import { useState, useCallback, useEffect } from 'react'
import { loadJobs, upsertJob, deleteJobDB, upsertManyJobs, loadSettings, saveSettings, loadLastScan, saveLastScan, exportData, importData } from './utils/storage'
import { runLiveScan, mergeJobs, verifyJob } from './utils/claudeApi'
import { newJob } from './utils/jobUtils'
import Header from './components/Header'
import BoardView from './components/BoardView'
import PipelineView from './components/PipelineView'
import AnalyticsView from './components/AnalyticsView'
import DailyView from './components/DailyView'
import DetailPanel from './components/DetailPanel'
import AddJobModal from './components/AddJobModal'
import SettingsModal from './components/SettingsModal'
import ScanBanner from './components/ScanBanner'

const DEFAULT_SETTINGS = { apiKey: '', userName: '', targetRole: 'Senior Product Manager', minSalary: 40 }

export default function App({ onLogout }) {
  const [jobs, setJobs] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('board')
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState(null)
  const [lastScan, setLastScan] = useState(() => loadLastScan())
  const [verifyingId, setVerifyingId] = useState(null)

  // Load data from Supabase on mount
  useEffect(() => {
    Promise.all([loadJobs(), loadSettings()]).then(([j, s]) => {
      setJobs(j)
      setSettings(s)
      setLoading(false)
    })
  }, [])

  // Chrome extension bridge
  useEffect(() => {
    function handler(e) {
      const job = e.detail || (() => {
        try { return JSON.parse(localStorage.getItem('job_arc_incoming') || 'null') } catch { return null }
      })()
      if (!job || !job.title || !job.company) return
      localStorage.removeItem('job_arc_incoming')
      // Store full JD as key requirements (one line per entry, no truncation)
      const keyRequirements = job.description
        ? job.description.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        : []
      // Parse posted date from "2 days ago" etc.
      let posted_date = new Date().toISOString().slice(0, 10)
      if (job.postedDate) {
        const m = job.postedDate.match(/(\d+)\s*(day|week|month)/i)
        if (m) {
          const d = new Date(); const n = parseInt(m[1])
          if (m[2].startsWith('day')) d.setDate(d.getDate() - n)
          else if (m[2].startsWith('week')) d.setDate(d.getDate() - n * 7)
          else if (m[2].startsWith('month')) d.setMonth(d.getMonth() - n)
          posted_date = d.toISOString().slice(0, 10)
        }
      }
      const jdUrl = job.applyLink || job.jobUrl || ''
      const freshData = {
        tags: job.skills || [],
        keyRequirements,
        notes: job.insights && job.insights.length ? job.insights.join(' · ') : '',
        location: job.location || '',
        posted_date,
        lastUpdated: new Date().toISOString().slice(0, 10),
      }
      let isUpdate = false
      setJobs(prev => {
        const existingIdx = prev.findIndex(j => j.jd_url === jdUrl)
        if (existingIdx !== -1) {
          isUpdate = true
          const updated = prev.map((j, i) => {
            if (i !== existingIdx) return j
            const refreshed = { ...j, ...freshData }
            upsertJob(refreshed)
            return refreshed
          })
          return updated
        }
        const incoming = [newJob({
          company: job.company,
          role: job.title,
          jd_url: jdUrl,
          source: 'LinkedIn Extension',
          status: 'Saved',
          ...freshData,
        })]
        upsertManyJobs(incoming)
        const { merged } = mergeJobs(prev, incoming)
        return merged
      })
      setScanMsg({ type: 'success', text: isUpdate
        ? `✅ "${job.title}" at ${job.company} refreshed with latest JD.`
        : `✅ "${job.title}" at ${job.company} added from LinkedIn.`
      })
    }
    window.addEventListener('job_arc_job', handler)
    return () => window.removeEventListener('job_arc_job', handler)
  }, [])

  const selectedJob = jobs.find(j => j.id === selectedId) || null

  const updateJob = useCallback((id, updates) => {
    setJobs(prev => {
      const updated = prev.map(j => {
        if (j.id !== id) return j
        const newJ = { ...j, ...updates, lastUpdated: new Date().toISOString().slice(0, 10) }
        upsertJob(newJ)
        return newJ
      })
      return updated
    })
  }, [])

  const deleteJob = useCallback((id) => {
    deleteJobDB(id)
    setJobs(prev => prev.filter(j => j.id !== id))
    setSelectedId(null)
  }, [])

  const addJob = useCallback((jobData) => {
    const job = newJob(jobData)
    upsertJob(job)
    setJobs(prev => [job, ...prev])
    setSelectedId(job.id)
    setShowAdd(false)
  }, [])

  const handleSaveSettings = useCallback(async (s) => {
    await saveSettings(s)
    setSettings(s)
    setShowSettings(false)
  }, [])

  const handleScan = useCallback(async () => {
    if (!settings.apiKey) {
      setScanMsg({ type: 'error', text: 'Add your Anthropic API key in Settings first.' })
      return
    }
    setScanning(true)
    setScanMsg({ type: 'info', text: 'Scanning for new PM roles in Bengaluru…' })
    try {
      const incoming = await runLiveScan(settings.apiKey)
      const { merged, added } = mergeJobs(jobs, incoming)
      await upsertManyJobs(incoming)
      setJobs(merged)
      const now = new Date().toISOString()
      saveLastScan(now)
      setLastScan(now)
      setScanMsg({ type: 'success', text: `✅ Scan complete — ${added} new role${added !== 1 ? 's' : ''} added (${incoming.length} found total).` })
    } catch (err) {
      setScanMsg({ type: 'error', text: `Scan failed: ${err.message}` })
    } finally {
      setScanning(false)
    }
  }, [settings.apiKey, jobs])

  const handleVerify = useCallback(async (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    if (!settings.apiKey) {
      setScanMsg({ type: 'error', text: 'Add your Anthropic API key in Settings first.' })
      return
    }
    setVerifyingId(jobId)
    setScanMsg({ type: 'info', text: `Verifying "${job.company} — ${job.role}"…` })
    try {
      const result = await verifyJob(settings.apiKey, job)
      updateJob(jobId, {
        verified: result.found,
        canonicalUrl: result.canonicalUrl || '',
        verifiedAt: new Date().toISOString().slice(0, 10),
        salary_verified: result.salary_verified || '',
        salary_source: result.salary_source || '',
        salary_confirmed: result.salary_confirmed || false,
        // Always update salary_band from verified data (range; exact only if 90%+ confident)
        ...(result.salary_verified ? { salary_band: result.salary_verified } : {}),
      })
      const salaryNote = result.salary_verified ? ` · Salary: ${result.salary_verified} (${result.salary_source})` : ''
      setScanMsg({
        type: result.found ? 'success' : 'error',
        text: result.found
          ? `✓ Verified: ${job.company} role found on their careers site.${salaryNote}`
          : `✗ No matching listing found for ${job.company} — ${job.role}.${salaryNote}`,
      })
    } catch (err) {
      setScanMsg({ type: 'error', text: `Verify failed: ${err.message}` })
    } finally {
      setVerifyingId(null)
    }
  }, [jobs, settings.apiKey, updateJob])

  const handleLinkedInPaste = useCallback((parsed) => {
    const { merged, added } = mergeJobs(jobs, parsed)
    upsertManyJobs(parsed)
    setJobs(merged)
    setScanMsg({ type: 'success', text: `${added} new role${added !== 1 ? 's' : ''} imported from LinkedIn (${parsed.length} found).` })
    setShowSettings(false)
  }, [jobs])

  const handleImport = useCallback(async (file) => {
    try {
      const data = await importData(file)
      if (data.jobs) setJobs(data.jobs)
      if (data.settings) setSettings(data.settings)
      setScanMsg({ type: 'success', text: `Imported ${data.jobs?.length || 0} roles.` })
    } catch {
      setScanMsg({ type: 'error', text: 'Import failed — check file format.' })
    }
  }, [])

  const filteredJobs = jobs.filter(j =>
    filterStatus === 'All' || j.status === filterStatus
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.1em' }}>Loading…</span>
      </div>
    )
  }

  return (
    <div className="grid-bg" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="scanline" />
      <Header
        tab={tab} setTab={setTab}
        onAdd={() => setShowAdd(true)}
        onSettings={() => setShowSettings(true)}
        onScan={handleScan}
        scanning={scanning}
        lastScan={lastScan}
        jobCount={jobs.length}
        onLogout={onLogout}
      />

      {scanMsg && (
        <ScanBanner msg={scanMsg} onClose={() => setScanMsg(null)} />
      )}

      <div style={{ flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto', padding: '20px 24px 40px', display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'board' && (
            <BoardView
              jobs={filteredJobs}
              allJobs={jobs}
              selectedId={selectedId}
              onSelect={setSelectedId}
              filterStatus={filterStatus}
              onFilterStatus={setFilterStatus}
              onAdd={() => setShowAdd(true)}
            />
          )}
          {tab === 'pipeline' && (
            <PipelineView
              jobs={jobs}
              onSelect={(id) => { setSelectedId(id); setTab('board') }}
              onStatusChange={(id, status) => updateJob(id, { status })}
            />
          )}
          {tab === 'analytics' && (
            <AnalyticsView jobs={jobs} />
          )}
          {tab === 'daily' && (
            <DailyView
              jobs={jobs}
              onVerify={handleVerify}
              verifyingId={verifyingId}
              onSelect={(id) => { setSelectedId(id); setTab('board') }}
            />
          )}
        </div>

        {selectedJob && tab === 'board' && (
          <div className="animate-slide" style={{ width: 460, flexShrink: 0 }}>
            <DetailPanel
              job={selectedJob}
              onUpdate={(u) => updateJob(selectedJob.id, u)}
              onDelete={() => deleteJob(selectedJob.id)}
              onClose={() => setSelectedId(null)}
              onVerify={handleVerify}
              verifying={verifyingId === selectedJob.id}
            />
          </div>
        )}
      </div>

      {showAdd && <AddJobModal onAdd={addJob} onClose={() => setShowAdd(false)} />}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
