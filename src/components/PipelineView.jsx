import { STATUS } from '../constants'

export default function PipelineView({ jobs, onSelect, onStatusChange }) {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 'max-content', alignItems: 'flex-start' }}>
        {Object.entries(STATUS).map(([status, cfg]) => {
          const col = jobs.filter(j => j.status === status)
          return (
            <div key={status} style={{ width: 236, background: 'var(--surface)', border: '1px solid var(--border)', padding: 14 }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{status}</span>
                <span className="mono" style={{ fontSize: 9, background: cfg.bg, color: cfg.color, padding: '2px 6px', border: `1px solid ${cfg.border}`, letterSpacing: '0.06em' }}>{col.length}</span>
              </div>
              {/* Cards */}
              {col.map(job => (
                <PipelineCard key={job.id} job={job} cfg={cfg} onClick={() => onSelect(job.id)} onStatusChange={(s) => onStatusChange(job.id, s)} />
              ))}
              {col.length === 0 && (
                <div className="mono" style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px dashed var(--border)' }}>
                  empty
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PipelineCard({ job, cfg, onClick, onStatusChange }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', padding: 12,
        marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color + '50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 3, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{job.company}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.role}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.04em' }}>{job.salary_band}</div>
      {job.interviewRounds?.length > 0 && (
        <div className="mono" style={{ marginTop: 5, fontSize: 9, color: 'var(--amber)', letterSpacing: '0.06em' }}>
          ▸ {job.interviewRounds.length} round{job.interviewRounds.length !== 1 ? 's' : ''}
        </div>
      )}
      {job.notes && (
        <div className="mono" style={{ marginTop: 5, fontSize: 9, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          // {job.notes}
        </div>
      )}
      {/* Move buttons */}
      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
        {Object.keys(STATUS).filter(s => s !== job.status).slice(0, 3).map(s => (
          <button key={s} onClick={() => onStatusChange(s)} className="mono" style={{
            padding: '2px 7px', fontSize: 9, background: STATUS[s].bg, color: STATUS[s].color,
            border: `1px solid ${STATUS[s].border}`, letterSpacing: '0.06em',
          }}>→ {s}</button>
        ))}
      </div>
    </div>
  )
}
