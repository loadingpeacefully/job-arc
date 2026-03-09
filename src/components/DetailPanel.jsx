import { useState, useEffect } from 'react'
import { STATUS, INTERVIEW_TYPES, LEVELS } from '../constants'
import { newInterviewRound } from '../utils/jobUtils'

const TABS = ['Overview', 'Application', 'Interviews', 'Resume', 'Salary']

export default function DetailPanel({ job, onUpdate, onDelete, onClose, onVerify, verifying, onGenerateResume, generatingResume }) {
  const [local, setLocal] = useState(job)
  const [tab, setTab] = useState('Overview')
  const [dirty, setDirty] = useState(false)

  useEffect(() => { setLocal(job); setDirty(false); setTab('Overview') }, [job.id])
  // Sync fields that change from external actions (Verify) without resetting user edits
  useEffect(() => {
    setLocal(l => ({
      ...l,
      verified: job.verified,
      canonicalUrl: job.canonicalUrl,
      verifiedAt: job.verifiedAt,
      salary_verified: job.salary_verified,
      salary_source: job.salary_source,
      salary_confirmed: job.salary_confirmed,
      salary_band: job.salary_band,
    }))
  }, [job.verified, job.salary_band])

  const set = (key, val) => {
    setLocal(l => ({ ...l, [key]: val }))
    setDirty(true)
  }
  const save = () => { onUpdate(local); setDirty(false) }

  const cfg = STATUS[local.status]

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      overflow: 'hidden',
      position: 'sticky', top: 80,
      maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{local.company}</div>
            <div className="mono" style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{local.role}</div>
            {(local.location || local.source) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {local.location && <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.05em' }}>📍 {local.location}</span>}
                {local.source && <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.05em', background: 'var(--surface)', padding: '1px 6px', border: '1px solid var(--border)' }}>{local.source}</span>}
                {local.posted_date && <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.05em' }}>{local.posted_date}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, padding: 2, marginLeft: 8, lineHeight: 1 }}>×</button>
        </div>

        {/* Status selector */}
        <div style={{ marginTop: 12, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(STATUS).map(([s, c]) => (
            <button key={s} onClick={() => set('status', s)} className="mono" style={{
              padding: '3px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              border: `1px solid ${local.status === s ? c.color : 'var(--border)'}`,
              background: local.status === s ? c.bg : 'transparent',
              color: local.status === s ? c.color : 'var(--muted)',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className="mono" style={{
            flex: 1, padding: '8px 6px', border: 'none', fontSize: 8.5, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'transparent',
            color: tab === t ? 'var(--amber)' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {tab === 'Overview' && <OverviewTab local={local} set={set} onVerify={onVerify} verifying={verifying} />}
        {tab === 'Application' && <ApplicationTab local={local} set={set} />}
        {tab === 'Interviews' && <InterviewsTab local={local} set={set} />}
        {tab === 'Resume' && <ResumeTab local={local} set={set} onGenerateResume={onGenerateResume} generatingResume={generatingResume} />}
        {tab === 'Salary' && <SalaryTab local={local} set={set} />}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {local.jd_url && (
          <a href={local.jd_url} target="_blank" rel="noopener noreferrer" className="mono" style={{
            flex: 1, padding: '7px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--blue)',
            textAlign: 'center', textDecoration: 'none',
          }}>View JD ↗</a>
        )}
        <button onClick={save} disabled={!dirty} className="mono" style={{
          flex: 2, padding: '7px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: dirty ? 'var(--amber)' : 'var(--surface2)',
          color: dirty ? '#000' : 'var(--muted)',
          border: dirty ? '1px solid var(--amber)' : '1px solid var(--border)',
        }}>
          {dirty ? 'Save Changes' : 'Saved ✓'}
        </button>
        <button onClick={() => { if (confirm(`Delete "${local.company}" role?`)) onDelete() }} className="mono" style={{
          padding: '7px 10px', fontSize: 9, letterSpacing: '0.08em',
          background: 'transparent', border: '1px solid rgba(248,81,73,0.3)', color: 'var(--red)',
        }}>DEL</button>
      </div>
    </div>
  )
}

// ---- Sub-tab components ----

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, mono }) {
  return (
    <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: '100%', padding: '7px 10px', resize: 'vertical', lineHeight: 1.6, fontSize: 12 }} />
  )
}

function OverviewTab({ local, set, onVerify, verifying }) {
  const verifyStatus = local.verified === true ? 'verified' : local.verified === false ? 'not-found' : 'unchecked'
  const verifyColor = verifyStatus === 'verified' ? 'var(--green)' : verifyStatus === 'not-found' ? 'var(--red)' : 'var(--muted)'

  return (
    <>
      {/* Authenticity verification block */}
      <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: verifyStatus !== 'unchecked' ? 6 : 0 }}>
          <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>// Authenticity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {verifyStatus !== 'unchecked' && (
              <span className="mono" style={{ fontSize: 9, color: verifyColor, letterSpacing: '0.06em' }}>
                {verifyStatus === 'verified' ? '✓ Verified' : '✗ Not Found'}
              </span>
            )}
            {onVerify && (
              <button
                onClick={() => onVerify(local.id)}
                disabled={verifying}
                className="mono"
                style={{ padding: '3px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--border)', color: verifying ? 'var(--muted)' : 'var(--amber)' }}
              >
                {verifying ? '…' : verifyStatus === 'unchecked' ? 'Verify ↗' : 'Re-verify'}
              </button>
            )}
          </div>
        </div>
        {local.canonicalUrl && (
          <a href={local.canonicalUrl} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.04em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
            ↗ {local.canonicalUrl}
          </a>
        )}
        {local.salary_verified && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.04em' }}>{local.salary_verified}</span>
            {local.salary_source && (
              <span className="mono" style={{ fontSize: 9, color: local.salary_confirmed ? 'var(--green)' : 'var(--muted)', letterSpacing: '0.06em', padding: '1px 6px', border: `1px solid ${local.salary_confirmed ? 'var(--green)30' : 'var(--border)'}`, background: local.salary_confirmed ? 'var(--green-bg)' : 'transparent' }}>
                {local.salary_confirmed ? '✓ ' : ''}{local.salary_source}
              </span>
            )}
          </div>
        )}
        {local.verifiedAt && (
          <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.04em', display: 'block', marginTop: 4 }}>checked {local.verifiedAt}</span>
        )}
      </div>

      <Field label="Company"><TextInput value={local.company} onChange={v => set('company', v)} /></Field>
      <Field label="Role Title"><TextInput value={local.role} onChange={v => set('role', v)} /></Field>
      <Field label="Level">
        <select value={local.level} onChange={e => set('level', e.target.value)} style={{ width: '100%', padding: '7px 10px' }}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Salary Band"><TextInput value={local.salary_band} onChange={v => set('salary_band', v)} placeholder="Populated from Verify, or enter manually" mono /></Field>
      <Field label="Tags (comma-separated)">
        <TextInput value={(local.tags || []).join(', ')} onChange={v => set('tags', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Fintech, B2B, Growth" />
      </Field>
      <Field label="Key Requirements (one per line)">
        <Textarea
          value={(local.keyRequirements || []).join('\n')}
          onChange={v => set('keyRequirements', v.split('\n').map(s => s.trim()).filter(Boolean))}
          placeholder="e.g. 5+ yrs PM experience&#10;Data-driven decisions&#10;Cross-functional leadership"
          rows={5}
        />
      </Field>
      <Field label="Notes"><Textarea value={local.notes} onChange={v => set('notes', v)} placeholder="Anything important about this role…" /></Field>
    </>
  )
}

function ApplicationTab({ local, set }) {
  return (
    <>
      <Field label="Applied Date">
        <input type="date" value={local.appliedDate || ''} onChange={e => set('appliedDate', e.target.value)}
          style={{ width: '100%', padding: '7px 10px' }} />
      </Field>
      <Field label="Resume Version / Filename">
        <TextInput value={local.resume} onChange={v => set('resume', v)} placeholder="e.g. Resume_v3_Fintech.pdf" mono />
      </Field>
      <Field label="Cover Letter Filename">
        <TextInput value={local.coverLetter} onChange={v => set('coverLetter', v)} placeholder="e.g. CL_Google.pdf" mono />
      </Field>
      <Field label="Referral Contact Name">
        <TextInput value={local.referralContact} onChange={v => set('referralContact', v)} placeholder="e.g. Priya Sharma" />
      </Field>
      <Field label="Referral Email">
        <TextInput value={local.referralEmail} onChange={v => set('referralEmail', v)} placeholder="priya@company.com" mono />
      </Field>
    </>
  )
}

function InterviewsTab({ local, set }) {
  const rounds = local.interviewRounds || []

  const addRound = () => set('interviewRounds', [...rounds, newInterviewRound()])
  const updateRound = (id, updates) => set('interviewRounds', rounds.map(r => r.id === id ? { ...r, ...updates } : r))
  const deleteRound = (id) => set('interviewRounds', rounds.filter(r => r.id !== id))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>{rounds.length} round{rounds.length !== 1 ? 's' : ''} logged</span>
        <button onClick={addRound} className="mono" style={{ padding: '4px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber)30' }}>
          + Add Round
        </button>
      </div>

      {rounds.length === 0 && (
        <div className="mono" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', border: '1px dashed var(--border)' }}>
          no rounds yet — click "+ add round" to log one
        </div>
      )}

      {rounds.map((r, i) => (
        <div key={r.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Round {i + 1}</span>
            <button onClick={() => deleteRound(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Field label="Type">
              <select value={r.type} onChange={e => updateRound(r.id, { type: e.target.value })} style={{ width: '100%', padding: '6px 8px', fontSize: 11 }}>
                {INTERVIEW_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={r.date} onChange={e => updateRound(r.id, { date: e.target.value })} style={{ width: '100%', padding: '6px 8px', fontSize: 11 }} />
            </Field>
          </div>
          <Field label="Outcome">
            <div style={{ display: 'flex', gap: 5 }}>
              {['Pending', 'Pass', 'Fail'].map(o => (
                <button key={o} onClick={() => updateRound(r.id, { outcome: o })} className="mono" style={{
                  padding: '3px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: r.outcome === o ? (o === 'Pass' ? 'var(--green-bg)' : o === 'Fail' ? 'var(--red-bg)' : 'var(--surface2)') : 'transparent',
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
      ))}
    </>
  )
}

function ResumeTab({ local, set, onGenerateResume, generatingResume }) {
  const hasResume = !!local.resumeHtml

  const downloadResume = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${local.company} — Resume</title></head><body>${local.resumeHtml}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Resume_${local.company.replace(/[^a-z0-9]/gi, '_')}.html`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>// Tailored Resume</div>
        <p className="mono" style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 12px' }}>
          Generates a resume tailored to this specific role using your profile and the job description. Download as HTML → open in browser → print to PDF.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onGenerateResume && onGenerateResume(local.id)}
            disabled={generatingResume}
            className="mono"
            style={{
              flex: 1, padding: '8px 12px', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: generatingResume ? 'var(--surface2)' : 'var(--amber-bg)',
              color: generatingResume ? 'var(--muted)' : 'var(--amber)',
              border: `1px solid ${generatingResume ? 'var(--border)' : 'var(--amber)30'}`,
            }}
          >
            {generatingResume ? '⟳ Generating…' : hasResume ? '↺ Regenerate' : '✦ Generate Resume'}
          </button>
          {hasResume && (
            <button
              onClick={downloadResume}
              className="mono"
              style={{
                flex: 1, padding: '8px 12px', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'var(--surface2)',
                color: 'var(--blue)',
                border: '1px solid var(--border)',
              }}
            >
              ↓ Download .html
            </button>
          )}
        </div>
      </div>

      {hasResume && (
        <div style={{ border: '1px solid var(--border)', background: '#fff', overflow: 'hidden' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Preview
          </div>
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff">${local.resumeHtml}</body></html>`}
            style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
            title="Resume preview"
          />
        </div>
      )}

      {!hasResume && !generatingResume && (
        <div className="mono" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', border: '1px dashed var(--border)' }}>
          no resume generated yet
        </div>
      )}
    </>
  )
}

function SalaryTab({ local, set }) {
  return (
    <>
      <Field label="Posted Salary Band">
        <TextInput value={local.salary_band} onChange={v => set('salary_band', v)} placeholder="e.g. 60–90 LPA" mono />
      </Field>
      <Field label="Your Target (CTC)">
        <TextInput value={local.salaryTarget} onChange={v => set('salaryTarget', v)} placeholder="e.g. 90 LPA" mono />
      </Field>
      <Field label="Offered CTC">
        <TextInput value={local.salaryOffered} onChange={v => set('salaryOffered', v)} placeholder="Fill after offer received" mono />
      </Field>
      <Field label="Negotiation Notes">
        <Textarea
          value={local.negotiationNotes}
          onChange={v => set('negotiationNotes', v)}
          placeholder="Counter-offer strategy, ESOP details, joining bonus, notice buy-out…"
          rows={5}
        />
      </Field>

      {local.salaryOffered && local.salaryTarget && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(63,185,80,0.25)', padding: 12, marginTop: 8 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>// Offer vs Target</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            Offered: <span style={{ color: 'var(--green)' }}>{local.salaryOffered}</span>
            {' '} · Target: <span style={{ color: 'var(--amber)' }}>{local.salaryTarget}</span>
          </div>
        </div>
      )}
    </>
  )
}
