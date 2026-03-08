---
name: pm-tracker
description: >
  Context, architecture, and product expectations for pm-tracker — a personal PM job application tracker.
  Invoke when adding views, features, integrations, or modifying the data model.
---

# PM Tracker — Skill File

---

## 1. Product Intent

A **single-user, offline-first** job application tracker for a Senior PM searching for roles in Bengaluru (40LPA+). The product has two jobs:

1. **Discovery** — find real, open PM roles (via Claude AI web search, LinkedIn import, or manual entry)
2. **Tracking** — manage the full application lifecycle: saved → applied → interview rounds → offer/reject, with prep notes, salary negotiation, and learning topics per role

**Who uses it:** One person (the owner). No auth, no multi-user, no sharing. Optimize for speed and density of information, not onboarding UX.

**North star:** The user should be able to open this app every morning and immediately know: what's active, what needs action today, and what new roles to pursue.

---

## 2. Architecture

### Why no backend

All data lives in `localStorage`. No server, no database, no auth. This is intentional — the app is private, personal, and should work offline. The tradeoff is a ~5MB storage cap (more than enough for hundreds of job records) and no cross-device sync.

### State architecture

```
localStorage (persistent)
    ↕ load on mount / save on change
App.jsx (single source of truth)
    ├── jobs[]          — all job records
    ├── settings{}      — API key, user name, preferences
    └── lastScan        — ISO timestamp of last Claude scan
    ↓ props
Child components (read-only views + local form state)
    └── DetailPanel has local state for edits (dirty tracking)
        └── onUpdate() → propagates up to App.jsx → saves to localStorage
```

**Rule:** State never lives below App.jsx except for local UI state (form fields, open/closed, active tab). No context, no Zustand, no Redux.

### Data flow for any new integration

```
External source (LinkedIn, console scraper, API, etc.)
    ↓
Parse → map to job schema using newJob(overrides)
    ↓
Deduplicate via mergeJobs(existing, incoming)   ← always
    ↓
setJobs(merged) in App.jsx
    ↓
useEffect saves to localStorage automatically
    ↓
ScanBanner shows result: "{n} roles added"
```

### Notification pattern

All async feedback (scan results, import success, errors) goes through `ScanBanner` via `setScanMsg({ type: 'success'|'error'|'info', text: '...' })` in App.jsx. Never use `alert()`. Never render inline error state in child components — bubble it up.

### Adding a new tab/view

1. Add tab name to `['board', 'pipeline', 'analytics']` array in `Header.jsx`
2. Add `{tab === 'newtab' && <NewView jobs={jobs} />}` block in `App.jsx`
3. Create `src/components/NewView.jsx`
4. New views receive `jobs` (filtered or full) as props — they don't read localStorage directly

### Adding a new external data source

1. Create `src/utils/{source}Import.js` — exports a `parse{Source}(input)` → `Job[]` function
2. Always call `newJob(overrides)` per record to fill in missing fields with defaults
3. Always call `mergeJobs(existing, parsed)` before setting state
4. Expose the trigger in `SettingsModal.jsx` or as a new header action
5. Set `source: '{SourceName}'` on each job so origin is always traceable

---

## 3. Product Expectations (what the app should do well)

