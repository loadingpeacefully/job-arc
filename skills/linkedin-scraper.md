# Job Arc — LinkedIn Scraper Integration

> Load this when working on the py-linkedin-jobs-scraper integration or any LinkedIn data import feature.

---

## Current LinkedIn Import Methods (already built)

### 1. Chrome Extension (primary, recommended)
- One-click import from any `linkedin.com/jobs/view/*` page
- Full JD, skills, insights, company data
- See `chrome-extension.md` for details

### 2. Console Snippet — Saved Jobs Bulk Import
Run `LINKEDIN_SCRAPER_SNIPPET` from `linkedinScraper.js` in browser console on `linkedin.com/jobs-tracker/`.
Extracts: title, company, location, jobUrl (no JD text).
Output: JSON array → paste into Settings → LinkedIn → Import.

### 3. Console Snippet — Single Job
Run `LINKEDIN_SINGLE_JOB_SNIPPET` on any `linkedin.com/jobs/view/*` page.
Same minimal output as bulk.

---

## Planned: py-linkedin-jobs-scraper Integration

**Repo:** `py-linkedin-jobs-scraper` (the zip already reviewed)
**What it provides:** Full structured job data including description, skills, insights, company logo, posted date — richer than console snippets, more scalable than the extension.

### What the scraper outputs (per job)
```python
EventData(
  query, location, job_id, title, company, company_link, company_img_link,
  place, date, date_text, link, apply_link,
  description,        # full JD plain text
  description_html,   # full JD HTML
  insights,           # ['Mid-Senior level', 'Full-time', '201-500 employees']
  skills,             # ['Product Roadmap', 'SQL', 'Stakeholder Management']
)
```

### Integration Architecture Options

**Option A — Local Python script + JSON file (simplest)**
```
python scrape.py → output jobs.json → user imports via Settings → Import JSON
```
- No server needed
- User runs manually when they want a batch
- Import goes through existing `importData()` path

**Option B — Local HTTP server (better DX)**
```
python server.py (runs on localhost:8765)
    ↓ GET /scrape?query=PM&location=Bengaluru
job-arc fetch() call in claudeApi.js or new scraperApi.js
    ↓ returns Job[]
same mergeJobs() → upsertManyJobs() → setJobs() flow
```
- Trigger from app UI (new "LinkedIn Scraper" button in header or SettingsModal)
- Requires user to run `python server.py` first
- Add indicator to Header.jsx (like ext indicator) showing if server is reachable

**Option C — Vercel serverless function (cleanest, no local setup)**
- Scraper runs as Vercel Python function
- Requires LinkedIn `li_at` cookie as env var (rotates frequently — maintenance burden)
- Not recommended for personal tool

**Recommended: Option B** — best DX, keeps data local, no cookie management in cloud.

---

## Mapping Scraper Output → Job Schema

```js
function mapScraperJob(eventData) {
  return newJob({
    company:        eventData.company,
    role:           eventData.title,
    location:       eventData.place,
    jd_url:         eventData.link,        // linkedin URL — primary dedup key
    posted_date:    eventData.date,        // ISO date from scraper
    source:         'LinkedIn Scraper',
    tags:           eventData.skills || [],
    keyRequirements: eventData.description
      ? eventData.description.split('\n').map(l => l.trim()).filter(l => l.length > 20)
      : [],
    notes:          (eventData.insights || []).join(' · '),
  })
}
```

---

## Python Script Skeleton (Option A)

```python
# scrape.py
import json
from linkedin_jobs_scraper import LinkedinScraper
from linkedin_jobs_scraper.events import Events, EventData
from linkedin_jobs_scraper.query import Query, QueryOptions, QueryFilters
from linkedin_jobs_scraper.filters import RelevanceFilters, TimeFilters, ExperienceLevelFilters

jobs = []

def on_data(data: EventData):
    jobs.append({
        'title': data.title,
        'company': data.company,
        'company_link': data.company_link,
        'company_img_link': data.company_img_link,
        'location': data.place,
        'jobUrl': data.link,
        'applyLink': data.apply_link or data.link,
        'postedDate': data.date_text,
        'description': data.description,
        'skills': list(data.skills or []),
        'insights': list(data.insights or []),
    })

scraper = LinkedinScraper(slow_mo=1, max_workers=1)
scraper.on(Events.DATA, on_data)
scraper.run(Query(
    query='Product Manager',
    options=QueryOptions(
        locations=['Bengaluru, Karnataka, India'],
        limit=25,
        filters=QueryFilters(
            relevance=RelevanceFilters.RECENT,
            time=TimeFilters.WEEK,
            experience=[ExperienceLevelFilters.MID_SENIOR],
        )
    )
))

with open('jobs_output.json', 'w') as f:
    json.dump(jobs, f, indent=2)

print(f'{len(jobs)} jobs saved to jobs_output.json')
```

**Requirements:**
- Python 3.12+
- `pip install py-linkedin-jobs-scraper`
- Chrome + ChromeDriver installed
- LinkedIn `li_at` session cookie in env: `LI_AT=your_cookie_value`

---

## Import Flow for Option A Output

The JSON output from the scraper matches the extension's raw format. Add a handler in `SettingsModal.jsx`:

```js
// Parse scraper JSON output (same shape as extension raw data)
function importScraperJSON(text) {
  const raw = JSON.parse(text)
  return raw.map(item => newJob({
    company:  item.company,
    role:     item.title,
    location: item.location,
    jd_url:   item.jobUrl,
    source:   'LinkedIn Scraper',
    tags:     item.skills || [],
    keyRequirements: (item.description || '')
      .split('\n').map(l => l.trim()).filter(l => l.length > 20),
    notes: (item.insights || []).join(' · '),
  }))
}
```

Then: `mergeJobs(existing, parsed)` → `upsertManyJobs` → `setJobs` → `setScanMsg`.

---

## Key Difference vs Chrome Extension

| | Chrome Extension | py-linkedin-jobs-scraper |
|---|---|---|
| Trigger | Manual, one job at a time | Batch, 25+ jobs at once |
| Auth | Uses your browser session | Needs `li_at` cookie |
| Full JD | Yes (waits for expansion) | Yes |
| Skills | Yes | Yes (from "How you match") |
| Maintenance | Brittle to LinkedIn DOM changes | Brittle to LinkedIn DOM changes |
| Setup | Load extension in Chrome | Python + ChromeDriver |

Both use the same dedup key (`jd_url`) so they won't create duplicates if a job is imported via both paths.
