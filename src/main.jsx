import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import { isAuthenticated } from './utils/auth.js'
import './index.css'

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#F85149', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: 'monospace' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Runtime Error — check console</div>
          <pre style={{ fontSize: 11, color: '#d1d1d1', whiteSpace: 'pre-wrap', maxWidth: 700 }}>{this.state.error.message}{'\n\n'}{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function Root() {
  const [authed, setAuthed] = useState(() => isAuthenticated())

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return <App onLogout={() => setAuthed(false)} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
)
