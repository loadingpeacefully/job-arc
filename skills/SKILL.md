---
name: job-arc
description: >
  Full context for the job-arc project — a personal PM job application tracker.
  Load this whenever working on any feature, bug, integration, or AI workflow in this repo.
  Sub-files cover specific areas in depth; reference them when the task demands it.
---

# Job Arc — Master Skill File

> Personal PM job tracker for Suneet. Bengaluru, 40LPA+. One user. No sharing.

---

## 1. What This App Does

Two jobs:
1. **Discovery** — find real open PM roles via Live Scan (Claude AI), LinkedIn Chrome Extension, or manual entry
2. **Tracking** — manage full application lifecycle: Saved → Applied → Interview → Offer/Rejected, with per-role prep, salary negotiation, interview rounds, and learning topics

**North star:** Open the app every morning and immediately know — what's active, what needs action today, what new roles to pursue.

---

## 2. Current Architecture

### Stack
| Layer | Choice |
|---|---|
| Framework | React 18 + Vite (JSX, no TypeScript) |
| Styling | Inline styles + CSS custom properties (no Tailwind, no CSS modules) |
| State | `useState` / `useCallback` / `useEffect` only — no Redux, no Zustand, no Context |
| Database | **Supabase** (NOT localStorage — the old skill.md was wrong) |
| Auth | Simple hardcoded credentials in `auth.js` → session token in localStorage |
| AI | Anthropic Claude API — direct browser fetch with `anthropic-dangerous-direct-browser-access: true` |
| Extension | Chrome Extension (Manifest V3) — injects "Add to Job Arc" button on LinkedIn job pages |
| Deploy | Vercel |

### Supabase Schema
```
jobs     (id text PK, data jsonb, updated_at timestamptz)
settings (id text PK, data jsonb, updated_at timestamptz)
```
All job fields live inside `data` jsonb. No column-level schema for job fields — the entire job object is stored as JSON. `settings` has a single row with `id = 'singleton'`.

### State Architecture
```
Supabase (persistent, source of truth)
    ↕ loadJobs() / upsertJob() / upsertManyJobs() / deleteJobDB()
App.jsx (React state — single source of truth in memory)
    ├── jobs[]          — all job records
    ├── settings{}      — apiKey, userName, targetRole, minSalary
    ├── lastScan        — ISO timestamp (localStorage only, trivial)
    └── verifyingId     — which job is being AI-verified right now
    ↓ props only
Child components (read-only views + local form state)
    └── DetailPanel has local state for edits (dirty tracking)
        └── onUpdate() → App.jsx → upsertJob() → Supabase
```

**Rule:** State never lives below App.jsx except for local UI state (form fields, open/closed tabs). No component reads Supabase directly — all DB calls go through `utils/storage.js`.

### Key Files
```
job-arc/
├── skill.md                          ← old, outdated — superseded by skills/ folder
├── src/
│   ├── App.jsx                       ← ALL global state, all handlers
│   ├── index.css                     ← design tokens, animations, utility classes
│   ├── constants.js                  ← STATUS config, COMPANIES, SEED_JOBS, INTERVIEW_TYPES
│   ├── components/
│   │   ├── Header.jsx                ← logo, tabs, scan btn, add btn, ext indicator, logout
│   │   ├── BoardView.jsx             ← job list + search + filter chips
│   │   ├── JobCard.jsx               ← compact job row (clickable → opens DetailPanel)
│   │   ├── DetailPanel.jsx           ← right-side editor, 5 sub-tabs, dirty tracking
│   │   ├── PipelineView.jsx          ← kanban columns by status
│   │   ├── AnalyticsView.jsx         ← stat cards grid
│   │   ├── DailyView.jsx             ← today's intel: new roles, verify queue, pipeline pulse
│   │   ├── AddJobModal.jsx           ← new role form
│   │   ├── SettingsModal.jsx         ← API key, import/export, LinkedIn scraper snippets
│   │   ├── LoginScreen.jsx           ← simple username/password gate
│   │   └── ScanBanner.jsx            ← top notification strip (success/error/info)
│   └── utils/
│       ├── storage.js                ← ALL Supabase r/w operations
│       ├── jobUtils.js               ← newJob(), helpers, analytics functions
│       ├── claudeApi.js              ← runLiveScan(), verifyJob(), mergeJobs()
│       ├── linkedinScraper.js        ← console snippets + parseLinkedInClipboard()
│       ├── auth.js                   ← checkCredentials(), saveSession(), isAuthenticated()
│       └── supabase.js               ← createClient() using VITE_SUPABASE_URL + ANON_KEY
└── chrome-extension/
    ├── manifest.json                 ← Manifest V3, host perms for linkedin + app URLs
    ├── content.js                    ← injected on /jobs/view/* — extracts job, adds button
    └── background.js                 ← service worker — receives ADD_JOB, finds/opens app tab, injects
```

