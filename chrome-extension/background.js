// Job Arc — background service worker

const APP_URLS = ['http://localhost:3000/', 'https://jobs-arc.vercel.app/']
const PM_TRACKER_URL = APP_URLS[1]

function injectJob(job) {
  // This runs inside the job-arc tab's context
  localStorage.setItem('job_arc_incoming', JSON.stringify(job))
  window.dispatchEvent(new CustomEvent('job_arc_job', { detail: job }))
}

async function findPmTrackerTab() {
  for (const url of APP_URLS) {
    const tabs = await chrome.tabs.query({ url: url + '*' })
    if (tabs[0]) return tabs[0]
  }
  return null
}

async function openPmTrackerAndInject(job) {
  const tab = await chrome.tabs.create({ url: PM_TRACKER_URL })
  return new Promise((resolve) => {
    function onUpdated(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated)
        // Give the React app a moment to mount before injecting
        setTimeout(() => {
          chrome.tabs.get(tabId).then(t => {
            if (t.url && t.url.startsWith('chrome-error://')) return resolve(false)
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: injectJob,
              args: [job],
            }).then(() => resolve(true)).catch(() => resolve(false))
          }).catch(() => resolve(false))
        }, 1000)
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated)
  })
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'ADD_JOB') return false

  const job = msg.job

  ;(async () => {
    try {
      let tab = await findPmTrackerTab()

      if (tab) {
        // pm-tracker is open — check it's not showing an error page
        const tabInfo = await chrome.tabs.get(tab.id)
        if (tabInfo.status === 'complete' && !tabInfo.url.startsWith('chrome-error://')) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: injectJob,
              args: [job],
            })
            await chrome.tabs.update(tab.id, { active: true })
            await chrome.windows.update(tab.windowId, { focused: true })
            sendResponse({ ok: true })
          } catch {
            // Tab is broken — open a fresh one
            const ok = await openPmTrackerAndInject(job)
            sendResponse({ ok })
          }
        } else {
          // Tab is in error/loading state — navigate it to the app
          await chrome.tabs.update(tab.id, { url: PM_TRACKER_URL, active: true })
          const ok = await new Promise((resolve) => {
            function onUpdated(tabId, info) {
              if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(onUpdated)
                chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: injectJob,
                  args: [job],
                }).then(() => resolve(true)).catch(() => resolve(false))
              }
            }
            chrome.tabs.onUpdated.addListener(onUpdated)
          })
          sendResponse({ ok })
        }
      } else {
        // pm-tracker not open — open it first then inject
        const ok = await openPmTrackerAndInject(job)
        sendResponse({ ok })
      }
    } catch {
      // Final fallback — open a fresh tab and inject
      try {
        const ok = await openPmTrackerAndInject(job)
        sendResponse({ ok })
      } catch {
        sendResponse({ ok: false })
      }
    }
  })()

  return true // keep message channel open for async sendResponse
})
