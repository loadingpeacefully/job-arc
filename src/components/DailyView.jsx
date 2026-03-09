import { useState, useEffect, useCallback } from 'react'
import { getDaysAgo } from '../utils/jobUtils'

const DISCOVER_CACHE_KEY = 'job_arc_discovered'
const DISCOVER_TS_KEY    = 'job_arc_discover_last'
const CACHE_TTL_MS       = 12 * 60 * 60 * 1000 // 12 hours

const STYLES = `
  @keyframes section-in { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes row-in     { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes badge-pulse{ 0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 0 6px rgba(255,176,0,.12)} }
  @keyframes clear-in   { from{opacity:0;transform:scale(.96)}      to{opacity:1;transform:scale(1)} }
  @keyframes sq-pop     { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
  @keyframes disc-in    { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer    { from{background-position:-200% 0} to{background-position:200% 0} }

  .d-section { animation: section-in .22s ease both; }
  .d-row     { cursor:pointer; transition: transform .1s, box-shadow .1s; }
  .d-row:hover { transform: translateY(-1px); box-shadow: 0 3px 14px rgba(0,0,0,.5); }
  .d-badge   { animation: badge-pulse 2.2s ease-in-out infinite; }
  .d-clear   { animation: clear-in .3s cubic-bezier(.4,0,.2,1) both; }

  .disc-card { transition: transform .12s, box-shadow .12s; animation: disc-in .2s ease both; }
  .disc-card:hover { transform: translateY(-2px); box-shadow: 0 4px 18px rgba(0,0,0,.5); }
  .disc-skeleton {
    background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 0;
  }
`

function getGreeting(userName) {
  const h = new Date().getHours()
  const prefix = h < 12 ? 'good morning' : h < 17 ? 'good afternoon' : 'good evening'
  const first = (userName || '').trim().split(' ')[0] || 'operator'
  return `${prefix}, ${first.toLowerCase()}`
}

function computeStreak(jobs) {
  const bits = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    bits.push(jobs.some(j => j.lastUpdated === ds))
  }
  return bits
}

