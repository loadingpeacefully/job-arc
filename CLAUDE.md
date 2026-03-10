# Job Arc — Project Reference for Claude

## Project Overview

**Job Arc** is a personal PM job tracker built for Suneet Jagdev's active job search. It combines a Kanban-style application tracker with AI-powered job discovery, resume generation, and listing verification — all in a single dark terminal-aesthetic web app.

Stack: **React 18 + Vite 5 + Supabase (PostgreSQL) + Anthropic Claude API**. Single-user, no multi-tenancy. Deployed to Vercel.

---

## Development

```bash
npm run dev      # Vite dev server → localhost:3000
npm run build    # Production build → /dist
```

**Required env vars** (in `.env.local`):
```
VITE_SUPABASE_URL=https://wzdihnblfpaucbfownes.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Anthropic API key is entered by the user in Settings and stored in `localStorage` only — never Supabase.

---

## Architecture

```
src/
├── App.jsx               — Single state container. ALL shared state lives here.
├── main.jsx              — Entry: ErrorBoundary → LoginScreen or App
├── constants.js          — STATUS enum (colors/icons), COMPANIES, LEVELS, INTERVIEW_TYPES
├── index.css             — CSS variables + global styles
├── components/
│   ├── Header.jsx        — Logo, tabs, Add Role button, Settings, Logout
│   ├── BoardView.jsx     — Kanban by status
│   ├── PipelineView.jsx  — Funnel: stage columns (top) + job pool (bottom)
│   ├── DailyView.jsx     — Action HQ (left) + Job Discovery panel (right)
│   ├── AnalyticsView.jsx — Charts: response rate, velocity, sector breakdown
│   ├── JobDetailView.jsx — Full-page job detail with tabs (Overview, Contacts, etc.)
│   ├── AddJobModal.jsx   — Manual job creation form
│   ├── SettingsModal.jsx — API key, profile, import/export
│   ├── ScanBanner.jsx    — Success/error toast
│   ├── LoginScreen.jsx   — Auth screen
│   └── DetailPanel.jsx   — DEPRECATED (do not use)
└── utils/
    ├── claudeApi.js      — All Anthropic API calls
    ├── storage.js        — All Supabase reads/writes
    ├── jobUtils.js       — Data factories + helpers
    ├── auth.js           — Session management
    ├── supabase.js       — Supabase client init
    └── linkedinScraper.js — LinkedIn paste/extension parser
```

**State flow**: All state in `App.jsx`, passed as props. No Context, no Zustand. Status mutations always go through `updateJob(id, updates)` in App.jsx.

---

## Data Model

**Supabase `jobs` table**: `id uuid`, `data jsonb`, `updated_at timestamp`

Key fields in the `data` object:
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | `job-<ts>-<rand>` — primary key in app |
| `jd_url` | string | **Dedup key** — unique per job listing |
| `company`, `role`, `level` | string | Core identity |
| `status` | string | One of STATUS enum keys |
| `source` | string | 'LinkedIn', 'Manual', 'LinkedIn Extension', 'Live Scan' etc. |
| `salary_band` | string | '60–90 LPA' |
| `verified` | bool\|null | `null` = unverified, `true/false` = checked |
| `keyRequirements` | string[] | Full JD text split by line |
| `tags` | string[] | 2–4 domain tags |
| `interviewRounds` | object[] | `{id, round, date, type, feedback, outcome}` |
| `contacts` | object[] | `{id, name, linkedinUrl, role, status, ...}` |
| `resumeVersions` | object[] | `{id, label, html, createdAt}` |
| `learningTopics` | object[] | `{id, topic, resource, status}` |
| `lastUpdated` | YYYY-MM-DD | Updated on every save — used for streak tracking |

**Supabase `settings` table**: `id="singleton"`, `data jsonb`. Stores `userName`, `bio`, `linkedinUrl`, `githubUrl`, `profileImage`. API key is localStorage only.

Always use **`newJob(overrides)`** from `src/utils/jobUtils.js` to create job objects.

---

## Design System

**Non-negotiable rules:**
- All CSS via **inline styles** — no Tailwind, no external CSS files, no CSS modules
- **No border-radius** (`--radius: 0px`) — square corners everywhere, always
- Terminal aesthetic: dark, dense, monospace — do NOT soften or round the UI

**CSS variables** (always use these, never hardcode hex):
```
--bg        #050505       Main background
--surface   #0a0a0a       Elevated card/panel
--surface2  #111111       Secondary surface
--border    rgba(255,255,255,0.08)
--border2   rgba(255,255,255,0.15)
--text      #d1d1d1       Primary text
--muted     #71717a       Muted labels

