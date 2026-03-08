export const STATUS = {
  Saved:     { color: '#71717a', bg: 'rgba(113,113,122,0.08)', border: 'rgba(113,113,122,0.25)', icon: '🔖', label: 'Saved' },
  Applied:   { color: '#58A6FF', bg: 'rgba(88,166,255,0.06)',  border: 'rgba(88,166,255,0.25)',  icon: '📤', label: 'Applied' },
  Interview: { color: '#39FF14', bg: 'rgba(57,255,20,0.06)',   border: 'rgba(57,255,20,0.25)',   icon: '📅', label: 'Interview' },
  Offer:     { color: '#3FB950', bg: 'rgba(63,185,80,0.06)',   border: 'rgba(63,185,80,0.25)',   icon: '🎉', label: 'Offer' },
  Rejected:  { color: '#F85149', bg: 'rgba(248,81,73,0.06)',   border: 'rgba(248,81,73,0.25)',   icon: '❌', label: 'Rejected' },
  Withdrawn: { color: '#BC8CFF', bg: 'rgba(188,140,255,0.06)', border: 'rgba(188,140,255,0.25)', icon: '↩️', label: 'Withdrawn' },
}

export const LEVELS = ['Product Manager', 'Senior Product Manager']

export const COMPANIES = [
  // FAANG / Big Tech
  'Google','Amazon','Meta','Microsoft','Apple',
  // MNC India
  'Uber','LinkedIn','Atlassian','Stripe','Coinbase','Airbnb','Spotify','Adobe','Salesforce','Oracle','SAP',
  // Indian Unicorns
  'Flipkart','Myntra','Swiggy','Zomato','PhonePe','Razorpay','Meesho','CRED','Ola','Paytm','Zepto',
  'Groww','Navi','ShareChat','InMobi','Unacademy','Byju\'s','Udaan','Lenskart','Bigbasket','Dunzo',
  // Series B+ Bengaluru Startups
  'Juspay','Hyperface','Fi Money','Jupiter','Slice','BrowserStack','Postman','Freshworks','Chargebee',
  'Darwinbox','Leadsquared','Springworks','Slintel','Neobank','Ather Energy','Bounce','Rapido',
  'Mfine','Cure.fit','Khatabook','OkCredit','Kissht','Rupeek','Freo','Niyo','Open','Cashfree',
  'Setu','Signzy','Syntizen','IDfy','Perfios','Karza','Finarkein','Zeta','Epifi','Smallcase',
]

export const INTERVIEW_TYPES = [
  'HR Screening','Hiring Manager','System Design','Product Sense',
  'Analytical / Data','Leadership / Behavioural','Case Study','Bar Raiser','Final Round',
]

export const LEARNING_STATUSES = ['Not Started', 'In Progress', 'Done']

export const SEED_JOBS = [
  {
    id: 'google-spm-2025',
    company: 'Google',
    role: 'Senior Product Manager, Search India',
    level: 'Senior Product Manager',
    location: 'Bengaluru, KA',
    salary_band: '90–130 LPA',
    salary_confirmed: false,
    jd_url: 'https://careers.google.com/jobs/results/',
    posted_date: '2025-03-01',
    source: 'Google Careers',
    tags: ['Search', 'AI', 'Consumer'],
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
    keyRequirements: ['5+ years PM experience','Go-to-market strategy','Data-driven decision making','Cross-functional leadership'],
    learningTopics: [
      { id: 'lt1', topic: 'Google Search Ranking Systems', resource: 'How Search Works — Google Blog', status: 'Not Started' },
      { id: 'lt2', topic: 'SQL / Analytics for PMs', resource: 'Mode Analytics SQL Tutorial', status: 'In Progress' },
    ],
    notes: 'Strong referral opportunity via college network.',
    lastUpdated: '2025-03-05',
  },
  {
    id: 'razorpay-spm-2025',
    company: 'Razorpay',
    role: 'Senior PM – Payment Gateway',
    level: 'Senior Product Manager',
    location: 'Bengaluru, KA',
    salary_band: '60–95 LPA',
    salary_confirmed: false,
    jd_url: 'https://razorpay.com/jobs/',
    posted_date: '2025-03-03',
    source: 'LinkedIn',
    tags: ['Fintech', 'Payments', 'B2B'],
    status: 'Applied',
    appliedDate: '2025-03-06',
    resume: 'Resume_v3_Fintech.pdf',
    coverLetter: 'CL_Razorpay.pdf',
    referralContact: 'Sneha Iyer',
    referralEmail: 'sneha@razorpay.com',
    negotiationNotes: 'Target 90 LPA + ESOPs',
    salaryOffered: '',
    salaryTarget: '90 LPA',
    interviewRounds: [
      { id: 'ir1', round: 'HR Screening', date: '2025-03-10', type: 'HR Screening', feedback: 'Went well, clarity on role confirmed', outcome: 'Pass' },
    ],
    keyRequirements: ['Payments domain expertise','API-first product thinking','Merchant growth metrics','Cross-border payments'],
    learningTopics: [
      { id: 'lt1', topic: 'Payment Gateway Fundamentals', resource: 'Razorpay Dev Docs', status: 'Done' },
      { id: 'lt2', topic: 'Merchant Onboarding Flows', resource: 'Stripe Atlas case studies', status: 'In Progress' },
    ],
    notes: 'Referred by Sneha. JD says strong product sense for developer tools preferred.',
    lastUpdated: '2025-03-06',
  },
  {
    id: 'swiggy-pm-2025',
    company: 'Swiggy',
    role: 'Product Manager – Supply & Logistics',
    level: 'Product Manager',
    location: 'Bengaluru, KA',
    salary_band: '50–75 LPA',
    salary_confirmed: false,
    jd_url: 'https://careers.swiggy.com',
    posted_date: '2025-03-05',
    source: 'Swiggy Careers',
    tags: ['Logistics', 'Ops', 'Marketplace'],
    status: 'Interview',
    appliedDate: '2025-03-01',
    resume: 'Resume_v3.pdf',
    coverLetter: '',
    referralContact: '',
    referralEmail: '',
    negotiationNotes: '',
    salaryOffered: '',
    salaryTarget: '70 LPA',
    interviewRounds: [
      { id: 'ir1', round: 'HR Screening', date: '2025-03-05', type: 'HR Screening', feedback: 'Culture fit confirmed', outcome: 'Pass' },
      { id: 'ir2', round: 'Product Sense', date: '2025-03-12', type: 'Product Sense', feedback: '', outcome: 'Pending' },
    ],
    keyRequirements: ['Supply chain optimization','Delivery partner ops','OKR definition','Experimentation at scale'],
    learningTopics: [
      { id: 'lt1', topic: 'Last-mile logistics metrics', resource: 'Swiggy Engineering Blog', status: 'In Progress' },
    ],
    notes: 'L2 interview scheduled Mar 15. Focus on supply-demand balancing.',
    lastUpdated: '2025-03-07',
  },
]