---

## 3. Data Flow Rules

### Adding any new data source (Live Scan, paste, scraper)
```
External source (scraper, paste, API)
    ↓
Parse → map to job schema using newJob(overrides)   ← ALWAYS use newJob()
    ↓
mergeJobs(existing, incoming)                        ← deduplicates by jd_url (skips existing)
    ↓
upsertManyJobs(newOnly)                              ← persist to Supabase
    ↓
setJobs(merged)                                      ← update React state
    ↓
setScanMsg({ type: 'success', text: '...' })         ← ScanBanner feedback
```

### Chrome Extension bridge (different — supports UPDATE)
```
job_arc_job CustomEvent received in App.jsx
    ↓
Check: does jd_url already exist in jobs[]?
    ├── YES → merge freshData onto existing job (keyRequirements, tags, notes, location)
    │          upsertJob(refreshed)  ← update Supabase in-place
    │          setJobs(updated)      ← preserve status, appliedDate, resume, etc.
    └── NO  → newJob() → mergeJobs() → upsertManyJobs() → setJobs()
    ↓
setScanMsg({ text: 'refreshed with latest JD' | 'added from LinkedIn' })
```

**Dedup key:** `jd_url`. Two jobs with the same URL = same job. Always set a real URL; use `company+role+date` as synthetic fallback.

### Notification pattern
All async feedback → `setScanMsg({ type: 'success'|'error'|'info', text: '...' })` in App.jsx.
- Never use `alert()`
- Never render inline error state in child components — bubble up to App.jsx

### Adding a new tab/view
1. Add tab key to `['board', 'daily', 'pipeline', 'analytics']` in `Header.jsx`
2. Add `{tab === 'newtab' && <NewView jobs={jobs} ... />}` in `App.jsx`
3. Create `src/components/NewView.jsx`
4. Views receive `jobs` as props — never read Supabase directly

### Adding a new Claude API workflow
1. Add function to `src/utils/claudeApi.js`
2. Follow the API pattern in `skills/claude-api.md`
3. Expose trigger in App.jsx with handler + setScanMsg
4. Pass handler down as prop to relevant component

---

## 4. Job Data Schema

```js
{
  // Identity
  id: string,               // 'job-{timestamp}-{random4}'
  company: string,
  role: string,
  level: 'Product Manager' | 'Senior Product Manager',
  location: string,         // default: 'Bengaluru, KA'

  // Discovery metadata
  salary_band: string,      // e.g. '60–90 LPA'
  salary_confirmed: boolean,
  jd_url: string,           // PRIMARY DEDUP KEY — must be unique
  posted_date: string,      // YYYY-MM-DD
  source: string,           // 'LinkedIn Extension' | 'LinkedIn Scraper' | 'Live Scan' | 'Manual'
  tags: string[],           // domain tags e.g. ['Fintech', 'B2B', 'Growth']

  // Verification (AI)
  verified: boolean | null, // null = not yet checked
  canonicalUrl: string,     // company careers page URL if verified
  verifiedAt: string,       // YYYY-MM-DD

  // Application tracking
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn',
  appliedDate: string,
  resume: string,           // filename only e.g. 'Resume_v3.pdf'
  coverLetter: string,
  referralContact: string,
  referralEmail: string,

  // Salary negotiation
  negotiationNotes: string,
  salaryOffered: string,
  salaryTarget: string,

  // Interview rounds
  interviewRounds: [{
    id: string,
    round: string,
    date: string,           // YYYY-MM-DD
    type: string,           // from INTERVIEW_TYPES
    feedback: string,
    outcome: 'Pending' | 'Pass' | 'Fail',
  }],

  // JD analysis
  keyRequirements: string[], // raw JD lines or extracted requirements

  // Learning prep (personalized)
  learningTopics: [{
    id: string,
    topic: string,
    resource: string,
    status: 'Not Started' | 'In Progress' | 'Done',
  }],

  // AI-generated (planned fields)
  // matchScore: number         — % match with Suneet's profile
  // matchSummary: string       — 2-3 sentence gap analysis
  // prepQuestions: string[]    — interview prep Qs generated from JD
  // tailoredPoints: string[]   — resume bullet points to emphasize for this role

  notes: string,
  lastUpdated: string,      // YYYY-MM-DD
}
```

