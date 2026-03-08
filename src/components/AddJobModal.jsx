import { useState } from 'react'
import { COMPANIES, LEVELS } from '../constants'

export default function AddJobModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    company: '', role: '', level: 'Senior Product Manager',
    salary_band: '40LPA+ (estimated)', jd_url: '', posted_date: new Date().toISOString().slice(0,10),
    source: 'Manual', tags: '', status: 'Saved', notes: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.company.trim() && form.role.trim()

  const handleSubmit = () => {
    if (!valid) return
    onAdd({ ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), keyRequirements: [], learningTopics: [] })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', padding: 28, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', marginBottom: 20, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          // Add New Role
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row>
            <Field label="Company *">
              <input list="clist" value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Google" style={{ width: '100%', padding: '8px 10px' }} />
              <datalist id="clist">{COMPANIES.map(c => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Level">
              <select value={form.level} onChange={e => set('level', e.target.value)} style={{ width: '100%', padding: '8px 10px' }}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </Row>

          <Field label="Role Title *">
            <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Senior Product Manager – Search" style={{ width: '100%', padding: '8px 10px' }} />
          </Field>

          <Row>
            <Field label="Salary Band">
              <input value={form.salary_band} onChange={e => set('salary_band', e.target.value)} placeholder="e.g. 60–90 LPA" style={{ width: '100%', padding: '8px 10px' }} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ width: '100%', padding: '8px 10px' }}>
                {['Saved','Applied','Interview','Offer','Rejected','Withdrawn'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </Row>

          <Field label="JD URL">
            <input value={form.jd_url} onChange={e => set('jd_url', e.target.value)} placeholder="https://…" style={{ width: '100%', padding: '8px 10px' }} />
          </Field>

          <Row>
            <Field label="Source">
              <input value={form.source} onChange={e => set('source', e.target.value)} placeholder="LinkedIn, Referral, Careers page…" style={{ width: '100%', padding: '8px 10px' }} />
            </Field>
            <Field label="Posted Date">
              <input type="date" value={form.posted_date} onChange={e => set('posted_date', e.target.value)} style={{ width: '100%', padding: '8px 10px' }} />
            </Field>
          </Row>

          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Fintech, B2B, Growth, AI…" style={{ width: '100%', padding: '8px 10px' }} />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Referral, anything important…" style={{ width: '100%', padding: '8px 10px', resize: 'vertical', lineHeight: 1.5 }} />
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSubmit}
              disabled={!valid}
              className="mono"
              style={{
                flex: 1, padding: 10, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                border: `1px solid ${valid ? 'var(--amber)' : 'var(--border)'}`,
                background: valid ? 'transparent' : 'var(--surface2)',
                color: valid ? 'var(--amber)' : 'var(--muted)',
              }}
              onMouseEnter={e => { if (valid) { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' }}}
              onMouseLeave={e => { if (valid) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}}
            >Add Role</button>
            <button
              onClick={onClose}
              className="mono"
              style={{ flex: 1, padding: 10, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1 }}>
      <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 12 }}>{children}</div>
}
