import { useState } from 'react'
import { STATUS } from '../constants'

const STYLES = `
  @keyframes tray-in    { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes card-land  { from{opacity:0;transform:translateY(-10px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes card-leave { from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.9)} }
  @keyframes col-flash  { 0%{box-shadow:none}40%{box-shadow:inset 0 0 0 2px var(--flash)}100%{box-shadow:none} }
  @keyframes count-pop  { 0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)} }
  @keyframes pool-in    { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)} }

  .stage-col.flash { animation: col-flash .4s ease; }

  .stage-card {
    cursor: pointer;
    transition: border-color .12s, box-shadow .12s, transform .12s;
  }
  .stage-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.4); transform: translateY(-1px); }
  .stage-card.landed { animation: card-land .22s cubic-bezier(.4,0,.2,1) both; }

  .pool-card {
    cursor: pointer;
    transition: all .15s;
    position: relative;
  }
  .pool-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.5); }
  .pool-card.active {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 28px rgba(0,0,0,.6);
  }
  .pool-card.leaving { animation: card-leave .18s ease both; }

  .stage-target {
    cursor: pointer;
    transition: background .12s, box-shadow .12s, transform .1s;
  }
  .stage-target:hover { transform: scale(1.04); }
  .stage-target:active { transform: scale(.97); }

  .tray { animation: tray-in .18s cubic-bezier(.4,0,.2,1) both; }
`

