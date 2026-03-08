const SESSION_KEY = 'job_arc_session'
const SESSION_TOKEN = 'pmt_auth_v1_ok'

// Credentials (personal tool — not security-critical)
const VALID_USERNAME = 'suneet'
const VALID_PASSWORD = 'pmtrack@26'

export function checkCredentials(username, password) {
  return username.trim() === VALID_USERNAME && password === VALID_PASSWORD
}

export function saveSession() {
  localStorage.setItem(SESSION_KEY, SESSION_TOKEN)
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === SESSION_TOKEN
}