---

## 5. Sub-Skill Files

Load these when working on specific areas:

| File | Load when... |
|---|---|
| `skills/design-system.md` | Adding/modifying any UI component, styling, layout |
| `skills/chrome-extension.md` | Working on content.js, background.js, or extension-app bridge |
| `skills/claude-api.md` | Adding any Claude AI workflow (scan, verify, JD analysis, prep) |
| `skills/linkedin-scraper.md` | Building py-linkedin-jobs-scraper integration |
| `resume.md` | Running JD analysis, match scoring, or generating tailored prep content |

---

## 6. Planned Features (build context)

### JD Analysis + Profile Match (next priority)
- Parse `keyRequirements[]` from the job's JD
- Compare against Suneet's profile (`resume.md`)
- Output: `matchScore`, `matchSummary`, `tailoredPoints[]` (which resume bullets to lead with), `learningTopics[]` (gaps to close)
- Trigger: "Analyze JD" button in DetailPanel → Overview tab
- See `skills/claude-api.md` for implementation pattern

### LinkedIn Scraper Integration (py-linkedin-jobs-scraper)
- Python backend or local script that runs `py-linkedin-jobs-scraper`
- Outputs job array → POST to a local endpoint or writes JSON → app imports
- Richer data than console snippet: full description, skills, insights
- See `skills/linkedin-scraper.md`

### AI Interview Prep
- Per-role: generate 8-12 interview questions based on JD + job type (Product Sense / System Design / Behavioural)
- Store as `prepQuestions[]` on the job object
- Show in DetailPanel → new "Prep" sub-tab
- See `skills/claude-api.md`

---

## 7. Key Utilities Reference

| Function | File | Purpose |
|---|---|---|
| `newJob(overrides)` | `jobUtils.js` | Always use when creating any job from any source |
| `mergeJobs(existing, incoming)` | `claudeApi.js` | Always deduplicate before setting state |
| `runLiveScan(apiKey)` | `claudeApi.js` | Claude web_search for new PM roles |
| `verifyJob(apiKey, job)` | `claudeApi.js` | AI confirms role exists on company careers page |
| `upsertJob(job)` | `storage.js` | Save single job to Supabase |
| `upsertManyJobs(jobs[])` | `storage.js` | Bulk save to Supabase |
| `deleteJobDB(id)` | `storage.js` | Delete from Supabase |
| `loadJobs()` | `storage.js` | Fetch all jobs from Supabase on mount |
| `exportData(jobs, settings)` | `storage.js` | Download JSON backup |
| `parseLinkedInClipboard(text)` | `linkedinScraper.js` | Parse console snippet JSON output |

---

## 8. Environment Variables

```
VITE_SUPABASE_URL       — Supabase project URL
VITE_SUPABASE_ANON_KEY  — Supabase anon public key
```

Both set in `.env.local` (not committed). Required for any Supabase operation. The Anthropic API key is stored per-user in Supabase settings, not in env.

---

## 9. Chrome Extension URLs

The extension is hardcoded to communicate with:
- `http://localhost:3000/` — local dev
- `https://jobs-arc.vercel.app/` — production

If the Vercel URL changes, update both `manifest.json` (`host_permissions`) and `background.js` (`APP_URLS`).
