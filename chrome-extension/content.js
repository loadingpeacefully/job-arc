// Job Arc — content script
// Runs on linkedin.com/jobs/view/* pages

(function () {
  // Avoid duplicate injection on SPA navigations
  if (document.getElementById('job-arc-btn')) return

  function extractJob() {
    // Primary source: document.title = "Lead PM - CoPilot | Pocket FM | LinkedIn"
    const parts = (document.title || '').split(' | ')
    const fromTitle = parts.length >= 3 && parts[parts.length - 1].trim() === 'LinkedIn'
    let title = fromTitle ? parts.slice(0, parts.length - 2).join(' | ').trim() : null
    let company = fromTitle ? parts[parts.length - 2].trim() : null

    // Override title with h1 if available (more precise, no " | LinkedIn" suffix needed)
    const h1 = document.querySelector('h1')
    if (h1 && h1.innerText && h1.innerText.trim()) {
      title = h1.innerText.trim()
    }

    // Location: first bullet element
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '[class*="workplace-type"]',
    ]
    let location = ''
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel)
      if (el && el.innerText.trim()) {
        location = el.innerText.trim()
        break
      }
    }

    const jobUrl = window.location.href.split('?')[0]

    return { title, company, location, jobUrl }
  }

  function setHeartbeat() {
    // Tell pm-tracker the extension is active
    try {
      chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => { localStorage.setItem('job_arc_ext_heartbeat', 'true') },
          }).catch(() => {})
        }
      })
    } catch (_) {}
  }

  function createButton() {
    const btn = document.createElement('button')
    btn.id = 'job-arc-btn'
    btn.innerText = '📌 Add to Job Arc'
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: '99999',
      padding: '10px 18px',
      background: 'rgba(5,5,5,0.96)',
      border: '1px solid #F5A623',
      color: '#F5A623',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      borderRadius: '2px',
      boxShadow: '0 0 16px rgba(245,166,35,0.2)',
      transition: 'all 0.15s ease',
    })

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#F5A623'
      btn.style.color = '#000'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(5,5,5,0.96)'
      btn.style.color = '#F5A623'
    })

    btn.addEventListener('click', () => {
      const job = extractJob()
      if (!job.title || !job.company) {
        btn.innerText = '⚠ Could not extract job'
        setTimeout(() => { btn.innerText = '📌 Add to Job Arc' }, 2000)
        return
      }

      btn.innerText = '⟳ Adding…'
      btn.disabled = true

      chrome.runtime.sendMessage({ type: 'ADD_JOB', job }, (response) => {
        if (response && response.ok) {
          btn.innerText = '✓ Added!'
          btn.style.borderColor = '#39FF14'
          btn.style.color = '#39FF14'
          btn.style.background = 'rgba(5,5,5,0.96)'
          setTimeout(() => {
            btn.innerText = '📌 Add to Job Arc'
            btn.style.borderColor = '#F5A623'
            btn.style.color = '#F5A623'
            btn.disabled = false
          }, 2500)
        } else {
          btn.innerText = '✗ Failed — is job-arc open?'
          btn.style.borderColor = '#FF4444'
          btn.style.color = '#FF4444'
          btn.disabled = false
          setTimeout(() => {
            btn.innerText = '📌 Add to Job Arc'
            btn.style.borderColor = '#F5A623'
            btn.style.color = '#F5A623'
          }, 3000)
        }
      })
    })

    return btn
  }

  // Inject button once page has settled (LinkedIn SPA can be slow)
  function init() {
    if (document.getElementById('job-arc-btn')) return
    document.body.appendChild(createButton())
    setHeartbeat()
  }

  // Initial load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 800)
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 800))
  }

  // LinkedIn SPA: re-inject on URL change
  let lastUrl = location.href
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      const old = document.getElementById('job-arc-btn')
      if (old) old.remove()
      if (location.href.includes('/jobs/view/')) {
        setTimeout(init, 1200)
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
})()
