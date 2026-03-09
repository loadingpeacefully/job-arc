import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { STATUS, INTERVIEW_TYPES, LEVELS } from '../constants'
import { newInterviewRound, newContact } from '../utils/jobUtils'

const TABS = ['Overview', 'Contacts', 'Application', 'Interviews', 'Resume', 'Salary']

const CONTACT_STATUS = ['Not reached', 'Messaged', 'Replied', 'Had a call', 'Referred']
const CONTACT_STATUS_COLOR = {
  'Not reached': 'var(--muted)',
  'Messaged':    'var(--blue)',
  'Replied':     'var(--purple)',
  'Had a call':  'var(--amber)',
  'Referred':    'var(--green)',
}
const CONNECTION_TYPES = ['Cold', 'Alumni', 'Mutual', 'Known']

const GLOBAL_STYLES = `
  @keyframes tab-in       { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes card-in      { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }
  @keyframes fade-in      { from { opacity:0 } to { opacity:1 } }
  @keyframes save-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(250,176,5,0)}50%{box-shadow:0 0 0 8px rgba(250,176,5,0.12)} }
  @keyframes status-pop   { 0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)} }
  @keyframes slide-in-top { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-ring   { 0%{transform:scale(1);opacity:.3}50%{transform:scale(1.18);opacity:.12}100%{transform:scale(1);opacity:.3} }
  @keyframes pulse-core   { 0%,100%{transform:scale(1)}50%{transform:scale(1.12)} }
  @keyframes modal-in     { from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)} }
  @keyframes count-up     { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)} }

  .tab-content  { animation: tab-in .18s cubic-bezier(.4,0,.2,1) both }
  .card-item    { animation: card-in .2s cubic-bezier(.4,0,.2,1) both }
  .fade-in      { animation: fade-in .2s ease both }

  .jdv-btn {
    transition: background .14s, color .14s, border-color .14s, box-shadow .14s, transform .1s;
    cursor: pointer;
  }
  .jdv-btn:hover:not(:disabled)  { filter: brightness(1.12); transform: translateY(-1px); }
  .jdv-btn:active:not(:disabled) { transform: translateY(0); }
  .jdv-btn:disabled { opacity: .45; cursor: default; }

  .jdv-input {
    transition: border-color .15s, box-shadow .15s;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
  }
  .jdv-input:focus {
    outline: none;
    border-color: rgba(250,176,5,.45);
    box-shadow: 0 0 0 3px rgba(250,176,5,.07);
  }

  .status-opt { transition: background .15s, border-color .15s, color .15s, transform .1s; cursor: pointer; }
  .status-opt:hover  { filter: brightness(1.1); }
  .status-opt.active { animation: status-pop .25s ease; }

  .tab-btn { position: relative; transition: color .15s; }
  .tab-btn::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 50%; right: 50%;
    height: 2px;
    background: var(--amber);
    transition: left .2s cubic-bezier(.4,0,.2,1), right .2s cubic-bezier(.4,0,.2,1);
  }
  .tab-btn.active::after { left: 0; right: 0; }

  .dirty-save { animation: save-pulse 1.6s ease-in-out infinite; }

  .contact-card { transition: border-color .15s, box-shadow .15s; }
  .contact-card:hover { border-color: rgba(255,255,255,.15); box-shadow: 0 2px 16px rgba(0,0,0,.3); }

  .version-row { transition: background .12s; }
  .version-row:hover { background: var(--surface2) !important; }

  .round-card { transition: border-color .15s, transform .15s; }
  .round-card:hover { border-color: rgba(250,176,5,.3); transform: translateY(-1px); }
`

