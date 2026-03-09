# Job Arc — Claude API Workflows

> Load this when adding any AI-powered feature: scan, verify, JD analysis, match scoring, interview prep.

---

## API Call Pattern

All Claude calls follow this exact pattern. Never deviate.

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,                                    // from settings.apiKey
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',    // required for browser calls
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',                      // always this model
    max_tokens: 4000,                                       // adjust per task
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],  // include only if search needed
    messages: [{ role: 'user', content: PROMPT }],
  }),
})

if (!response.ok) {
  const err = await response.json().catch(() => ({}))
  throw new Error(err?.error?.message || `API error ${response.status}`)
}
```

**Rules:**
- API key always from `settings.apiKey` (stored in Supabase) — never hardcoded
- All Claude API functions live in `src/utils/claudeApi.js` only
- Errors always propagate up — never swallowed silently
- Response errors → `setScanMsg({ type: 'error', text: err.message })` in App.jsx

---

## Parsing Responses

### JSON array response
```js
const data = await response.json()
const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
const startIdx = clean.indexOf('[')
const endIdx = clean.lastIndexOf(']')
if (startIdx === -1 || endIdx === -1) throw new Error('No JSON array in response')
const result = JSON.parse(clean.slice(startIdx, endIdx + 1))
```

### JSON object response
```js
const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
const start = clean.indexOf('{')
const end = clean.lastIndexOf('}')
if (start === -1 || end === -1) return fallback
return JSON.parse(clean.slice(start, end + 1))
```

---

## Existing Workflows

### `runLiveScan(apiKey)` → `Job[]`
Searches for open PM roles in Bengaluru (40LPA+). Uses `web_search` tool. Returns 10-20 job objects with `keyRequirements[]` pre-populated. Called from `handleScan` in App.jsx.

### `verifyJob(apiKey, { company, role, jd_url })` → `{ found, canonicalUrl }`
Searches for the role on the company's own careers site (not LinkedIn). Returns `found: true/false` and `canonicalUrl`. Called from `handleVerify` in App.jsx. Result stored on job as `verified`, `canonicalUrl`, `verifiedAt`.

---

## Planned Workflow: JD Analysis + Profile Match

**Purpose:** Given a job's `keyRequirements[]` and Suneet's resume (`resume.md`), produce:
- `matchScore` — 0–100 percentage fit
- `matchSummary` — 2-3 sentence honest gap analysis
- `tailoredPoints[]` — specific resume bullets/experiences to lead with for this role
- `learningTopics[]` — skill gaps to close before applying (replaces auto-generated ones)

**Function signature:**
```js
export async function analyzeJobMatch(apiKey, job, resumeText) → {
  matchScore: number,
  matchSummary: string,
  tailoredPoints: string[],
  learningTopics: [{ topic, resource, status: 'Not Started' }],
}
```

**Prompt structure:**
```
You are a career coach helping a Senior PM evaluate a job fit.

CANDIDATE PROFILE:
{resumeText}

JOB DETAILS:
Company: {job.company}
Role: {job.role}
Key Requirements:
{job.keyRequirements.join('\n')}

Analyze the fit and return ONLY valid JSON:
{
  "matchScore": number (0-100),
  "matchSummary": "2-3 sentence honest assessment of fit and gaps",
  "tailoredPoints": ["specific bullet from resume most relevant to this role", ...],
  "learningTopics": [{ "topic": "skill gap", "resource": "best resource to close it", "status": "Not Started" }, ...]
}
```

**Where to trigger:** DetailPanel → Overview tab → "Analyze Match" button
**Where to store:** `updateJob(job.id, { matchScore, matchSummary, tailoredPoints, learningTopics })`
**No web_search needed** — pure reasoning against the two inputs
**max_tokens:** 2000

---

## Planned Workflow: Interview Prep Generator

**Purpose:** Generate role-specific interview questions based on JD type and company.

**Function signature:**
```js
export async function generatePrepQuestions(apiKey, job) → {
  questions: [{
    type: 'Product Sense' | 'System Design' | 'Behavioural' | 'Analytical',
    question: string,
    hint: string,   // what a good answer should touch on
  }]
}
```

**Prompt structure:**
```
Generate 10 interview questions for this PM role. Include a mix of Product Sense, Analytical, Behavioural, and (if relevant) System Design questions.

Company: {job.company}
Role: {job.role}
Key Requirements: {job.keyRequirements.join(', ')}
Tags/Domain: {job.tags.join(', ')}

Return ONLY valid JSON:
{
  "questions": [
    { "type": "Product Sense", "question": "...", "hint": "Good answers should cover..." },
    ...
  ]
}
```

**Where to trigger:** DetailPanel → new "Prep" sub-tab → "Generate Questions" button
**Where to store:** `updateJob(job.id, { prepQuestions: result.questions })`
**No web_search needed**
**max_tokens:** 2000

---

## App.jsx Handler Pattern

For any new Claude workflow, follow this exact handler pattern:

```js
const handleNewWorkflow = useCallback(async (jobId) => {
  const job = jobs.find(j => j.id === jobId)
  if (!job) return
  if (!settings.apiKey) {
    setScanMsg({ type: 'error', text: 'Add your Anthropic API key in Settings first.' })
    return
  }
  setWorkflowLoadingId(jobId)   // local loading state
  setScanMsg({ type: 'info', text: `Running analysis for "${job.company} — ${job.role}"…` })
  try {
    const result = await newWorkflowFunction(settings.apiKey, job)
    updateJob(jobId, result)
    setScanMsg({ type: 'success', text: `Analysis complete for ${job.company}.` })
  } catch (err) {
    setScanMsg({ type: 'error', text: `Analysis failed: ${err.message}` })
  } finally {
    setWorkflowLoadingId(null)
  }
}, [jobs, settings.apiKey, updateJob])
```

---

## Cost Awareness

- `runLiveScan` — uses web_search, ~4k tokens — moderate cost
- `verifyJob` — uses web_search, ~512 tokens — cheap
- `analyzeJobMatch` — no web_search, ~2k tokens — cheap
- `generatePrepQuestions` — no web_search, ~2k tokens — cheap

Don't run `runLiveScan` more than once per day. The other workflows are cheap enough to run per-role on demand.
