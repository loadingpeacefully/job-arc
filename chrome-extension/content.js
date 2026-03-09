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

    // Override title with h1 if available (more precise)
    const h1 = document.querySelector('h1')
    if (h1 && h1.innerText && h1.innerText.trim()) {
      title = h1.innerText.trim()
    }

    // Company name from dedicated element
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a, ' +
      '.job-details-jobs-unified-top-card__company-name, ' +
      '[class*="topcard__org-name"] a, [class*="topcard__org-name"]'
    )
    if (companyEl && companyEl.innerText.trim()) {
      company = companyEl.innerText.trim()
    }

    // Location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '[class*="workplace-type"]',
      '[class*="topcard__flavor--bullet"]',
    ]
    let location = ''
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel)
      if (el && el.innerText.trim()) { location = el.innerText.trim(); break }
    }

    // Posted date
    let postedDate = ''
    const dateEl = document.querySelector(
      '.job-details-jobs-unified-top-card__posted-date, ' +
      '[class*="posted-date"], ' +
      '.jobs-unified-top-card__posted-date'
    )
    if (dateEl) postedDate = dateEl.innerText.trim()

    // Full job description — try multiple selectors in order of specificity
    let description = ''
    let description_html = ''
    const descSelectors = [
      '.jobs-description',
      '#job-details',
      '[class*="jobs-description__container"]',
      '[class*="jobs-description__content"]',
      '[class*="jobs-description-content"]',
      '[class*="description__text"]',
      '.jobs-box__html-content',
      '[class*="jobs-box"]',
      'article[class*="jobs"]',
      '.scaffold-layout__detail article',
      '[class*="job-view-layout"] section',
    ]
    for (const sel of descSelectors) {
      const el = document.querySelector(sel)
      if (el && el.innerText && el.innerText.trim().length > 50) {
        description = el.innerText.trim()
        description_html = el.innerHTML
        break
      }
    }
    // Last resort: find heading then grab parent section
    if (!description) {
      const headings = [...document.querySelectorAll('h2, h3')]
      const aboutHeading = headings.find(h => /about the job|job description|about this role/i.test(h.innerText))
      if (aboutHeading) {
        const section = aboutHeading.closest('section') || aboutHeading.parentElement
        if (section) description = section.innerText.replace(aboutHeading.innerText, '').trim()
      }
    }
    // Nuclear fallback: find the smallest div/section/article with 1000-15000 chars that isn't nav
    // Minimum 1000 chars excludes LinkedIn's applicant stats sidebar (~400 chars)
    if (!description) {
      const candidate = [...document.querySelectorAll('div, section, article')]
        .filter(el => {
          const t = (el.innerText || '').trim()
          return t.length >= 1000 && t.length <= 15000 && !el.querySelector('nav, header')
        })
        .sort((a, b) => a.innerText.length - b.innerText.length)[0]
      if (candidate) {
        description = candidate.innerText.trim()
        description_html = candidate.innerHTML
      }
    }

    // Skills listed on the page
    const skillEls = document.querySelectorAll(
      '.job-details-how-you-match__skills-item-subtitle, ' +
      '[class*="job-details-skill-match-status-list"] li, ' +
      '[class*="job-details-how-you-match"] [class*="skill"] span, ' +
      '.job-details-skill-match-status-list__unmatched-item span, ' +
      '[class*="skills-match"] li'
    )
    const skills = [...skillEls]
      .map(el => el.innerText.trim())
      .filter(s => s.length > 1 && s.length < 60)

    // LinkedIn insights (seniority, employment type, company size) — restricted to top card only
    const insightEls = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__container--two-pane li span, ' +
      '.job-details-jobs-unified-top-card__job-insight span, ' +
      '[class*="job-details-jobs-unified-top-card"] [class*="job-insight"] span'
    )
    const insights = [...insightEls]
      .map(el => el.innerText.trim())
      .filter(s => s.length > 1)

    // Apply link (external) or LinkedIn URL for Easy Apply
    let applyLink = window.location.href.split('?')[0]
    const applyBtn = document.querySelector('.jobs-apply-button--top-card')
    if (applyBtn) {
      const href = applyBtn.getAttribute('href')
      if (href && href.startsWith('http') && !href.includes('linkedin.com')) {
        applyLink = href
      }
    }

    const jobUrl = window.location.href.split('?')[0]

    // Company LinkedIn page link and logo
    const companyLinkEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a')
    const company_link = companyLinkEl ? companyLinkEl.href.split('?')[0] : ''
    const company_img_link = document.querySelector('.jobs-unified-top-card img, [class*="top-card"] img')?.src || ''

    return { title, company, company_link, company_img_link, location, jobUrl, postedDate, description, description_html, skills, insights, applyLink }
  }

  function setHeartbeat() {
    // Tell pm-tracker the extension is active
    try {
      chrome.tabs.query({ url: ['http://localhost:3000/*', 'https://jobs-arc.vercel.app/*'] }, (tabs) => {
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
      let job = extractJob()
      if (!job.title || !job.company) {
        btn.innerText = '⚠ Could not extract job'
        setTimeout(() => { btn.innerText = '📌 Add to Job Arc' }, 2000)
        return
      }

      btn.innerText = '⟳ Loading JD…'
      btn.disabled = true

      // Scroll to the description section to force LinkedIn to render lazy-loaded content
      const triggerEl = document.querySelector('#job-details, .jobs-description, [class*="jobs-description"], [class*="job-details"]')
      if (triggerEl) triggerEl.scrollIntoView({ behavior: 'instant', block: 'start' })

      // Wait 2s for LinkedIn to render the lazy-loaded description, then extract and send
      setTimeout(() => {
        const extracted = extractJob()
        chrome.runtime.sendMessage({ type: 'ADD_JOB', job: extracted }, (response) => {
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
      }, 2000)
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
