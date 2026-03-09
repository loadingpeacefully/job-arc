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
IMPORTANT — salary format rules:
- ALWAYS express in LPA (Lakhs Per Annum) for India roles
- Convert: ₹8.3M = 83 LPA, ₹1Cr = 100 LPA, ₹50L = 50 LPA
- Always return as a RANGE: "80–100 LPA" not "83 LPA" unless the single figure is highly confirmed
- Never return ₹M, ₹Cr, INR, or USD format for India roles

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

// Strip sub-project details from profile, keep structure + outcomes only (~4k chars vs ~15k)
function compressProfile(text) {
  const lines = text.split('\n')
  const result = []
  let inProject = false
  let inOutcomes = false
  let pastSkills = false

  for (const line of lines) {
    const t = line.trim()

    // From Skills section onwards — keep everything
    if (/^# (Skills|Education|Awards)/.test(t)) { pastSkills = true }
    if (pastSkills) { result.push(line); continue }

    // Company / Role headings — always keep, reset project context
    if (t.startsWith('# Company') || t.startsWith('## Role')) {
      inProject = false; inOutcomes = false; result.push(line); continue
    }

    // Project heading — keep heading, enter project context
    if (t.startsWith('### Project')) {
      inProject = true; inOutcomes = false; result.push(line); continue
    }

    // Sub-sub headings inside project — skip
    if (inProject && t.startsWith('####')) { inOutcomes = false; continue }

    // Outcomes block — always keep
    if (/^\*\*Outcomes?:?\*\*/i.test(t) || /^\*\*Signature outcomes/i.test(t)) {
      inOutcomes = true; result.push(line); continue
    }

    if (inOutcomes) {
      if (!t || t.startsWith('#') || (t.startsWith('**') && !t.startsWith('**Outcomes') && !t.match(/^[-•*]/))) {
        inOutcomes = false
      } else {
        result.push(line); continue
      }
    }

    // Not in a project — keep everything (summary, role context lines, dates)
    if (!inProject) { result.push(line); continue }

    // In project but not outcomes — skip (sub-project details)
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export async function generateResume(apiKey, job, profileText) {
  if (!apiKey) throw new Error('API key not set. Add it in Settings.')

  const compressed = compressProfile(profileText)
  // Cap JD at 60 lines — top of JD has the most important requirements
  const jdLines = (job.keyRequirements || []).slice(0, 60)
  const jdContent = jdLines.join('\n')

  const prompt = `You are a professional resume writer. Produce a tailored, ATS-optimised resume for the candidate, customised for the target role.

CANDIDATE PROFILE:
${compressed}

TARGET ROLE: "${job.role}" at "${job.company}"
JOB DESCRIPTION / KEY REQUIREMENTS:
${jdContent || '(Not available — use company context and role title to tailor)'}

INSTRUCTIONS:
1. Tailor the Profile summary (2–3 sentences) to this specific role and company. No "seasoned" or "passionate".
2. Reorder/select experience content to match JD keywords. Preserve all quantified outcomes (%, ₹, ratios).
3. Write role descriptions as flowing paragraph sentences (not bullet points) — same style as the template.
4. Output ONLY the HTML content block — no preamble, no markdown fences, start directly with <link ...>

Use EXACTLY this HTML structure and CSS class names (do not add inline styles):

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600&family=PT+Sans:ital,wght@0,400;0,700&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #fff; }
.page { width: 595px; min-height: 842px; background: #FFFFFF; padding: 28px; display: flex; flex-direction: column; gap: 15px; }
.header { display: flex; flex-direction: row; align-items: flex-end; justify-content: space-between; }
.header-left { display: flex; flex-direction: column; gap: 9px; }
.name { font-family: 'PT Sans', sans-serif; font-weight: 700; font-size: 13.704px; line-height: 18px; color: #384347; }
.title-line { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 10px; color: #384347; }
.contact { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 8.2px; line-height: 11px; color: #384347; text-align: right; }
.section { display: flex; flex-direction: column; gap: 10px; }
.section-header { display: flex; flex-direction: column; gap: 5px; }
.section-title { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 11px; color: #384347; text-transform: uppercase; }
.section-rule { width: 100%; height: 1px; background: #384347; }
.section-body { font-family: 'PT Sans', sans-serif; font-weight: 700; font-size: 8.2px; line-height: 11px; color: #384347; }
.companies { display: flex; flex-direction: column; gap: 15px; }
.company { display: flex; flex-direction: column; gap: 10px; }
.company-header { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; }
.company-name { font-family: 'PT Sans', sans-serif; font-weight: 700; font-size: 11px; line-height: 14px; color: #1B4A8B; }
.company-city { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 11px; line-height: 14px; color: #1B4A8B; }
.company-desc { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 8.2px; line-height: 11px; color: #384347; }
.roles { display: flex; flex-direction: column; gap: 10px; }
.role { display: flex; flex-direction: column; gap: 8px; }
.role-header { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; }
.role-title { font-family: 'PT Sans', sans-serif; font-weight: 700; font-size: 10px; line-height: 13px; color: #384347; }
.role-date { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 10px; line-height: 13px; color: #384347; white-space: nowrap; }
.role-bullets { font-family: 'PT Sans', sans-serif; font-weight: 400; font-size: 8.2px; line-height: 11px; color: #384347; }
.edu-entry { display: flex; flex-direction: column; gap: 8px; }
@media print { body { background: #fff; } .page { min-height: auto; } }
</style>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="name">SUNEET JAGDEV</div>
      <div class="title-line">Senior Product Manager | 0→1 Consumer Products | Growth &amp; Engagement</div>
    </div>
    <div class="contact">+91 9547058480<br>suneet.product@gmail.com<br>linkedin.com/in/suneetjagdev</div>
  </div>
  <div class="section">
    <div class="section-header"><div class="section-title">Profile</div><div class="section-rule"></div></div>
    <div class="section-body"><!-- TAILORED 2-3 SENTENCE PROFILE HERE --></div>
  </div>
  <div class="section">
    <div class="section-header"><div class="section-title">Experience</div><div class="section-rule"></div></div>
    <div class="companies">
      <!-- FOR EACH COMPANY: -->
      <div class="company">
        <div class="company-header">
          <div class="company-name">Company Name</div>
          <div class="company-city">City</div>
        </div>
        <div class="company-desc">One sentence company description.</div>
        <div class="roles">
          <div class="role">
            <div class="role-header">
              <div class="role-title">Role Title | Focus Area</div>
              <div class="role-date">Mon YYYY – Mon YYYY</div>
            </div>
            <div class="role-bullets">Flowing paragraph sentences describing achievements with quantified outcomes. Each major achievement as a sentence. No bullet characters.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-header"><div class="section-title">Education</div><div class="section-rule"></div></div>
    <div class="edu-entry">
      <div class="company-header">
        <div class="company-name">Indian Institute of Technology, Kharagpur</div>
        <div class="company-city">Kharagpur</div>
      </div>
      <div class="role-header">
        <div class="role-title">Bachelor of Architecture (B.Arch. Hons.) | Architecture &amp; Regional Planning</div>
        <div class="role-date">2012 – 2018</div>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-header"><div class="section-title">Skills</div><div class="section-rule"></div></div>
    <div class="section-body"><!-- SKILLS AS BOLD PARAGRAPH: "Product: ... Analytics: ... Tools: ..." --></div>
  </div>
</div>`

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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const html = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

  return html
}

export function mergeJobs(existing, incoming) {
  const existingUrls = new Set(existing.map(j => j.jd_url))
  const newOnly = incoming.filter(j => !existingUrls.has(j.jd_url))
  return { merged: [...newOnly, ...existing], added: newOnly.length }
}
