import { useState } from 'react'
import { LINKEDIN_SCRAPER_SNIPPET, LINKEDIN_SINGLE_JOB_SNIPPET, parseLinkedInClipboard } from '../utils/linkedinScraper'

export default function SettingsModal({ settings, onSave, onClose, onExport, onImport, onLinkedInPaste }) {
  const [local, setLocal] = useState(settings)
  const [showKey, setShowKey] = useState(false)
  const [snippetCopied, setSnippetCopied] = useState(null) // 'batch' | 'single' | null
  const [pasteText, setPasteText] = useState('')
  const [pasteStatus, setPasteStatus] = useState(null)
  const set = (k, v) => setLocal(l => ({ ...l, [k]: v }))

  async function handleCopySnippet(which) {
    const text = which === 'single' ? LINKEDIN_SINGLE_JOB_SNIPPET : LINKEDIN_SCRAPER_SNIPPET
    try {
      await navigator.clipboard.writeText(text)
      setSnippetCopied(which)
      setTimeout(() => setSnippetCopied(null), 2000)
    } catch {
      setPasteStatus({ type: 'error', text: 'Could not copy — select the snippet text manually.' })
    }
  }

  function handleImportJobs() {
    if (!pasteText.trim()) {
      setPasteStatus({ type: 'error', text: 'Paste the JSON from console first.' })
      return
    }
    try {
      const parsed = parseLinkedInClipboard(pasteText)
      if (!parsed.length) {
        setPasteStatus({ type: 'error', text: 'No valid jobs found in pasted text.' })
        return
      }
      onLinkedInPaste(parsed)
      setPasteText('')
      setPasteStatus({ type: 'success', text: `✅ ${parsed.length} job${parsed.length !== 1 ? 's' : ''} imported.` })
    } catch (err) {
      setPasteStatus({ type: 'error', text: err.message || 'Could not parse JSON.' })
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', padding: 28, width: 480, maxWidth: '95vw' }}>

        <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', marginBottom: 22, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          // Settings
        </div>

        <Section title="Profile">
          <Field label="Your Name">
            <input value={local.userName} onChange={e => set('userName', e.target.value)} placeholder="e.g. Rahul Sharma" style={{ width: '100%', padding: '8px 10px' }} />
          </Field>
        </Section>

        <Section title="Anthropic API Key (for Live Scan)">
          <p className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.7, letterSpacing: '0.02em' }}>
            Stored only in your browser's localStorage. Never sent anywhere except directly to Anthropic's API.{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com ↗</a>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={local.apiKey}
              onChange={e => set('apiKey', e.target.value)}
              placeholder="sk-ant-…"
              style={{ flex: 1, padding: '8px 10px' }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12 }}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
        </Section>

        <Section title="LinkedIn Import">
          {/* Single job snippet */}
          <div className="mono" style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Single Job — any linkedin.com/jobs/view/ page</div>
          <p className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 6, lineHeight: 1.7 }}>
            Open any job on LinkedIn → F12 → Console → paste → copy the JSON line printed → paste below.
          </p>
          <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px 10px', overflow: 'auto', maxHeight: 52, margin: '0 0 6px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {LINKEDIN_SINGLE_JOB_SNIPPET.slice(0, 160)}…
          </pre>
          <button onClick={() => handleCopySnippet('single')} className="mono" style={{ width: '100%', padding: '6px', marginBottom: 14, background: snippetCopied === 'single' ? 'rgba(57,255,20,0.08)' : 'transparent', border: `1px solid ${snippetCopied === 'single' ? 'var(--amber)' : 'var(--border)'}`, color: snippetCopied === 'single' ? 'var(--amber)' : 'var(--muted)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {snippetCopied === 'single' ? '✓ Copied!' : '⎘ Copy Single-Job Snippet'}
          </button>

          {/* Batch snippet */}
          <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Batch — linkedin.com/jobs-tracker/ page</div>
          <p className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 6, lineHeight: 1.7 }}>
            Open jobs-tracker → scroll all the way down → F12 → Console → paste → copy the JSON line → paste below.
          </p>
          <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px 10px', overflow: 'auto', maxHeight: 52, margin: '0 0 6px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {LINKEDIN_SCRAPER_SNIPPET.slice(0, 160)}…
          </pre>
          <button onClick={() => handleCopySnippet('batch')} className="mono" style={{ width: '100%', padding: '6px', marginBottom: 14, background: snippetCopied === 'batch' ? 'rgba(57,255,20,0.08)' : 'transparent', border: `1px solid ${snippetCopied === 'batch' ? 'var(--amber)' : 'var(--border)'}`, color: snippetCopied === 'batch' ? 'var(--amber)' : 'var(--muted)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {snippetCopied === 'batch' ? '✓ Copied!' : '⎘ Copy Batch Snippet'}
          </button>
          <textarea
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setPasteStatus(null) }}
            placeholder={'Paste JSON from console here…\n[{"title":"…","company":"…",…}]'}
            rows={4}
            style={{
              width: '100%', padding: '8px 10px', resize: 'vertical',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              lineHeight: 1.5, color: 'var(--text)', background: 'var(--surface2)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={handleImportJobs}
            className="mono"
            style={{ width: '100%', marginTop: 8, padding: '8px', background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.3)', color: 'var(--amber)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            ⬇ Import Jobs
          </button>
          {pasteStatus && (
            <p className="mono" style={{ fontSize: 9, marginTop: 8, letterSpacing: '0.04em', color: pasteStatus.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
              {pasteStatus.text}
            </p>
          )}
        </Section>

        <Section title="Data Management">
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onExport}
              className="mono"
              style={{ flex: 1, padding: '8px', background: 'var(--blue-bg)', border: '1px solid rgba(88,166,255,0.25)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              ⬇ Export JSON
            </button>
            <label
              className="mono"
              style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'block', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              ⬆ Import JSON
              <input type="file" accept=".json" onChange={e => { if (e.target.files[0]) onImport(e.target.files[0]) }} style={{ display: 'none' }} />
            </label>
          </div>
          <p className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 8, letterSpacing: '0.04em' }}>Export saves all jobs + settings to a .json file you can re-import anytime.</p>
        </Section>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => onSave(local)}
            className="mono"
            style={{ flex: 1, padding: 10, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--amber)', background: 'transparent', color: 'var(--amber)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}
          >
            Save Settings
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