export default function PipelineView({ jobs, onSelect, onStatusChange }) {
  const [selectedId, setSelectedId]   = useState(null)
  const [flashCol,   setFlashCol]     = useState(null)
  const [landingId,  setLandingId]    = useState(null)
  const [leavingId,  setLeavingId]    = useState(null)
  const [filterStatus, setFilter]     = useState('All')

  const selectedJob = jobs.find(j => j.id === selectedId)

  const handlePoolClick = (jobId) => {
    setSelectedId(prev => prev === jobId ? null : jobId)
  }

  const moveJob = (status) => {
    if (!selectedId) return
    const job = jobs.find(j => j.id === selectedId)
    if (!job || job.status === status) { setSelectedId(null); return }

    // Trigger animations
    setLeavingId(selectedId)
    setTimeout(() => {
      onStatusChange(selectedId, status)
      setLandingId(selectedId)
      setFlashCol(status)
      setLeavingId(null)
      setSelectedId(null)
      setTimeout(() => setLandingId(null), 400)
      setTimeout(() => setFlashCol(null), 450)
    }, 160)
  }

  const poolJobs = filterStatus === 'All'
    ? jobs
    : jobs.filter(j => j.status === filterStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', gap: 0 }}>
      <style>{STYLES}</style>

      {/* ── TOP: Stage columns ─────────────────────────────────────────── */}
      <div style={{ flex: '0 0 52%', display: 'flex', gap: 10, minHeight: 0, padding: '0 0 12px' }}>
        {Object.entries(STATUS).map(([status, cfg]) => {
          const col     = jobs.filter(j => j.status === status)
          const isFlash = flashCol === status

          return (
            <div
              key={status}
              className={`stage-col${isFlash ? ' flash' : ''}`}
              style={{
                flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                background: 'var(--surface)', border: '1px solid var(--border)',
                '--flash': cfg.color,
              }}
            >
              {/* Column header */}
              <div style={{
                padding: '10px 12px 9px', flexShrink: 0,
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(180deg, ${cfg.color}08 0%, transparent 100%)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                  <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: cfg.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{status}</span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 6px', minWidth: 20, textAlign: 'center',
                    background: col.length ? cfg.bg : 'var(--surface2)',
                    color: col.length ? cfg.color : 'var(--muted)',
                    border: `1px solid ${col.length ? cfg.border : 'var(--border)'}`,
                    animation: isFlash ? 'count-pop .35s ease' : 'none',
                  }}
                >{col.length}</span>
              </div>

              {/* Cards — scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 6px' }}>
                {col.map(job => (
                  <div
                    key={job.id}
                    className={`stage-card${landingId === job.id ? ' landed' : ''}`}
                    onClick={() => onSelect(job.id)}
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${cfg.color}60`,
                      padding: '9px 10px', marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{job.company}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.role}</div>
                    {job.salary_band && (
                      <div className="mono" style={{ fontSize: 9, color: 'var(--green)', marginTop: 4 }}>{job.salary_band}</div>
                    )}
                  </div>
                ))}

                {col.length === 0 && (
                  <div className="mono" style={{
                    height: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--muted)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
                    border: '1px dashed var(--border)', opacity: 0.5,
                  }}>empty</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── MIDDLE: Action tray (visible when a job is selected) ─────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: selectedJob ? 'var(--surface)' : 'var(--bg)',
        transition: 'background .2s',
        minHeight: selectedJob ? 60 : 36,
      }}>
        {selectedJob ? (
          <div className="tray" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedJob.company}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{selectedJob.role}</div>
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>→ move to</div>
            <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([status, cfg]) => {
                const isCurrent = selectedJob.status === status
                return (
                  <button
                    key={status}
                    onClick={() => moveJob(status)}
                    disabled={isCurrent}
                    className="mono stage-target"
                    style={{
                      padding: '5px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: isCurrent ? cfg.bg : 'transparent',
                      color: isCurrent ? cfg.color : 'var(--muted)',
                      border: `1px solid ${isCurrent ? cfg.color + '50' : 'var(--border)'}`,
                      opacity: isCurrent ? 1 : 0.8,
                      cursor: isCurrent ? 'default' : 'pointer',
                    }}
                  >
                    {cfg.icon} {status}
                    {isCurrent && <span style={{ marginLeft: 5, opacity: 0.7 }}>← here</span>}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '0 4px' }}
            >×</button>
          </div>
        ) : (
          <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Job Pool — {jobs.length} total
              </span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', opacity: 0.6 }}>click a card to move it to a stage</span>
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 5 }}>
              {['All', ...Object.keys(STATUS)].map(s => {
                const cfg = STATUS[s]
                const count = s === 'All' ? jobs.length : jobs.filter(j => j.status === s).length
                return (
                  <button key={s} onClick={() => setFilter(s)} className="mono" style={{
                    padding: '3px 9px', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    background: filterStatus === s ? (cfg?.bg || 'rgba(255,255,255,.06)') : 'transparent',
                    color: filterStatus === s ? (cfg?.color || 'var(--text)') : 'var(--muted)',
                    border: `1px solid ${filterStatus === s ? (cfg?.color + '40' || 'var(--border)') : 'var(--border)'}`,
                    transition: 'all .12s',
                  }}>{s === 'All' ? `All (${count})` : `${cfg.icon} ${count}`}</button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM: Job pool ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 0 0' }}>
        {poolJobs.length === 0 ? (
          <div className="mono" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em' }}>
            no jobs to show
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {poolJobs.map((job, i) => {
              const cfg      = STATUS[job.status]
              const isActive = selectedId === job.id
              const isLeaving = leavingId === job.id

              return (
                <div
                  key={job.id}
                  className={`pool-card${isActive ? ' active' : ''}${isLeaving ? ' leaving' : ''}`}
                  onClick={() => handlePoolClick(job.id)}
                  style={{
                    background: isActive ? 'var(--surface)' : 'var(--surface2)',
                    border: `1px solid ${isActive ? cfg.color + '60' : 'var(--border)'}`,
                    borderTop: `3px solid ${cfg.color}`,
                    padding: '12px 13px',
                    boxShadow: isActive ? `0 0 0 2px ${cfg.color}30` : 'none',
                    animation: `pool-in .18s ease ${i * 0.02}s both`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>{job.company}</div>
                    <span style={{
                      fontSize: 10, flexShrink: 0, marginLeft: 4, marginTop: 1,
                      opacity: isActive ? 1 : 0.5,
                      color: isActive ? cfg.color : 'var(--muted)',
                      transition: 'opacity .15s',
                    }}>{cfg.icon}</span>
                  </div>

                  <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.role}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{
                      fontSize: 8, padding: '2px 6px',
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{job.status}</span>

                    {isActive && (
                      <span className="mono" style={{ fontSize: 8, color: cfg.color, letterSpacing: '0.06em', animation: 'tray-in .15s ease' }}>
                        select stage ↑
                      </span>
                    )}
                  </div>

                  {job.salary_band && !isActive && (
                    <div className="mono" style={{ fontSize: 9, color: 'var(--green)', marginTop: 5 }}>{job.salary_band}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
