import { useState, useEffect } from 'react'
import { getDaysAgo } from '../utils/jobUtils'
import { clearSession } from '../utils/auth'

export default function Header({ tab, setTab, onAdd, onSettings, onScan, scanning, lastScan, jobCount, onLogout }) {
  const scanAge = lastScan ? getDaysAgo(lastScan.slice(0,10)) : null
  const [extActive, setExtActive] = useState(false)
  useEffect(() => {
    const check = () => setExtActive(localStorage.getItem('pm_tracker_ext_heartbeat') === 'true')
    check()
    const id = setInterval(check, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{
      background: 'rgba(5,5,5,0.96)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky', top: 0, zIndex: 50,
      padding: '0 24px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 20 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
            <div className="ping" style={{
              position: 'absolute', width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(57,255,20,0.15)',
            }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 8px #39FF14' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#d1d1d1', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              JOB<span style={{ color: '#39FF14' }}>.ARC</span><span className="cursor-blink" style={{ color: '#39FF14' }}>_</span>
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>track every application</div>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {['board', 'daily', 'pipeline', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', border: 'none', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'transparent',
              color: tab === t ? 'var(--amber)' : 'var(--muted)',
              borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {t}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastScan && (
            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              scan: {scanAge === 0 ? 'today' : `${scanAge}d ago`}
            </div>
          )}

          <button
            onClick={onScan}
            disabled={scanning}
            style={{
              padding: '6px 14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: scanning ? 'rgba(255,255,255,0.03)' : 'rgba(57,255,20,0.05)',
              color: scanning ? 'var(--muted)' : 'var(--amber)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {scanning ? <span className="spinner" style={{ display: 'inline-block' }}>↻</span> : '⟳'}
            {scanning ? 'Scanning…' : 'Live Scan'}
          </button>

          <button
            onClick={onAdd}
            style={{
              padding: '6px 16px',
              border: '1px solid var(--amber)',
              background: 'transparent', color: 'var(--amber)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}
          >
            + Add Role
          </button>

          <div title={extActive ? 'PM Tracker Extension active' : 'PM Tracker Extension not detected'} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'default' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: extActive ? '#39FF14' : 'var(--border)', boxShadow: extActive ? '0 0 6px #39FF14' : 'none', transition: 'all 0.4s ease' }} />
            {extActive && <span className="mono" style={{ fontSize: 8, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ext</span>}
          </div>
          <button onClick={onSettings} style={{
            width: 32, height: 32,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'var(--muted)', fontSize: 14,
          }}>⚙</button>

          <button
            onClick={() => { clearSession(); onLogout() }}
            className="mono"
            title="Logout"
            style={{
              width: 32, height: 32,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'var(--muted)', fontSize: 13,
              letterSpacing: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#FF5555' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--muted)' }}
          >↩</button>
        </div>
      </div>

      {/* Shimmer line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.35) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
        }} />
      </div>
    </header>
  )
}