--amber     #39FF14       Primary accent (neon green, called "amber" in code)
--blue      #58A6FF
--green     #3FB950
--red       #F85149
--purple    #BC8CFF
```

**Typography:**
- `.mono` class → JetBrains Mono (labels, meta, badges)
- Labels/meta: 8–9px mono
- Body: 10–11px
- Company names: 11–12px, `fontWeight: 700`, `textTransform: uppercase`

**Animations:** Add a `const STYLES = \`...\`` block with `@keyframes` + CSS classes at the top of each component, then `<style>{STYLES}</style>` inside the JSX. See PipelineView.jsx or DailyView.jsx for the exact pattern.

**STATUS colors**: Always import from `src/constants.js`:
```js
import { STATUS } from '../constants'
const cfg = STATUS[job.status]  // { color, bg, border, icon }
```

---

## Key Utilities

| Utility | Location | Use |
|---------|----------|-----|
| `newJob(overrides)` | `utils/jobUtils.js` | Always use to create job objects |
| `getDaysAgo(dateStr)` | `utils/jobUtils.js` | Date math — returns null if no date |
| `mergeJobs(existing, incoming)` | `utils/claudeApi.js` | Dedup by jd_url |
| `upsertJob(job)` | `utils/storage.js` | Save single job to Supabase |
| `upsertManyJobs(jobs)` | `utils/storage.js` | Bulk save |
| `inferTags(title, company, jdText)` | `src/App.jsx` | Auto domain tagging via regex |

---

## Anthropic API Calls

All calls in `utils/claudeApi.js`. Always include:
```js
'anthropic-dangerous-direct-browser-access': 'true'  // required for browser client
```
Model: `claude-sonnet-4-20250514`. Web search tool: `web_search_20250305`.

**Functions:**
- `discoverJobs(apiKey)` — broad scan, 60+ companies, up to 30 Bengaluru PM roles
- `runLiveScan(apiKey)` — narrower curated scan (legacy, still exported)
- `verifyJob(apiKey, {company, role, jd_url})` — confirms listing + fetches salary
- `generateResume(apiKey, job, profileText)` — returns tailored HTML resume

---

## Auth

Hardcoded credentials: `suneet` / `pmtrack@26`. Session token `job_arc_session` in localStorage. `isAuthenticated()` + `clearSession()` in `utils/auth.js`.

---

## Chrome Extension Bridge

LinkedIn jobs arrive via:
1. Custom DOM event: `window.addEventListener('job_arc_job', handler)` — `e.detail` is the job object
2. Fallback: `localStorage.getItem('job_arc_incoming')` — JSON stringified job
3. Extension heartbeat: `localStorage.getItem('job_arc_ext_heartbeat') === 'true'` — shown as green dot in header

Handler is in `src/App.jsx` (lines ~63–128). New jobs get `source: 'LinkedIn Extension'`, `status: 'Saved'`.

---

## Current Product State (March 2026)

**Tabs (Daily is default):**
- **Daily** — Split: left = Action HQ (greeting + streak + 6 action sections: upcoming interviews, follow-up due, outreach queue, stale jobs, missing resume, verify queue), right = Job Discovery panel (auto-scans on load, 12h cache, save to tracker with one click)
- **Board** — Kanban by status with filter pills
- **Pipeline** — Stage columns (top, fixed) + job pool grid (bottom); click-to-select then click stage to move
- **Analytics** — Response rate, velocity, sector breakdown charts

**AI features:**
- Job Discovery — `discoverJobs()` in DailyView right panel, Refresh button
- Verify listing — `verifyJob()` from DailyView verify queue or JobDetailView
- Generate resume — `generateResume()` from JobDetailView, versioned, iframe preview
- Live Scan — removed from nav (was redundant with Discovery panel)

**Chrome Extension** — one-click job capture from any LinkedIn job page

---

## What We're Building Toward

Key product principles:
- **Daily tab is command central** — answers "what do I do today?" at a glance
- **Discovery is the growth engine** — automated, fresh, Bengaluru-targeted PM roles
- **Minimal friction everywhere** — save in one click, resume in one click, no manual data entry
- **Pipeline as a clear funnel** — visual progress, quick status moves
- **Terminal aesthetic is intentional and permanent** — do not round corners, do not add gradients, do not use Tailwind classes, do not soften typography