### Job discovery
- Claude-powered `runLiveScan()` finds real open PM roles via web search
- Results are merged (no duplicates by `jd_url`), defaulting to `status: 'Saved'`
- Future: LinkedIn console scraper, company careers page scraper
- Future: Daily digest view showing new roles found + authenticity validation (does the LinkedIn posting have a matching canonical URL on the company's own careers site?)

### Application tracking
- Every job card shows: company, role, level badge, salary band, status, tags, posted date
- Status changes happen inline (board view status buttons, pipeline drag-equivalent move buttons)
- DetailPanel is the editing surface — 5 sub-tabs: Overview, Application, Interviews, Learning, Salary
- `dirty` state in DetailPanel prevents accidental unsaved changes

### Interview management
- Each interview round: type (HR / Product Sense / System Design / etc.), date, outcome (Pass/Pending/Fail), feedback notes
- Rounds are ordered chronologically, added manually

### Learning prep
- Each job has `learningTopics[]` — user-defined study items with resource links and status (Not Started / In Progress / Done)
- Progress bar shown in Learning tab
- `keyRequirements[]` from JD is shown as context alongside learning topics

### Analytics
- Pipeline Status: bar chart of jobs per status
- Conversion Funnel: Saved → Applied → Interview → Offer with percentages
- Sectors Targeted: tag frequency breakdown
- Company Tracker: dot matrix of all applications per company
- Salary Distribution: grouped by LPA range

### Authenticity validation (planned)
- For each job sourced from LinkedIn or Live Scan, verify the posting exists on the company's own careers page
- Use Claude API with web_search to find the canonical source URL
- Flag jobs where no matching company careers URL can be found (`verified: false`)
- Show verification badge on job cards

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 (JSX, no TypeScript) | Fast iteration, no type overhead for personal tool |
| Build | Vite | Fast HMR, zero config |
| Styling | Inline styles + CSS custom properties | No build step for styles, full control, matches pm-systems token system |
| State | useState / useCallback / useEffect | Simple enough — no need for global state library |
| Persistence | localStorage | Offline-first, no backend needed, sufficient for 100s of jobs |
| AI | Anthropic Claude API (direct browser fetch) | web_search tool for discovery; can also validate/enrich job data |
| Fonts | Inter (body) + JetBrains Mono (labels) | Loaded via `index.html` Google Fonts link tag |

---

## 5. Design System (condensed)

Visual language matches [pm-systems](../pm-systems) — hacker terminal aesthetic.

**Key tokens:**
```css
--bg: #050505        --surface: #0a0a0a     --surface2: #111111
--border: rgba(255,255,255,0.08)            --border2: rgba(255,255,255,0.15)
--text: #d1d1d1      --muted: #71717a
--amber: #39FF14     /* primary accent — neon green */
--blue: #58A6FF      --green: #3FB950       --red: #F85149    --purple: #BC8CFF
```

> `--amber` is named for legacy reasons. Its value is neon green `#39FF14`.

**Rules:**
- `border-radius: 0` everywhere (square corners)
- Labels: `JetBrains Mono`, `uppercase`, `9-10px`, `letterSpacing: 0.1em`
- Primary button: ghost with neon border → fills neon on hover, text goes black
- All async feedback: `ScanBanner` component only
- Card section headers: prefixed `// ` (terminal comment style)
- Utility classes: `.mono`, `.grid-bg`, `.scanline`, `.card-hover`, `.animate-fade`, `.animate-slide`, `.cursor-blink`, `.ping`, `.spinner`

---

## 6. Job Data Schema

```js
{
  id: string,               // 'job-{timestamp}-{random4}'
  company: string,
  role: string,
  level: 'Product Manager' | 'Senior Product Manager',
  location: string,         // default: 'Bengaluru, KA'
  salary_band: string,      // e.g. '60–90 LPA'
  salary_confirmed: boolean,
  jd_url: string,           // primary dedup key — must be unique per job
  posted_date: string,      // YYYY-MM-DD
  source: string,           // 'LinkedIn' | 'Manual' | 'Live Scan' | 'LinkedIn Scraper' | etc.
  tags: string[],
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn',
  appliedDate: string,
  resume: string,
  coverLetter: string,
  referralContact: string,
  referralEmail: string,
  negotiationNotes: string,
  salaryOffered: string,
  salaryTarget: string,
  interviewRounds: [{ id, round, date, type, feedback, outcome }],
  keyRequirements: string[],
  learningTopics: [{ id, topic, resource, status }],
  notes: string,
  lastUpdated: string,      // YYYY-MM-DD

  // Planned fields
  // verified: boolean       — canonical company URL found?
  // canonicalUrl: string    — actual company careers page link
  // verifiedAt: string      — when last checked
}
```

**Dedup key:** `jd_url`. If two jobs share the same URL, `mergeJobs()` drops the incoming one. Always set a real URL when possible; use a unique synthetic key (e.g. `company+role+date`) as fallback.

---

## 7. Key Utilities

| Function | File | When to use |
|---|---|---|
| `newJob(overrides)` | `utils/jobUtils.js` | Always — when creating any job from any source |
| `mergeJobs(existing, incoming)` | `utils/claudeApi.js` | Always — before setting state from any external import |
| `runLiveScan(apiKey)` | `utils/claudeApi.js` | Claude web search for new PM roles |
| `statusCounts(jobs)` | `utils/jobUtils.js` | Analytics, filter chip counts |
| `getSectorBreakdown(jobs)` | `utils/jobUtils.js` | Tag frequency for analytics |
| `loadJobs()` / `saveJobs()` | `utils/storage.js` | localStorage read/write |
| `importData(file)` | `utils/storage.js` | Import pm-tracker JSON backup |
| `exportData()` | `utils/storage.js` | Download full backup as JSON |

---

## 8. Project Structure

```
pm-tracker/
├── index.html                     # Google Fonts, app mount point
├── skill.md                       # This file
└── src/
    ├── App.jsx                    # All global state, filtering, scan/import handlers
    ├── index.css                  # Design tokens, animations, global resets
    ├── constants.js               # STATUS config, COMPANIES list, SEED_JOBS
    ├── components/
    │   ├── Header.jsx             # Logo, tab nav, scan button, add button
    │   ├── BoardView.jsx          # Job list + search + filter chips
    │   ├── JobCard.jsx            # Compact job row (clickable)
    │   ├── DetailPanel.jsx        # Right-side editor: 5 sub-tabs, dirty tracking
    │   ├── PipelineView.jsx       # Kanban columns by status
    │   ├── AnalyticsView.jsx      # Stat cards grid
    │   ├── AddJobModal.jsx        # Modal: new role form
    │   ├── SettingsModal.jsx      # Modal: API key, import/export, integrations
    │   └── ScanBanner.jsx         # Top notification strip
    └── utils/
        ├── storage.js             # localStorage r/w, JSON import/export
        ├── jobUtils.js            # newJob(), helpers, analytics functions
        └── claudeApi.js           # runLiveScan(), mergeJobs()
```

---

## 9. Claude API Pattern

```js
// All Claude calls follow this pattern:
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: PROMPT }],
  }),
})
```

- API key from `settings.apiKey` (localStorage) — never hardcoded
- All Claude calls go in `src/utils/claudeApi.js`
- Errors bubble up to `App.jsx` → `setScanMsg({ type: 'error', text: ... })`

---

## 10. localStorage Keys

| Key | Content |
|---|---|
| `pmtracker_jobs` | `Job[]` — full job array |
| `pmtracker_settings` | `{ apiKey, userName, targetRole, minSalary }` |
| `pmtracker_last_scan` | ISO timestamp string |
