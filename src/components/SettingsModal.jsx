import { useState } from 'react'

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState(settings)
  const [showKey, setShowKey] = useState(false)
  const set = (k, v) => setLocal(l => ({ ...l, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', padding: 28, width: 440, maxWidth: '95vw' }}>

        <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', marginBottom: 22, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          // Settings
        </div>

        <Section title="Profile">
          <Field label="Name">
            <input value={local.userName || ''} onChange={e => set('userName', e.target.value)} placeholder="e.g. Suneet Jagdev" style={{ width: '100%', padding: '8px 10px' }} />
          </Field>
          <Field label="Bio">
            <textarea value={local.bio || ''} onChange={e => set('bio', e.target.value)} placeholder="2–3 sentences about yourself" rows={3} style={{ width: '100%', padding: '8px 10px', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
          </Field>
          <Field label="Profile Image URL">
            <input value={local.profileImage || ''} onChange={e => set('profileImage', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px 10px' }} />
          </Field>
          <Field label="LinkedIn URL">
            <input value={local.linkedinUrl || ''} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." style={{ width: '100%', padding: '8px 10px' }} />
          </Field>
          <Field label="GitHub URL">
            <input value={local.githubUrl || ''} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." style={{ width: '100%', padding: '8px 10px' }} />
          </Field>
        </Section>

        <Section title="Anthropic API Key">
          <p className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.7, letterSpacing: '0.02em' }}>
            Stored only in your browser's localStorage. Never sent anywhere except directly to Anthropic's API.{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com ↗</a>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={local.apiKey || ''}
              onChange={e => set('apiKey', e.target.value)}
              placeholder="sk-ant-…"
              style={{ flex: 1, padding: '8px 10px' }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12 }}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
        </Section>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => onSave(local)}
            className="mono"
            style={{ flex: 1, padding: 10, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--amber)', background: 'transparent', color: 'var(--amber)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="mono"
            style={{ flex: 1, padding: 10, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>// {title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}
