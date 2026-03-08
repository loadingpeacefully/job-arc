import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import { isAuthenticated } from './utils/auth.js'
import './index.css'

function Root() {
  const [authed, setAuthed] = useState(() => isAuthenticated())

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return <App onLogout={() => setAuthed(false)} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