function fmtAge(isoTs) {
  if (!isoTs) return null
  const diff = Date.now() - new Date(isoTs).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Discovery Panel ────────────────────────────────────────────────────────
function DiscoveryPanel({ jobs, settings, onSaveDiscovered, discoverJobs: runDiscover }) {
  const [discovered, setDiscovered]   = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [lastScan, setLastScan]       = useState(() => localStorage.getItem(DISCOVER_TS_KEY))
  const [savedIds, setSavedIds]       = useState(() => new Set())

  // Track which discovered jd_urls are already in jobs
  const savedUrls = new Set(jobs.map(j => j.jd_url).filter(Boolean))

  const runScan = useCallback(async () => {
    if (!settings?.apiKey) {
      setError('Add your Anthropic API key in Settings to enable job discovery.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await runDiscover(settings.apiKey)
      setDiscovered(results)
      const ts = new Date().toISOString()
      setLastScan(ts)
      localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(results))
      localStorage.setItem(DISCOVER_TS_KEY, ts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [settings?.apiKey, runDiscover])

  // On mount: load cache or auto-scan
  useEffect(() => {
    const ts = localStorage.getItem(DISCOVER_TS_KEY)
    const age = ts ? Date.now() - new Date(ts).getTime() : Infinity
    if (age < CACHE_TTL_MS) {
      try {
        const cached = JSON.parse(localStorage.getItem(DISCOVER_CACHE_KEY) || '[]')
        if (cached.length > 0) { setDiscovered(cached); return }
      } catch {}
    }
    runScan()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = (job) => {
    onSaveDiscovered(job)
    setSavedIds(prev => new Set([...prev, job.id]))
  }

  const isSaved = (job) => savedIds.has(job.id) || savedUrls.has(job.jd_url)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel header */}
      <div style={{
        flexShrink: 0, paddingBottom: 12, marginBottom: 14,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, background: 'var(--amber)', flexShrink: 0 }} />
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              job discovery
            </span>
            {discovered.length > 0 && !loading && (
              <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>({discovered.length})</span>
            )}
          </div>
          {lastScan && !loading && (
            <div className="mono" style={{ fontSize: 8, color: 'var(--muted)', marginTop: 4, marginLeft: 11, letterSpacing: '0.06em' }}>
              scanned {fmtAge(lastScan)} · Bengaluru PM roles
            </div>
          )}
          {loading && (
            <div className="mono" style={{ fontSize: 8, color: 'var(--amber)', marginTop: 4, marginLeft: 11, letterSpacing: '0.08em' }}>
              scanning across all companies…
            </div>
          )}
        </div>
        <button
          onClick={runScan}
          disabled={loading}
          className="mono"
          style={{
            padding: '5px 12px', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid var(--border)',
            color: loading ? 'var(--muted)' : 'var(--amber)', cursor: loading ? 'default' : 'pointer',
            transition: 'border-color .12s, color .12s',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(255,176,0,.5)' }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {loading ? '⟳ scanning' : '↺ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 14, padding: '12px 14px', background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.25)' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--red)', marginBottom: 6 }}>{error}</div>
          <button onClick={runScan} className="mono" style={{ fontSize: 8, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Try again →
          </button>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && discovered.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="disc-skeleton" style={{ height: 96, border: '1px solid var(--border)', borderTop: '3px solid var(--border)' }} />
          ))}
        </div>
      )}

      {/* Cards */}
      {!loading && discovered.length === 0 && !error && (
        <div className="mono" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em' }}>
          no roles found — try refreshing
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {discovered.map((job, i) => {
          const saved = isSaved(job)
          return (
            <div
              key={job.id}
              className="disc-card"
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderTop: `3px solid ${saved ? 'var(--green)' : 'var(--amber)'}`,
                padding: '12px 13px',
                animation: `disc-in .2s ease ${i * 0.025}s both`,
              }}
            >
              {/* Top row: company + actions */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2, flex: 1 }}>
                  {job.company}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {job.jd_url && (
                    <button
                      onClick={() => window.open(job.jd_url, '_blank', 'noopener noreferrer')}
                      className="mono"
                      style={{
                        padding: '3px 9px', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--muted)', cursor: 'pointer', transition: 'color .1s, border-color .1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >View ↗</button>
                  )}
                  {saved ? (
                    <span className="mono" style={{
                      padding: '3px 9px', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                      background: 'rgba(57,255,20,.08)', color: 'var(--green)', border: '1px solid rgba(57,255,20,.3)',
                    }}>✓ Saved</span>
                  ) : (
                    <button
                      onClick={() => handleSave(job)}
                      className="mono"
                      style={{
                        padding: '3px 9px', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                        background: 'rgba(255,176,0,.08)', border: '1px solid rgba(255,176,0,.35)',
                        color: 'var(--amber)', cursor: 'pointer', transition: 'background .1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,176,0,.16)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,176,0,.08)' }}
                    >+ Save</button>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.role}
              </div>

              {/* Meta row: salary · source · date */}
              <div className="mono" style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {job.salary_band && (
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{job.salary_band}</span>
                )}
                {job.source && <span>{job.source}</span>}
                {job.posted_date && <span>{new Date(job.posted_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>

              {/* Tags */}
              {job.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {job.tags.map(tag => (
                    <span key={tag} className="mono" style={{
                      fontSize: 7, padding: '2px 6px',
                      background: 'var(--surface2)', color: 'var(--muted)',
                      border: '1px solid var(--border)', letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DailyView({ jobs, onVerify, verifyingId, onSelect, settings, onSaveDiscovered, discoverJobs }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Action lists ────────────────────────────────────────────────────────
  const upcomingInterviews = jobs.flatMap(j =>
    (j.interviewRounds || [])
      .filter(r => {
        if (r.outcome !== 'Pending' || !r.date) return false
        const daysUntil = -getDaysAgo(r.date)
        return daysUntil >= 0 && daysUntil <= 7
      })
      .map(r => ({ job: j, round: r, daysUntil: Math.round(-getDaysAgo(r.date)) }))
  ).sort((a, b) => a.daysUntil - b.daysUntil)

  const followUpDue = jobs.filter(j =>
    j.status === 'Applied' && getDaysAgo(j.appliedDate) > 7 && !(j.interviewRounds?.length)
  )

  const outreachQueue = jobs.flatMap(j =>
    (j.contacts || []).filter(c => c.status === 'Not reached').map(c => ({ job: j, contact: c }))
  )

  const staleJobs = jobs.filter(j =>
    ['Applied', 'Interview'].includes(j.status) && getDaysAgo(j.lastUpdated) > 14
  )

  const missingResume = jobs.filter(j =>
    j.status === 'Applied' && !(j.resumeVersions?.length)
  )

  const verifyQueue = jobs.filter(j =>
    ['LinkedIn Scraper', 'Live Scan', 'LinkedIn', 'LinkedIn Extension'].includes(j.source) && j.verified === null
  )

  const totalActions =
    upcomingInterviews.length + followUpDue.length + outreachQueue.length +
    staleJobs.length + missingResume.length + verifyQueue.length

  const streak = computeStreak(jobs)
  const streakCount = streak.filter(Boolean).length

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 112px)', overflow: 'hidden' }}>
      <style>{STYLES}</style>

      {/* ── LEFT: Action HQ ──────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 52%', overflowY: 'auto', paddingRight: 24, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '0.12em', marginBottom: 6 }}>
            // {today.toLowerCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
              {getGreeting(settings?.userName)}
            </div>
            {totalActions > 0 && (
              <span className="mono d-badge" style={{
                fontSize: 9, fontWeight: 700, padding: '4px 10px',
                background: 'rgba(255,176,0,.1)', color: 'var(--amber)',
                border: '1px solid rgba(255,176,0,.35)', letterSpacing: '0.1em',
              }}>
                {totalActions} action{totalActions !== 1 ? 's' : ''} today
              </span>
            )}
          </div>
        </div>

        {/* Streak bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {streak.map((active, i) => (
              <div key={i} style={{
                width: 14, height: 14,
                background: active ? 'var(--amber)' : 'var(--surface2)',
                border: `1px solid ${active ? 'rgba(255,176,0,.5)' : 'var(--border)'}`,
                animation: active ? `sq-pop .3s ease ${i * 0.05}s both` : 'none',
              }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            {streakCount} / 7 days active this week
          </span>
        </div>

        {/* All-clear */}
        {totalActions === 0 && (
          <div className="d-clear" style={{
            padding: '48px 32px', textAlign: 'center',
            border: '1px dashed var(--border)', background: 'var(--surface)', marginBottom: 28,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>All clear</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em' }}>no pending actions — check your discovery feed →</div>
          </div>
        )}

        {/* Sections */}
        {upcomingInterviews.length > 0 && (
          <Section title="upcoming_interviews" count={upcomingInterviews.length} color="var(--blue)" delay={0}>
            {upcomingInterviews.map(({ job, round, daysUntil }, i) => (
              <InterviewRow key={`${job.id}-${round.id}`} job={job} round={round} daysUntil={daysUntil} onSelect={onSelect} delay={i * 0.03} />
            ))}
          </Section>
        )}
        {followUpDue.length > 0 && (
          <Section title="follow_up_due" count={followUpDue.length} color="var(--amber)" delay={0.07}>
            {followUpDue.map((job, i) => (
              <FollowUpRow key={job.id} job={job} onSelect={onSelect} delay={i * 0.03} />
            ))}
          </Section>
        )}
        {outreachQueue.length > 0 && (
          <Section title="contact_outreach" count={outreachQueue.length} color="var(--amber)" delay={0.14}>
            {outreachQueue.map(({ job, contact }, i) => (
              <OutreachRow key={`${job.id}-${contact.name}`} job={job} contact={contact} onSelect={onSelect} delay={i * 0.03} />
            ))}
          </Section>
        )}
        {staleJobs.length > 0 && (
          <Section title="stale_applications" count={staleJobs.length} color="var(--red)" delay={0.21}>
            {staleJobs.map((job, i) => (
              <ActionRow key={job.id} job={job} onSelect={onSelect} delay={i * 0.03} accent="var(--red)"
                right={<Badge color="var(--red)">{Math.round(getDaysAgo(job.lastUpdated))}d stale</Badge>}
              />
            ))}
          </Section>
        )}
        {missingResume.length > 0 && (
          <Section title="missing_resume" count={missingResume.length} color="var(--purple)" delay={0.28}>
            {missingResume.map((job, i) => (
              <ActionRow key={job.id} job={job} onSelect={onSelect} delay={i * 0.03} accent="var(--purple)"
                right={<Badge color="var(--purple)">no resume</Badge>}
              />
            ))}
          </Section>
        )}
        {verifyQueue.length > 0 && (
          <Section title="verify_queue" count={verifyQueue.length} color="var(--green)" delay={0.35}>
            {verifyQueue.map((job, i) => (
              <VerifyRow key={job.id} job={job} onVerify={onVerify} verifying={verifyingId === job.id} onSelect={onSelect} delay={i * 0.03} />
            ))}
          </Section>
        )}
      </div>

      {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
      <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '0 24px' }} />

      {/* ── RIGHT: Discovery Panel ───────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <DiscoveryPanel
          jobs={jobs}
          settings={settings}
          onSaveDiscovered={onSaveDiscovered}
          discoverJobs={discoverJobs}
        />
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, count, color, delay, children }) {
  return (
    <div className="d-section" style={{ marginBottom: 28, animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 3, height: 14, background: color, flexShrink: 0 }} />
        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{title}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>({count})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

// ── Shared row primitives ──────────────────────────────────────────────────
function RowBase({ accent, delay, onClick, right, children }) {
  return (
    <div className="d-row" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent}`,
      animation: `row-in .15s ease ${delay}s both`,
    }}>
      {children}
      {right && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  )
}

function JobLabel({ job }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 8 }}>{job.company}</span>
      <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.role}</span>
    </div>
  )
}

function Badge({ color, children }) {
  return (
    <span className="mono" style={{
      fontSize: 8, fontWeight: 700, padding: '2px 7px',
      background: `${color}15`, color, border: `1px solid ${color}40`,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{children}</span>
  )
}

// ── Row sub-components ─────────────────────────────────────────────────────
function InterviewRow({ job, round, daysUntil, onSelect, delay }) {
  return (
    <RowBase accent="var(--blue)" delay={delay} onClick={() => onSelect(job.id)}
      right={<>
        <Badge color="var(--blue)">{round.type || 'interview'}</Badge>
        <span className="mono" style={{ fontSize: 9, color: 'var(--green)' }}>
          {daysUntil === 0 ? 'today' : `in ${daysUntil}d`}
        </span>
      </>}
    ><JobLabel job={job} /></RowBase>
  )
}

function FollowUpRow({ job, onSelect, delay }) {
  const daysAgo = Math.round(getDaysAgo(job.appliedDate))
  return (
    <RowBase accent="var(--amber)" delay={delay} onClick={() => onSelect(job.id)}
      right={<>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>applied {daysAgo}d ago</span>
        <Badge color="var(--amber)">→ follow up</Badge>
      </>}
    ><JobLabel job={job} /></RowBase>
  )
}

function OutreachRow({ job, contact, onSelect, delay }) {
  return (
    <RowBase accent="var(--amber)" delay={delay} onClick={() => onSelect(job.id)}
      right={<>
        {contact.linkedinUrl && (
          <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} className="mono"
            style={{ fontSize: 9, color: 'var(--blue)', textDecoration: 'none', padding: '2px 6px', border: '1px solid rgba(88,166,255,.3)' }}
          >LinkedIn ↗</a>
        )}
        <Badge color="var(--amber)">not reached</Badge>
      </>}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginRight: 8 }}>{contact.name}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{contact.title || contact.role} · {job.company}</span>
      </div>
    </RowBase>
  )
}

function ActionRow({ job, onSelect, accent, right, delay }) {
  return (
    <RowBase accent={accent} delay={delay} onClick={() => onSelect(job.id)} right={right}>
      <JobLabel job={job} />
    </RowBase>
  )
}

function VerifyRow({ job, onVerify, verifying, onSelect, delay }) {
  return (
    <RowBase accent="var(--green)" delay={delay} onClick={() => onSelect(job.id)}
      right={
        <button onClick={e => { e.stopPropagation(); onVerify(job.id) }} disabled={verifying} className="mono"
          style={{
            padding: '4px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid rgba(57,255,20,.35)',
            color: verifying ? 'var(--muted)' : 'var(--green)', cursor: verifying ? 'default' : 'pointer',
          }}
        >{verifying ? '…verifying' : 'Verify ↗'}</button>
      }
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <JobLabel job={job} />
        <span className="mono" style={{ fontSize: 8, color: 'var(--muted)', marginTop: 2, display: 'block' }}>{job.source}</span>
      </div>
    </RowBase>
  )
}