export default function JobDetailView({ job, onUpdate, onDelete, onBack, onVerify, verifying, onGenerateResume, generatingResume }) {
  const [local, setLocal] = useState(job)
  const [tab, setTab]     = useState('Overview')
  const [dirty, setDirty] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const prevGenerating = useRef(false)
  const tabKey = useRef(0)

  useEffect(() => { setLocal(job); setDirty(false) }, [job.id])

  useEffect(() => {
    setLocal(l => ({
      ...l,
      verified: job.verified, canonicalUrl: job.canonicalUrl, verifiedAt: job.verifiedAt,
      salary_verified: job.salary_verified, salary_source: job.salary_source,
      salary_confirmed: job.salary_confirmed, salary_band: job.salary_band,
      resumeHtml: job.resumeHtml, resumeVersions: job.resumeVersions,
    }))
  }, [job.verified, job.salary_band, job.resumeHtml, job.resumeVersions])

  useEffect(() => {
    if (prevGenerating.current && !generatingResume && job.resumeHtml) {
      setTab('Resume'); setShowResumeModal(true)
    }
    prevGenerating.current = generatingResume
  }, [generatingResume, job.resumeHtml])

  const set  = (key, val) => { setLocal(l => ({ ...l, [key]: val })); setDirty(true) }
  const save = () => {
    onUpdate(local)
    setDirty(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const changeTab = (t) => { tabKey.current++; setTab(t) }

  const cfg = STATUS[local.status] || STATUS['Saved']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {/* Status color strip */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color, opacity: 0.8, transition: 'background .3s' }} />

        <button onClick={onBack} className="mono jdv-btn" style={{
          background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
          padding: '4px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
        }}>← Board</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{local.company}</span>
          <span style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{local.role}</span>
          <span style={{
            flexShrink: 0, padding: '2px 8px', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', border: `1px solid ${cfg.color}40`,
            background: cfg.bg, color: cfg.color, fontFamily: 'monospace',
          }}>{cfg.icon} {local.status}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {local.jd_url && (
            <a href={local.jd_url} target="_blank" rel="noopener noreferrer" className="mono jdv-btn" style={{
              padding: '5px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--blue)', border: '1px solid var(--border)', textDecoration: 'none', background: 'transparent',
            }}>View JD ↗</a>
          )}
          <button
            onClick={save} disabled={!dirty}
            className={`mono jdv-btn${dirty ? ' dirty-save' : ''}`}
            style={{
              padding: '5px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: savedFlash ? 'var(--green)' : dirty ? 'var(--amber)' : 'transparent',
              color: (dirty || savedFlash) ? '#000' : 'var(--muted)',
              border: savedFlash ? '1px solid var(--green)' : dirty ? '1px solid var(--amber)' : '1px solid var(--border)',
              transition: 'all .2s',
            }}
          >{savedFlash ? '✓ Saved' : dirty ? 'Save ✦' : 'Saved'}</button>
          <button
            onClick={() => { if (confirm(`Delete "${local.company}"?`)) onDelete() }}
            className="mono jdv-btn"
            style={{ padding: '5px 10px', fontSize: 9, background: 'transparent', border: '1px solid rgba(248,81,73,0.3)', color: 'var(--red)' }}
          >DEL</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', width: '100%', maxWidth: 1440, margin: '0 auto', padding: '0 0 60px' }}>

        {/* ── Left sidebar ── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '20px 0' }}>
          <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 1 }}>

            {/* Status */}
            <div style={{ padding: '0 14px 16px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Status</div>
              {Object.entries(STATUS).map(([s, c]) => (
                <button
                  key={s}
                  onClick={() => set('status', s)}
                  className={`mono status-opt${local.status === s ? ' active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    width: '100%', padding: '6px 10px', marginBottom: 3, fontSize: 9,
                    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left',
                    border: `1px solid ${local.status === s ? c.color + '60' : 'transparent'}`,
                    background: local.status === s ? c.bg : 'transparent',
                    color: local.status === s ? c.color : 'var(--muted)',
                    borderRadius: 0,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{c.icon}</span>
                  {s}
                  {local.status === s && (
                    <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: c.color, animation: 'pulse-core 1.5s ease-in-out infinite' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Meta fields */}
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              <SideField label="Location">{local.location || '—'}</SideField>
              <SideField label="Source">
                <span className="mono" style={{ padding: '2px 7px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 9 }}>{local.source || '—'}</span>
              </SideField>
              <SideField label="Posted">{local.posted_date || '—'}</SideField>
              <SideField label="Updated">{local.lastUpdated || '—'}</SideField>
              <SideField label="Salary Band">
                <input
                  value={local.salary_band || ''}
                  onChange={e => set('salary_band', e.target.value)}
                  className="mono jdv-input"
                  style={{ width: '100%', padding: '4px 7px', fontSize: 10, color: 'var(--amber)' }}
                />
              </SideField>

              {(local.tags || []).length > 0 && (
                <SideField label="Tags">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                    {(local.tags || []).map(t => (
                      <span key={t} className="mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(188,140,255,.08)', border: '1px solid rgba(188,140,255,.2)', color: 'var(--purple)' }}>{t}</span>
                    ))}
                  </div>
                </SideField>
              )}

              {local.verified !== null && local.verified !== undefined && (
                <div style={{
                  marginTop: 4, padding: '7px 9px',
                  background: local.verified ? 'rgba(63,185,80,.06)' : 'rgba(248,81,73,.06)',
                  border: `1px solid ${local.verified ? 'rgba(63,185,80,.25)' : 'rgba(248,81,73,.25)'}`,
                  animation: 'slide-in-top .2s ease',
                }}>
                  <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: local.verified ? 'var(--green)' : 'var(--red)' }}>
                    {local.verified ? '✓ Verified' : '✗ Not Found'}
                  </div>
                  {local.salary_verified && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, marginTop: 3 }}>{local.salary_verified}</div>
                  )}
                  {local.verifiedAt && (
                    <div className="mono" style={{ fontSize: 8, color: 'var(--muted)', marginTop: 2 }}>{local.verifiedAt}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 24px', position: 'sticky', top: 52, zIndex: 30 }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => changeTab(t)}
                className={`mono tab-btn${tab === t ? ' active' : ''}`}
                style={{
                  padding: '12px 16px', border: 'none', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent',
                  color: tab === t ? 'var(--amber)' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >{t}</button>
            ))}
          </div>

          {/* Tab content */}
          <div key={`${tab}-${tabKey.current}`} className="tab-content" style={{ flex: 1, padding: '28px 28px 60px' }}>
            {tab === 'Overview'    && <OverviewTab    local={local} set={set} onVerify={onVerify} verifying={verifying} />}
            {tab === 'Contacts'    && <ContactsTab    local={local} set={set} />}
            {tab === 'Application' && <ApplicationTab local={local} set={set} onSwitchToResume={() => changeTab('Resume')} />}
            {tab === 'Interviews'  && <InterviewsTab  local={local} set={set} />}
            {tab === 'Resume'      && <ResumeTab      local={local} onGenerateResume={onGenerateResume} generatingResume={generatingResume} onOpenModal={() => setShowResumeModal(true)} />}
            {tab === 'Salary'      && <SalaryTab      local={local} set={set} />}
          </div>
        </div>
      </div>

      {generatingResume && <GeneratingOverlay company={local.company} />}

      {showResumeModal && local.resumeHtml && (
        <ResumeModal html={local.resumeHtml} company={local.company} onClose={() => setShowResumeModal(false)} />
      )}
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────────────────

function SideField({ label, children }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text)' }}>{children}</div>
    </div>
  )
}

function Field({ label, children, span }) {
  return (
    <div style={{ marginBottom: 18, gridColumn: span ? `span ${span}` : undefined }}>
      <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, mono }) {
  return (
    <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`jdv-input${mono ? ' mono' : ''}`}
      style={{ width: '100%', padding: '9px 12px', fontSize: 13 }} />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="jdv-input"
      style={{ width: '100%', padding: '9px 12px', resize: 'vertical', lineHeight: 1.65, fontSize: 13 }} />
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({ local, set, onVerify, verifying }) {
  const verifyStatus = local.verified === true ? 'verified' : local.verified === false ? 'not-found' : 'unchecked'
  const verifyColor  = verifyStatus === 'verified' ? 'var(--green)' : verifyStatus === 'not-found' ? 'var(--red)' : 'var(--muted)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>

      {/* Left column */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 2 }}>
          <Field label="Company"><TextInput value={local.company} onChange={v => set('company', v)} /></Field>
          <Field label="Role Title"><TextInput value={local.role} onChange={v => set('role', v)} /></Field>
          <Field label="Level">
            <select value={local.level} onChange={e => set('level', e.target.value)}
              className="jdv-input" style={{ width: '100%', padding: '9px 12px', fontSize: 13 }}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Tags (comma-separated)">
            <TextInput value={(local.tags || []).join(', ')} onChange={v => set('tags', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Fintech, B2B, Growth" />
          </Field>
        </div>

        <Field label="Key Requirements (one per line)">
          <Textarea
            value={(local.keyRequirements || []).join('\n')}
            onChange={v => set('keyRequirements', v.split('\n').map(s => s.trim()).filter(Boolean))}
            placeholder={"5+ yrs PM experience\nData-driven decisions\nCross-functional leadership"}
            rows={8}
          />
        </Field>

        <Field label="Notes">
          <Textarea value={local.notes} onChange={v => set('notes', v)} placeholder="Anything important about this role…" rows={4} />
        </Field>
      </div>

      {/* Right column — authenticity card */}
      <div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: verifyStatus !== 'unchecked' ? 12 : 0 }}>
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authenticity</span>
            {onVerify && (
              <button onClick={() => onVerify(local.id)} disabled={verifying} className="mono jdv-btn" style={{
                padding: '4px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'transparent', border: '1px solid var(--border)',
                color: verifying ? 'var(--muted)' : 'var(--amber)',
              }}>
                {verifying ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ display: 'inline-block', animation: 'pulse-core 1s ease-in-out infinite', fontSize: 11 }}>⟳</span> Checking
                  </span>
                ) : verifyStatus === 'unchecked' ? 'Verify ↗' : 'Re-verify'}
              </button>
            )}
          </div>
          {verifyStatus !== 'unchecked' && (
            <div style={{ animation: 'slide-in-top .2s ease' }}>
              <span className="mono" style={{ fontSize: 11, color: verifyColor, fontWeight: 700 }}>
                {verifyStatus === 'verified' ? '✓ Verified live' : '✗ Not found'}
              </span>
              {local.canonicalUrl && (
                <a href={local.canonicalUrl} target="_blank" rel="noopener noreferrer" className="mono"
                  style={{ display: 'block', fontSize: 9, color: 'var(--green)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ↗ {local.canonicalUrl}
                </a>
              )}
              {local.salary_verified && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(250,176,5,.06)', border: '1px solid rgba(250,176,5,.2)' }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>{local.salary_verified}</div>
                  {local.salary_source && (
                    <div className="mono" style={{ fontSize: 9, color: local.salary_confirmed ? 'var(--green)' : 'var(--muted)', marginTop: 3 }}>
                      {local.salary_confirmed ? '✓ ' : ''}{local.salary_source}
                    </div>
                  )}
                </div>
              )}
              {local.verifiedAt && (
                <div className="mono" style={{ fontSize: 8, color: 'var(--muted)', marginTop: 8 }}>checked {local.verifiedAt}</div>
              )}
            </div>
          )}
          {verifyStatus === 'unchecked' && (
            <p className="mono" style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
              Confirm the listing is still live and scrape the verified salary band.
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Contacts', value: (local.contacts || []).length, color: 'var(--blue)' },
            { label: 'Rounds', value: (local.interviewRounds || []).length, color: 'var(--purple)' },
            { label: 'Resumes', value: (local.resumeVersions || []).length, color: 'var(--amber)' },
            { label: 'Requirements', value: (local.keyRequirements || []).length, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'monospace', animation: 'count-up .3s ease' }}>{s.value}</div>
              <div className="mono" style={{ fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Contacts Tab ──────────────────────────────────────────────────────────

function ContactsTab({ local, set }) {
  const contacts = local.contacts || []
  const versions = local.resumeVersions || []

  const addContact    = () => set('contacts', [...contacts, newContact()])
  const updateContact = (id, updates) => set('contacts', contacts.map(c => c.id === id ? { ...c, ...updates } : c))
  const deleteContact = (id) => set('contacts', contacts.filter(c => c.id !== id))

  const reached  = contacts.filter(c => c.status !== 'Not reached').length
  const referred = contacts.filter(c => c.status === 'Referred').length

  return (
    <div>
      {/* Header strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{contacts.length}</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>contacts at {local.company}</span>
          {contacts.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(88,166,255,.08)', border: '1px solid rgba(88,166,255,.2)', color: 'var(--blue)' }}>{reached} reached</span>
              {referred > 0 && <span className="mono" style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(63,185,80,.08)', border: '1px solid rgba(63,185,80,.2)', color: 'var(--green)' }}>{referred} referred ✓</span>}
            </div>
          )}
        </div>
        <button onClick={addContact} className="mono jdv-btn" style={{
          padding: '7px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'rgba(250,176,5,.08)', color: 'var(--amber)', border: '1px solid rgba(250,176,5,.25)',
        }}>+ Add Contact</button>
      </div>

      {contacts.length === 0 && (
        <div className="mono" style={{
          textAlign: 'center', padding: '64px 24px', color: 'var(--muted)',
          fontSize: 11, letterSpacing: '0.06em', border: '1px dashed var(--border)',
          lineHeight: 1.8,
        }}>
          No contacts yet.<br />
          <span style={{ fontSize: 10 }}>Add people you're chasing for a referral at {local.company}.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {contacts.map((c, i) => {
          const statusColor    = CONTACT_STATUS_COLOR[c.status] || 'var(--muted)'
          const sharedVersion  = versions.find(v => v.id === c.resumeVersionId)

          return (
            <div key={c.id} className="contact-card card-item" style={{
              background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden',
              animationDelay: `${i * 0.04}s`,
            }}>
              {/* Card top accent bar based on status */}
              <div style={{ height: 3, background: statusColor, opacity: 0.6, transition: 'background .2s' }} />

              {/* Header */}
              <div style={{ padding: '14px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={c.name} onChange={e => updateContact(c.id, { name: e.target.value })}
                    placeholder="Contact name"
                    className="jdv-input"
                    style={{ fontWeight: 700, fontSize: 13, padding: '5px 9px', width: '100%' }}
                  />
                  <input
                    value={c.role} onChange={e => updateContact(c.id, { role: e.target.value })}
                    placeholder="Their role at company"
                    className="mono jdv-input"
                    style={{ fontSize: 10, padding: '4px 9px', width: '100%', color: 'var(--muted)' }}
                  />
                </div>
                <button onClick={() => deleteContact(c.id)} className="jdv-btn" style={{
                  background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '2px 4px',
                }}>×</button>
              </div>

              {/* Status strip */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {CONTACT_STATUS.map(s => (
                  <button key={s} onClick={() => updateContact(c.id, { status: s })} className="mono jdv-btn" style={{
                    padding: '3px 8px', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    border: `1px solid ${c.status === s ? CONTACT_STATUS_COLOR[s] : 'var(--border)'}`,
                    background: c.status === s ? `${CONTACT_STATUS_COLOR[s]}18` : 'transparent',
                    color: c.status === s ? CONTACT_STATUS_COLOR[s] : 'var(--muted)',
                  }}>{s}</button>
                ))}
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'end' }}>
                  <Field label="LinkedIn">
                    <input value={c.linkedinUrl} onChange={e => updateContact(c.id, { linkedinUrl: e.target.value })}
                      placeholder="linkedin.com/in/..."
                      className="mono jdv-input"
                      style={{ width: '100%', padding: '7px 9px', fontSize: 10 }}
                    />
                  </Field>
                  {c.linkedinUrl && (
                    <a href={c.linkedinUrl.startsWith('http') ? c.linkedinUrl : `https://${c.linkedinUrl}`}
                      target="_blank" rel="noopener noreferrer" className="jdv-btn"
                      style={{ padding: '7px 10px', background: 'rgba(88,166,255,.08)', border: '1px solid rgba(88,166,255,.2)', color: 'var(--blue)', fontSize: 12, textDecoration: 'none', marginBottom: 18 }}>
                      ↗
                    </a>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Connection">
                    <div style={{ display: 'flex', gap: 3 }}>
                      {CONNECTION_TYPES.map(t => (
                        <button key={t} onClick={() => updateContact(c.id, { connectionType: t })} className="mono jdv-btn" style={{
                          flex: 1, padding: '5px 3px', fontSize: 8, fontWeight: 700,
                          border: `1px solid ${c.connectionType === t ? 'rgba(188,140,255,.5)' : 'var(--border)'}`,
                          background: c.connectionType === t ? 'rgba(188,140,255,.1)' : 'transparent',
                          color: c.connectionType === t ? 'var(--purple)' : 'var(--muted)',
                        }}>{t}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Last Contacted">
                    <input type="date" value={c.lastContactDate || ''} onChange={e => updateContact(c.id, { lastContactDate: e.target.value })}
                      className="jdv-input" style={{ width: '100%', padding: '7px 9px', fontSize: 11 }} />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Resume Shared">
                    <select value={c.resumeVersionId || ''} onChange={e => updateContact(c.id, { resumeVersionId: e.target.value })}
                      className="jdv-input" style={{ width: '100%', padding: '7px 9px', fontSize: 11 }}>
                      <option value="">— not shared —</option>
                      {versions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Date Shared">
                    <input type="date" value={c.resumeSharedDate || ''} onChange={e => updateContact(c.id, { resumeSharedDate: e.target.value })}
                      disabled={!c.resumeVersionId}
                      className="jdv-input"
                      style={{ width: '100%', padding: '7px 9px', fontSize: 11, opacity: c.resumeVersionId ? 1 : 0.4 }} />
                  </Field>
                </div>

                <Field label="Notes">
                  <textarea value={c.notes || ''} onChange={e => updateContact(c.id, { notes: e.target.value })}
                    placeholder="How you know them, what was discussed, next steps…" rows={2}
                    className="jdv-input"
                    style={{ width: '100%', padding: '7px 9px', resize: 'vertical', lineHeight: 1.5, fontSize: 12 }} />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Application Tab ───────────────────────────────────────────────────────

function ApplicationTab({ local, set, onSwitchToResume }) {
  const [previewVersion, setPreviewVersion] = useState(null)
  const versions = local.resumeVersions || []

  const deleteVersion = (id) => {
    const updated = versions.filter(v => v.id !== id)
    set('resumeVersions', updated)
    set('resumeHtml', updated.length > 0 ? updated[updated.length - 1].html : '')
  }

  const printVersion = (v) => {
    const win = window.open('', '_blank')
    if (!win) { alert('Allow popups for this site to save as PDF.'); return }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${local.company} — ${v.label}</title></head><body style="margin:0">${v.html}</body></html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        <Field label="Applied Date">
          <input type="date" value={local.appliedDate || ''} onChange={e => set('appliedDate', e.target.value)}
            className="jdv-input" style={{ width: '100%', padding: '9px 12px', fontSize: 13 }} />
        </Field>
        <Field label="Cover Letter">
          <TextInput value={local.coverLetter} onChange={v => set('coverLetter', v)} placeholder="CL_Google.pdf" mono />
        </Field>
        <Field label="Referral Contact">
          <TextInput value={local.referralContact} onChange={v => set('referralContact', v)} placeholder="Priya Sharma" />
        </Field>
        <Field label="Referral Email">
          <TextInput value={local.referralEmail} onChange={v => set('referralEmail', v)} placeholder="priya@company.com" mono />
        </Field>
      </div>

      {/* Resume versions */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{versions.length}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resume Versions</span>
          </div>
          <button onClick={onSwitchToResume} className="mono jdv-btn" style={{
            padding: '6px 16px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'rgba(250,176,5,.08)', color: 'var(--amber)', border: '1px solid rgba(250,176,5,.25)',
          }}>✦ Generate New</button>
        </div>

        {versions.length === 0 ? (
          <div className="mono" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', border: '1px dashed var(--border)' }}>
            no versions yet — generate one from the Resume tab
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {versions.map((v, i) => (
              <div key={v.id} className="version-row card-item" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                animationDelay: `${i * 0.04}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)' }}>{v.label}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>
                      {new Date(v.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={() => deleteVersion(v.id)} className="jdv-btn" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPreviewVersion(v)} className="mono jdv-btn" style={{
                    flex: 1, padding: '5px', fontSize: 9, fontWeight: 700,
                    background: 'rgba(88,166,255,.06)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,.2)',
                  }}>⤢ Preview</button>
                  <button onClick={() => printVersion(v)} className="mono jdv-btn" style={{
                    flex: 1, padding: '5px', fontSize: 9, fontWeight: 700,
                    background: 'rgba(63,185,80,.06)', color: 'var(--green)', border: '1px solid rgba(63,185,80,.2)',
                  }}>↓ PDF</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewVersion && (
        <ResumeModal html={previewVersion.html} company={`${local.company} — ${previewVersion.label}`} onClose={() => setPreviewVersion(null)} />
      )}
    </div>
  )
}

// ── Interviews Tab ────────────────────────────────────────────────────────

function InterviewsTab({ local, set }) {
  const rounds      = local.interviewRounds || []
  const addRound    = () => set('interviewRounds', [...rounds, newInterviewRound()])
  const updateRound = (id, updates) => set('interviewRounds', rounds.map(r => r.id === id ? { ...r, ...updates } : r))
  const deleteRound = (id) => set('interviewRounds', rounds.filter(r => r.id !== id))

  const passed  = rounds.filter(r => r.outcome === 'Pass').length
  const pending = rounds.filter(r => r.outcome === 'Pending').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{rounds.length}</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>rounds logged</span>
          {rounds.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {passed > 0  && <span className="mono" style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(63,185,80,.08)', border: '1px solid rgba(63,185,80,.2)', color: 'var(--green)' }}>{passed} passed</span>}
              {pending > 0 && <span className="mono" style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(250,176,5,.08)', border: '1px solid rgba(250,176,5,.2)', color: 'var(--amber)' }}>{pending} pending</span>}
            </div>
          )}
        </div>
        <button onClick={addRound} className="mono jdv-btn" style={{
          padding: '7px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'rgba(250,176,5,.08)', color: 'var(--amber)', border: '1px solid rgba(250,176,5,.25)',
        }}>+ Add Round</button>
      </div>

      {rounds.length === 0 && (
        <div className="mono" style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.06em', border: '1px dashed var(--border)' }}>
          no rounds yet — click "+ Add Round" to log one
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {rounds.map((r, i) => {
          const outcomeColor = r.outcome === 'Pass' ? 'var(--green)' : r.outcome === 'Fail' ? 'var(--red)' : 'var(--amber)'
          return (
            <div key={r.id} className="round-card card-item" style={{
              background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden',
              animationDelay: `${i * 0.05}s`,
            }}>
              <div style={{ height: 3, background: outcomeColor, opacity: 0.6, transition: 'background .2s' }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Round {i + 1}</span>
                  <button onClick={() => deleteRound(r.id)} className="jdv-btn" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Field label="Type">
                    <select value={r.type} onChange={e => updateRound(r.id, { type: e.target.value })}
                      className="jdv-input" style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}>
                      {INTERVIEW_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input type="date" value={r.date} onChange={e => updateRound(r.id, { date: e.target.value })}
                      className="jdv-input" style={{ width: '100%', padding: '8px 10px', fontSize: 12 }} />
                  </Field>
                </div>
                <Field label="Outcome">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Pending', 'Pass', 'Fail'].map(o => (
                      <button key={o} onClick={() => updateRound(r.id, { outcome: o })} className="mono jdv-btn" style={{
                        padding: '6px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: r.outcome === o ? (o === 'Pass' ? 'rgba(63,185,80,.12)' : o === 'Fail' ? 'rgba(248,81,73,.12)' : 'rgba(250,176,5,.12)') : 'transparent',
                        color: r.outcome === o ? (o === 'Pass' ? 'var(--green)' : o === 'Fail' ? 'var(--red)' : 'var(--amber)') : 'var(--muted)',
                        border: `1px solid ${r.outcome === o ? 'currentColor' : 'var(--border)'}`,
                      }}>{o}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Feedback / Notes">
                  <Textarea value={r.feedback} onChange={v => updateRound(r.id, { feedback: v })} placeholder="What went well? What to improve?" rows={2} />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Resume Tab ────────────────────────────────────────────────────────────

function ResumeTab({ local, onGenerateResume, generatingResume, onOpenModal }) {
  const hasResume = !!local.resumeHtml

  const printResume = () => {
    const win = window.open('', '_blank')
    if (!win) { alert('Allow popups for this site to save as PDF.'); return }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${local.company} — Resume</title></head><body style="margin:0">${local.resumeHtml}</body></html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: hasResume ? '1fr 1fr' : '1fr', gap: 28 }}>
      <div>
        <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>// Tailored Resume</div>
          <p className="mono" style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, margin: '0 0 16px' }}>
            Generates a resume tailored to this role using your profile + JD.<br />Preview fullscreen → Print → Save as PDF.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onGenerateResume && onGenerateResume(local.id)} disabled={generatingResume} className="mono jdv-btn" style={{
              flex: 1, padding: '10px 16px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: generatingResume ? 'var(--surface2)' : 'rgba(250,176,5,.1)',
              color: generatingResume ? 'var(--muted)' : 'var(--amber)',
              border: `1px solid ${generatingResume ? 'var(--border)' : 'rgba(250,176,5,.3)'}`,
            }}>
              {generatingResume
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><span style={{ animation: 'pulse-core 1s infinite' }}>⟳</span> Generating…</span>
                : hasResume ? '↺ Regenerate' : '✦ Generate Resume'
              }
            </button>
            {hasResume && <>
              <button onClick={onOpenModal} className="mono jdv-btn" style={{
                padding: '10px 14px', fontSize: 9, fontWeight: 700,
                background: 'rgba(88,166,255,.06)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,.2)',
              }}>⤢ Fullscreen</button>
              <button onClick={printResume} className="mono jdv-btn" style={{
                padding: '10px 14px', fontSize: 9, fontWeight: 700,
                background: 'rgba(63,185,80,.06)', color: 'var(--green)', border: '1px solid rgba(63,185,80,.2)',
              }}>↓ PDF</button>
            </>}
          </div>
        </div>

        {!hasResume && !generatingResume && (
          <div className="mono" style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.06em', border: '1px dashed var(--border)' }}>
            no resume generated yet
          </div>
        )}
      </div>

      {hasResume && (
        <div style={{ border: '1px solid var(--border)', overflow: 'hidden', animation: 'fade-in .3s ease' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Live Preview</span>
            <button onClick={onOpenModal} className="mono jdv-btn" style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>⤢ Expand</button>
          </div>
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff">${local.resumeHtml}</body></html>`}
            style={{ width: '100%', height: 700, border: 'none', display: 'block', background: '#fff' }}
            title="Resume preview"
          />
        </div>
      )}
    </div>
  )
}

// ── Salary Tab ────────────────────────────────────────────────────────────

function SalaryTab({ local, set }) {
  const offered = parseFloat(local.salaryOffered)
  const target  = parseFloat(local.salaryTarget)
  const pct     = (!isNaN(offered) && !isNaN(target) && target > 0) ? Math.round((offered / target) * 100) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 4 }}>
          <Field label="Posted Salary Band"><TextInput value={local.salary_band}    onChange={v => set('salary_band', v)}    placeholder="60–90 LPA" /></Field>
          <Field label="Your Target (CTC)"><TextInput  value={local.salaryTarget}   onChange={v => set('salaryTarget', v)}   placeholder="90 LPA" /></Field>
          <Field label="Offered CTC"      span={2}><TextInput value={local.salaryOffered}  onChange={v => set('salaryOffered', v)}  placeholder="Fill after offer" /></Field>
        </div>
        <Field label="Negotiation Notes">
          <Textarea value={local.negotiationNotes} onChange={v => set('negotiationNotes', v)} placeholder="Counter-offer, ESOP, joining bonus, notice buy-out…" rows={6} />
        </Field>
      </div>

      <div>
        {pct !== null ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 24, animation: 'slide-in-top .2s ease' }}>
            <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>// Offer vs Target</div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>Offered</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: pct >= 100 ? 'var(--green)' : 'var(--amber)', fontFamily: 'monospace' }}>{local.salaryOffered}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>Target</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--muted)', fontFamily: 'monospace' }}>{local.salaryTarget}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--surface2)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', width: `${Math.min(pct, 100)}%`,
                background: pct >= 100 ? 'var(--green)' : pct >= 80 ? 'var(--amber)' : 'var(--red)',
                transition: 'width .6s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? 'var(--green)' : pct >= 80 ? 'var(--amber)' : 'var(--red)' }}>
              {pct}% of target {pct >= 100 ? '🎉' : pct >= 80 ? '— close' : '— negotiate'}
            </div>
          </div>
        ) : (
          <div className="mono" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 10, border: '1px dashed var(--border)', lineHeight: 2 }}>
            Add your target + offered CTC<br />to see offer comparison
          </div>
        )}
      </div>
    </div>
  )
}

// ── Generating Overlay ────────────────────────────────────────────────────

function GeneratingOverlay({ company }) {
  const [dots, setDots]   = useState(0)
  const [phase, setPhase] = useState(0)
  const phases = ['Analysing job description', 'Mapping your experience', 'Crafting bullet points', 'Tailoring for ' + company, 'Finalising layout']

  useEffect(() => {
    const d = setInterval(() => setDots(v => (v + 1) % 4), 400)
    const p = setInterval(() => setPhase(v => (v + 1) % phases.length), 2200)
    return () => { clearInterval(d); clearInterval(p) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(5,5,5,.95)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
    }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{ position: 'absolute', inset: 0,  borderRadius: '50%', border: '2px solid var(--amber)', opacity: 0.25, animation: 'pulse-ring 1.5s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '2px solid var(--amber)', opacity: 0.55, animation: 'pulse-ring 1.5s ease-out infinite 0.45s' }} />
        <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', background: 'var(--amber)', opacity: 0.9, animation: 'pulse-core 1.5s ease-in-out infinite' }} />
      </div>
      <div className="mono" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>✦ Generating Resume</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', minHeight: 18 }}>{phases[phase]}{'.'.repeat(dots)}</div>
      </div>
    </div>
  )
}

// ── Resume Modal ──────────────────────────────────────────────────────────

function ResumeModal({ html, company, onClose }) {
  const printResume = () => {
    const win = window.open('', '_blank')
    if (!win) { alert('Allow popups for this site to save as PDF.'); return }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${company} — Resume</title></head><body style="margin:0">${html}</body></html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.92)',
      display: 'flex', flexDirection: 'column',
      animation: 'modal-in .22s cubic-bezier(.4,0,.2,1)',
    }}>
      <div style={{
        padding: '12px 24px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        background: 'rgba(10,10,10,.8)',
      }}>
        <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          ✦ {company}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={printResume} className="mono jdv-btn" style={{
            padding: '6px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'var(--amber)', color: '#000', border: 'none',
          }}>↓ Save as PDF</button>
          <button onClick={onClose} className="jdv-btn" style={{
            background: 'none', border: '1px solid rgba(255,255,255,.15)',
            color: 'rgba(255,255,255,.5)', fontSize: 18, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '32px 0 48px' }}>
        <div style={{ boxShadow: '0 12px 60px rgba(0,0,0,.7)' }}>
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff">${html}</body></html>`}
            style={{ width: 595, height: 842, border: 'none', display: 'block' }}
            title="Resume fullscreen preview"
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
