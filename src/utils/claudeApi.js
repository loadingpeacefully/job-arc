const SCAN_PROMPT = `You are a job research assistant. Search for currently open Product Manager and Senior Product Manager roles in Bengaluru, Karnataka, India at top companies offering 40 LPA or more annually.

Search using these strategies:
1. Major tech companies: Google, Amazon, Meta, Microsoft, Uber, LinkedIn, Atlassian, Stripe
2. Indian unicorns: Flipkart, Myntra, Swiggy, Zomato, PhonePe, Razorpay, Meesho, CRED, Groww, Zepto, Ola, Paytm
3. Bengaluru Series B+ startups: Juspay, Postman, BrowserStack, Freshworks, Chargebee, Darwinbox, Fi Money, Jupiter, Slice, Navi
4. Any other company in Bengaluru hiring PMs at 40LPA+

Return ONLY a valid JSON array (no markdown, no preamble) with this exact schema per job:
[
  {
    "company": "string",
    "role": "string",
    "level": "Product Manager or Senior Product Manager",
    "location": "Bengaluru, KA",
    "salary_band": "string like '60-90 LPA' or '40LPA+ (estimated)'",
    "salary_confirmed": false,
    "jd_url": "string URL",
    "posted_date": "YYYY-MM-DD",
    "source": "string e.g. 'LinkedIn' or 'Google Careers'",
    "tags": ["string array of 2-4 relevant tags"],
    "keyRequirements": ["string array of 4-6 key JD requirements"],
    "notes": "string — any special notes about the role"
  }
]

Rules:
- Only include PM and Senior PM (not APM, Director, or VP)
- Only Bengaluru / Bangalore / Remote-India roles
- Only companies where 40LPA+ is realistic
- Include 10-20 roles if available
- If salary is unknown for a known top company, set salary_band to "40LPA+ (estimated)" and salary_confirmed to false
- Return ONLY the JSON array, nothing else`

export async function runLiveScan(apiKey) {
  if (!apiKey) throw new Error('API key not set. Add it in Settings.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: SCAN_PROMPT }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  // Strip any markdown fences
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const startIdx = clean.indexOf('[')
  const endIdx = clean.lastIndexOf(']')
  if (startIdx === -1 || endIdx === -1) throw new Error('No JSON array found in response')
  const jobs = JSON.parse(clean.slice(startIdx, endIdx + 1))

  // Hydrate with tracking fields
  return jobs.map(j => ({
    ...j,
    id: `${j.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    status: 'Saved',
    appliedDate: '',
    resume: '',
    coverLetter: '',
    referralContact: '',
    referralEmail: '',
    negotiationNotes: '',
    salaryOffered: '',
    salaryTarget: '',
    interviewRounds: [],
    learningTopics: (j.keyRequirements || []).slice(0, 3).map((req, i) => ({
      id: `lt${i}`,
      topic: req,
      resource: '',
      status: 'Not Started',
    })),
    notes: j.notes || '',
    lastUpdated: new Date().toISOString().slice(0, 10),
  }))
}

export async function verifyJob(apiKey, { company, role, jd_url }) {
  if (!apiKey) throw new Error('API key not set. Add it in Settings.')

  const prompt = `You are verifying a job posting and researching compensation. Search thoroughly for both parts.

ROLE: "${role}" at "${company}"
LINKEDIN URL (reference only): ${jd_url || 'not provided'}

PART 1 — JOB VERIFICATION:
Search across ALL of these to find the active listing:
- ${company}'s own careers page / jobs portal
- LinkedIn, Indeed, Naukri, Glassdoor, AngelList/Wellfound, Cutshort, Instahyre, Hirect
- Google Jobs index
- Any press releases or announcements about this hire
Mark "found: true" if you find the listing on ANY of these. Use the company's own careers URL if available; otherwise the best job portal URL.

PART 2 — SALARY RESEARCH:
Search ALL of these for compensation data for "${role}" at "${company}":
- Levels.fyi (most reliable for tech)
- Glassdoor salary section
- LinkedIn Salary Insights
- AmbitionBox (India-specific, very useful)
- Blind community posts
- Naukri salary data
- Any news articles mentioning compensation for this role/company
Prefer India/Bengaluru data. Use global data only if India data unavailable (note it).
Return as a RANGE always (e.g. "80–120 LPA"). Only return exact number if 90%+ confident from structured data.

Return ONLY this JSON, no explanation:
{
  "found": true or false,
  "canonicalUrl": "best URL found for this job, or null",
  "salary_verified": "range like 80–120 LPA or null if truly no data found",
  "salary_source": "source name e.g. Levels.fyi / AmbitionBox / Glassdoor or null",
  "salary_confirmed": true only if salary from Levels.fyi or Glassdoor structured page with multiple data points
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  const empty = { found: false, canonicalUrl: null, salary_verified: null, salary_source: null, salary_confirmed: false }
  if (start === -1 || end === -1) return empty

  try {
    return { ...empty, ...JSON.parse(clean.slice(start, end + 1)) }
  } catch {
    return empty
  }
}

export function mergeJobs(existing, incoming) {
  const existingUrls = new Set(existing.map(j => j.jd_url))
  const newOnly = incoming.filter(j => !existingUrls.has(j.jd_url))
  return { merged: [...newOnly, ...existing], added: newOnly.length }
}
