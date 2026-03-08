import { useState } from 'react'
import { checkCredentials, saveSession } from '../utils/auth'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Small delay for UX feel
    setTimeout(() => {
      if (checkCredentials(username, password)) {
        saveSession()
        onLogin()
      } else {
        setError('Invalid credentials.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} className="grid-bg">
      <div className="scanline" />

      <div className="animate-fade" style={{ width: 360, maxWidth: '90vw' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
              <div className="ping" style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'rgba(57,255,20,0.15)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 8px #39FF14' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#d1d1d1', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              JOB<span style={{ color: '#39FF14' }}>.ARC</span><span className="cursor-blink" style={{ color: '#39FF14' }}>_</span>
            </div>
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            track every application · auth required
          </div>
        </div>

        {/* Login card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', padding: '28px 28px 24px' }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 22 }}>
            // Authenticate
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(null) }}
                placeholder="username"
                style={{ width: '100%', padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="mono" style={{ display: 'block', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••••"
                  style={{ flex: 1, padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13 }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mono" style={{ fontSize: 9, color: 'var(--red)', marginBottom: 14, letterSpacing: '0.06em' }}>
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="mono"
              style={{
                width: '100%', padding: '10px', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                border: '1px solid var(--amber)', background: 'transparent', color: 'var(--amber)',
                opacity: (!username || !password) ? 0.4 : 1,
                cursor: (!username || !password) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading && username && password) { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}
            >
              {loading ? '⟳ Authenticating…' : '→ Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
