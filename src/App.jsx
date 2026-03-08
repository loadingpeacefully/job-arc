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
  const [searchQ, setSearchQ] = useState('')
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
      setJobs(prev => {
        const incoming = [newJob({ company: job.company, role: job.title, location: job.location || '', jd_url: job.jobUrl || '', source: 'LinkedIn Extension', status: 'Saved' })]
        const { merged } = mergeJobs(prev, incoming)
        upsertManyJobs(incoming)
        return merged
      })
      setScanMsg({ type: 'success', text: `✅ "${job.title}" at ${job.company} added from LinkedIn.` })
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
      })
      setScanMsg({
        type: result.found ? 'success' : 'error',
        text: result.found
          ? `✓ Verified: ${job.company} role found on their careers site.`
          : `✗ No matching listing found for ${job.company} — ${job.role}.`,
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

  const filteredJobs = jobs.filter(j => {
    const matchStatus = filterStatus === 'All' || j.status === filterStatus
    const q = searchQ.toLowerCase()
    const matchSearch = !q ||
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (j.notes || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

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

      <div style={{ flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto', padding: '24px 24px 40px', display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'board' && (
            <BoardView
              jobs={filteredJobs}
              allJobs={jobs}
              selectedId={selectedId}
              onSelect={setSelectedId}
              filterStatus={filterStatus}
              onFilterStatus={setFilterStatus}
              searchQ={searchQ}
              onSearch={setSearchQ}
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
          <div className="animate-slide" style={{ width: 400, flexShrink: 0 }}>
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
          onExport={() => exportData(jobs, settings)}
          onImport={handleImport}
          onLinkedInPaste={handleLinkedInPaste}
        />
      )}
    </div>
  )
}
