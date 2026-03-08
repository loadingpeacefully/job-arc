import { getDaysAgo, getResponseRate } from '../utils/jobUtils'
import { STATUS } from '../constants'

export default function DailyView({ jobs, onVerify, verifyingId, onSelect }) {
  const today = new Date().toISOString().slice(0, 10)

  // New roles added today or in last 24h
  const newToday = jobs.filter(j => {
    const age = getDaysAgo(j.lastUpdated)
    return age !== null && age <= 1
  })

  // Jobs needing verification: from LinkedIn Scraper or Live Scan and not yet verified
  const verifyQueue = jobs.filter(j =>
    (j.source === 'LinkedIn Scraper' || j.source === 'Live Scan' || j.source === 'LinkedIn') &&
    j.verified === null
  )

  // Active jobs (not Rejected/Withdrawn)
  const active = jobs.filter(j => !['Rejected', 'Withdrawn'].includes(j.status))
  const interviewsThisWeek = jobs.filter(j => {
    if (j.status !== 'Interview') return false
    return (j.interviewRounds || []).some(r => {
      const age = getDaysAgo(r.date)
      return age !== null && age <= 7
    })
  })
  const stale = jobs.filter(j => {
    const age = getDaysAgo(j.lastUpdated)
    return !['Offer', 'Rejected', 'Withdrawn'].includes(j.status) && age !== null && age > 14
  })

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Date header */}
      <div style={{ marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          // today_intel
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.1em' }}>
          {today}
        </div>
      </div>

      {/* Pipeline Pulse */}
      <Section title="pipeline_pulse">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PulseStat label="Active" value={active.length} color="var(--amber)" />
          <PulseStat label="Interviews this week" value={interviewsThisWeek.length} color="var(--blue)" />
          <PulseStat label="Stale (14d+)" value={stale.length} color={stale.length > 0 ? 'var(--red)' : 'var(--muted)'} />
          <PulseStat label="Response rate" value={`${getResponseRate(jobs)}%`} color="var(--green)" />
          <PulseStat label="Verify queue" value={verifyQueue.length} color={verifyQueue.length > 0 ? 'var(--purple)' : 'var(--muted)'} />
        </div>
      </Section>

      {/* New Roles Today */}
      <Section title="new_roles_today" count={newToday.length}>
        {newToday.length === 0 ? (
          <Empty>no new roles in the last 24h — run a live scan or import from linkedin</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {newToday.map(job => (
              <NewRoleRow key={job.id} job={job} onSelect={onSelect} />
            ))}
          </div>
        )}
      </Section>

      {/* Verify Queue */}
      <Section title="verify_queue" count={verifyQueue.length}>
        {verifyQueue.length === 0 ? (
          <Empty>all imported roles have been verified — run a live scan or import from linkedin to add more</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {verifyQueue.map(job => (
              <VerifyRow
                key={job.id}
                job={job}
                onVerify={onVerify}
                verifying={verifyingId === job.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>// {title}</span>
        {count !== undefined && (
          <span className="mono" style={{ fontSize: 9, color: count > 0 ? 'var(--amber)' : 'var(--muted)', letterSpacing: '0.06em' }}>({count})</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Empty({ children }) {
  return (
    <div className="mono" style={{ padding: '18px', border: '1px dashed var(--border)', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'lowercase' }}>
      {children}
    </div>
  )
}

function PulseStat({ label, value, color }) {
  return (
    <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 120 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}

function NewRoleRow({ job, onSelect }) {
  const statusCfg = STATUS[job.status]
  return (
    <div
      onClick={() => onSelect(job.id)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif', marginRight: 8 }}>{job.company}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{job.role}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>{job.source}</span>
        <span className="mono" style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px',
          background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>{job.status}</span>
      </div>
    </div>
  )
}

function VerifyRow({ job, onVerify, verifying, onSelect }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
    }}>
      <div
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        onClick={() => onSelect(job.id)}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif', marginRight: 8 }}>{job.company}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{job.role}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>{job.source}</span>
        <button
          onClick={() => onVerify(job.id)}
          disabled={verifying}
          className="mono"
          style={{
            padding: '3px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid rgba(57,255,20,0.3)', color: verifying ? 'var(--muted)' : 'var(--amber)',
          }}
        >
          {verifying ? '…' : 'Verify ↗'}
        </button>
      </div>
    </div>
  )
}
