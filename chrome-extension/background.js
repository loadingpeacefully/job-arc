// PM Tracker — background service worker

const PM_TRACKER_URL = 'http://localhost:3000/'

function injectJob(job) {
  // This runs inside the pm-tracker tab's context
  localStorage.setItem('pm_tracker_incoming', JSON.stringify(job))
  window.dispatchEvent(new CustomEvent('pm_tracker_job', { detail: job }))
}

async function findPmTrackerTab() {
  const tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' })
  return tabs[0] || null
}

async function openPmTrackerAndInject(job) {
  const tab = await chrome.tabs.create({ url: PM_TRACKER_URL })
  // Wait for the tab to fully load before injecting
  return new Promise((resolve) => {
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
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'ADD_JOB') return false

  const job = msg.job

  ;(async () => {
    try {
      let tab = await findPmTrackerTab()

      if (tab) {
        // pm-tracker is open — inject directly
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: injectJob,
          args: [job],
        })
        // Focus the pm-tracker tab so user can see the confirmation
        await chrome.tabs.update(tab.id, { active: true })
        await chrome.windows.update(tab.windowId, { focused: true })
        sendResponse({ ok: true })
      } else {
        // pm-tracker not open — open it first then inject
        const ok = await openPmTrackerAndInject(job)
        sendResponse({ ok })
      }
    } catch (err) {
      console.error('PM Tracker background error:', err)
      sendResponse({ ok: false, error: err.message })
    }
  })()

  return true // keep message channel open for async sendResponse
})
