export function newJob(overrides = {}) {
  return {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    company: '',
    role: '',
    level: 'Senior Product Manager',
    location: 'Bengaluru, KA',
    salary_band: '40LPA+ (estimated)',
    salary_confirmed: false,
    jd_url: '',
    posted_date: new Date().toISOString().slice(0, 10),
    source: 'Manual',
    tags: [],
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
    contacts: [],
    resumeVersions: [],
    keyRequirements: [],
    learningTopics: [],
    notes: '',
    lastUpdated: new Date().toISOString().slice(0, 10),
    verified: null,
    canonicalUrl: '',
    verifiedAt: '',
    ...overrides,
  }
}

export function newContact() {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: '',
    linkedinUrl: '',
    role: '',
    status: 'Not reached',
    connectionType: 'Cold',
    resumeVersionId: '',
    resumeSharedDate: '',
    lastContactDate: '',
    notes: '',
  }
}

export function newInterviewRound() {
  return {
    id: `ir-${Date.now()}`,
    round: '',
    date: '',
    type: 'Product Sense',
    feedback: '',
    outcome: 'Pending',
  }
}

export function newLearningTopic() {
  return {
    id: `lt-${Date.now()}`,
    topic: '',
    resource: '',
    status: 'Not Started',
  }
}

export function getDaysAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

export function statusCounts(jobs) {
  return jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {})
}

export function getResponseRate(jobs) {
  const applied = jobs.filter(j => ['Applied','Interview','Offer','Rejected','Withdrawn'].includes(j.status)).length
  const responded = jobs.filter(j => ['Interview','Offer','Rejected'].includes(j.status)).length
  return applied ? Math.round((responded / applied) * 100) : 0
}

export function getSectorBreakdown(jobs) {
  const map = {}
  jobs.forEach(j => j.tags?.forEach(t => { map[t] = (map[t] || 0) + 1 }))
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}
