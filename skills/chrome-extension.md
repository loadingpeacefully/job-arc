# Job Arc — Chrome Extension

> Load this when working on content.js, background.js, the extension-app bridge, or the extension indicator in Header.jsx.

---

## What the Extension Does

Injects a floating **"📌 Add to Job Arc"** button on any `linkedin.com/jobs/view/*` page. When clicked:

1. Expands the JD ("Show more") and waits 2.5s for full render
2. Extracts structured job data from the page DOM
3. Sends `{ type: 'ADD_JOB', job }` to the background service worker
4. Background finds/opens the job-arc tab and injects the job via `CustomEvent`
5. App receives the event, maps to job schema, saves to Supabase, shows ScanBanner

---

## File Responsibilities

### `content.js`
- Runs on `linkedin.com/jobs/view/*` at `document_idle`
- Injects floating button (once per URL — guards against SPA re-renders)
- `extractJob()` — DOM scraping logic (title, company, location, description, skills, insights, applyLink)
- `setHeartbeat()` — writes `job_arc_ext_heartbeat: 'true'` to the app's localStorage every time the extension is active, so the green indicator in Header.jsx lights up
- MutationObserver handles LinkedIn SPA navigation (re-injects button on URL change)

### `background.js`
- Service worker (Manifest V3)
- Listens for `ADD_JOB` message from content.js
- `findPmTrackerTab()` — checks both localhost:3000 and jobs-arc.vercel.app
- If tab found: `executeScript` to inject job via `injectJob()`
- If tab not found: opens `PM_TRACKER_URL` first, waits for load, then injects
- `injectJob()` — runs inside app tab: sets `localStorage.job_arc_incoming`, dispatches `CustomEvent('job_arc_job')`

### App.jsx bridge (in `useEffect`)
- Listens for `job_arc_job` CustomEvent
- Falls back to reading `localStorage.job_arc_incoming` if event detail is missing
- Maps raw extension data to job schema (parses "2 weeks ago" → YYYY-MM-DD, splits description into `keyRequirements[]`)
- If `jd_url` already exists → refreshes existing job (updates JD data, doesn't create duplicate)
- If new → calls `mergeJobs` → `upsertManyJobs` → `setJobs`

---

## Extension ↔ App Data Contract

The extension sends this raw object:

```js
{
  title: string,
  company: string,
  company_link: string,       // linkedin company page URL
  company_img_link: string,   // company logo img src
  location: string,
  jobUrl: string,             // linkedin job URL (no query params)
  applyLink: string,          // external apply URL or same as jobUrl
  postedDate: string,         // raw string e.g. "2 weeks ago"
  description: string,        // full JD plain text
  description_html: string,   // full JD HTML
  skills: string[],           // from "How you match" section
  insights: string[],         // seniority, type, company size from top card
}
```

App.jsx maps this to the job schema:
- `title` → `role`
- `jobUrl` or `applyLink` → `jd_url`
- `description.split('\n')` → `keyRequirements[]`
- `skills` → `tags[]`
- `insights.join(' · ')` → `notes`
- `postedDate` → parsed to `YYYY-MM-DD` (day/week/month offsets from today)
- `source: 'LinkedIn Extension'`

---

## Extension Indicator (Header.jsx)

```js
// Polls localStorage every 3 seconds
const check = () => setExtActive(localStorage.getItem('job_arc_ext_heartbeat') === 'true')
setInterval(check, 3000)
```

Shows green dot + "ext" label in header when active.

The heartbeat is set by `content.js` → `setHeartbeat()` which runs `executeScript` on the app tab to write the flag. It's a one-time write per page load, not continuous — the 3s polling means the indicator stays lit for up to 3s after the extension tab closes.

---

## Hardcoded URLs

Both files must stay in sync:

```js
// background.js
const APP_URLS = ['http://localhost:3000/', 'https://jobs-arc.vercel.app/']

// manifest.json host_permissions
"https://www.linkedin.com/jobs/view/*",
"http://localhost:3000/*",
"https://jobs-arc.vercel.app/*"
```

If the Vercel URL changes, update **both** files.

---

## Installing / Reloading the Extension

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. "Load unpacked" → select the `chrome-extension/` folder
4. After any change to `content.js` or `background.js` → click "↻" reload icon on the extension card
5. After any change to `manifest.json` → remove and re-add the extension

Content script changes also require refreshing the LinkedIn tab.

---

## Common Issues

**Button not appearing:**
- Check the URL matches `/jobs/view/` exactly (not `/jobs/search/`)
- LinkedIn SPA: navigate away and back, or hard refresh

**"Failed — is job-arc open?" error:**
- App tab must be open (localhost or vercel)
- If localhost, make sure `npm run dev` is running

**Job added but fields empty:**
- LinkedIn lazy-loads the JD — the 2.5s wait may not be enough on slow connections
- Check `extractJob()` selectors — LinkedIn changes their class names periodically

**Duplicate job created:**
- `jd_url` wasn't matching — check `applyLink` vs `jobUrl` used as dedup key
- If the job was previously added via a different URL format, dedup will miss it

---

## Extending the Extension

To extract new fields from LinkedIn:
1. Add extraction logic to `extractJob()` in `content.js`
2. Add the field to the raw object sent via `sendMessage`
3. Map it in the `job_arc_job` handler in `App.jsx`
4. Add it to the job schema in `SKILL.md`

Do not add Claude API calls inside content.js or background.js — all AI processing happens in the app after the job is received.
