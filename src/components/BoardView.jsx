import { STATUS } from '../constants'
import { statusCounts } from '../utils/jobUtils'
import JobCard from './JobCard'

export default function BoardView({ jobs, allJobs, selectedId, onSelect, filterStatus, onFilterStatus, onAdd }) {
  const counts = statusCounts(allJobs)

  return (
    <div>
      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <FilterChip label={`All · ${allJobs.length}`} active={filterStatus === 'All'} onClick={() => onFilterStatus('All')} color="var(--muted)" />
          {Object.entries(STATUS).map(([s, cfg]) => (
            <FilterChip
              key={s}
              label={`${s} · ${counts[s] || 0}`}
              active={filterStatus === s}
              onClick={() => onFilterStatus(s)}
              color={cfg.color}
              activeBg={cfg.bg}
            />
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {jobs.length === 0 && (
          <div className="mono" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>// no roles found</div>
            <div style={{ fontSize: 10 }}>
              try a different filter, or{' '}
              <button onClick={onAdd} style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: 10, textDecoration: 'underline', fontFamily: 'JetBrains Mono, monospace' }}>
                add a role manually
              </button>
            </div>
          </div>
        )}
        {jobs.map(job => (
          <JobCard key={job.id} job={job} selected={selectedId === job.id} onClick={() => onSelect(job.id)} />
        ))}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick, color, activeBg }) {
  return (
    <button
      onClick={onClick}
      className="mono"
      style={{
        padding: '4px 10px', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        background: active ? (activeBg || 'var(--surface2)') : 'transparent',
        color: active ? color : 'var(--muted)',
      }}
    >
      {label}
    </button>
  )
}
