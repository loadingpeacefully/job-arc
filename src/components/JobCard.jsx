import { STATUS } from '../constants'
import { getDaysAgo } from '../utils/jobUtils'

export default function JobCard({ job, selected, onClick }) {
  const cfg = STATUS[job.status]
  const age = getDaysAgo(job.posted_date)
  const stale = age !== null && age > 60

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: selected ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--amber)30' : 'var(--border)'}`,
        borderLeft: `3px solid ${selected ? 'var(--amber)' : cfg.color}`,
        padding: '12px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{job.company}</span>
            <VerifyBadge verified={job.verified} />
          </div>
          <div className="mono" style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.role}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <LevelBadge level={job.level} />
            <SalaryBadge salary={job.salary_band} confirmed={job.salary_confirmed} />
            {job.location && <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.04em' }}>📍 {job.location}</span>}
            {(job.tags || []).slice(0, 3).map(t => <Tag key={t} label={t} />)}
            {stale && <Tag label="may be closed" color="var(--red)" />}
          </div>

          {(job.resume || job.coverLetter || job.referralContact) && (
            <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {job.resume && <FileBadge icon="📄" label={job.resume} color="var(--blue)" bg="var(--blue-bg)" />}
              {job.coverLetter && <FileBadge icon="✉️" label={job.coverLetter} color="var(--purple)" bg="var(--purple-bg)" />}
              {job.referralContact && <FileBadge icon="👤" label={job.referralContact} color="var(--green)" bg="var(--green-bg)" />}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <StatusBadge cfg={cfg} status={job.status} />
          <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>{job.posted_date}</span>
          {job.appliedDate && <span className="mono" style={{ fontSize: 9, color: 'var(--blue)' }}>applied {job.appliedDate}</span>}
          {job.interviewRounds?.length > 0 && (
            <span className="mono" style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '0.06em' }}>
              ▸ {job.interviewRounds.length} round{job.interviewRounds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function VerifyBadge({ verified }) {
  if (verified === null || verified === undefined) return null
  const cfg = verified === true
    ? { symbol: '✓', color: 'var(--green)', title: 'Verified on company careers site' }
    : verified === false
    ? { symbol: '✗', color: 'var(--red)', title: 'No matching company careers URL found' }
    : { symbol: '?', color: 'var(--muted)', title: 'Not yet verified' }
  return (
    <span title={cfg.title} style={{ fontSize: 10, color: cfg.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
      {cfg.symbol}
    </span>
  )
}

function StatusBadge({ cfg, status }) {
  return (
    <span className="mono" style={{
      fontSize: 9, fontWeight: 700, padding: '3px 7px',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>
      {status}
    </span>
  )
}

function LevelBadge({ level }) {
  return (
    <span className="mono" style={{
      fontSize: 9, color: 'var(--muted)', background: 'transparent',
      padding: '2px 6px', border: '1px solid var(--border)',
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {level === 'Senior Product Manager' ? 'Sr PM' : 'PM'}
    </span>
  )
}

function SalaryBadge({ salary, confirmed }) {
  return (
    <span className="mono" style={{
      fontSize: 9, fontWeight: 600, color: 'var(--green)', background: 'var(--green-bg)',
      padding: '2px 6px', border: '1px solid rgba(63,185,80,0.2)',
      letterSpacing: '0.06em',
    }}>
      {salary}{!confirmed ? ' ~' : ''}
    </span>
  )
}

function Tag({ label, color }) {
  return (
    <span className="mono" style={{
      fontSize: 9, padding: '2px 6px', border: '1px solid var(--border)',
      background: 'transparent', color: color || 'var(--muted)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}

function FileBadge({ icon, label, color, bg }) {
  return (
    <span className="mono" style={{
      fontSize: 9, background: bg, color, padding: '2px 7px',
      border: `1px solid ${color}25`,
      maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {icon} {label}
    </span>
  )
}
