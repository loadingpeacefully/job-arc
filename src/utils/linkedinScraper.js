import { newJob } from './jobUtils'

// Run on linkedin.com/jobs-tracker/ — extracts all saved jobs at once
export const LINKEDIN_SCRAPER_SNIPPET = `(function() {
  var cards = document.querySelectorAll('a[data-view-name="opportunity-tracker-job-details"]');
  if (!cards.length) {
    console.warn('Job Arc: No job cards found. Make sure you are on linkedin.com/jobs-tracker/ and scroll down to load all cards first.');
    return;
  }
  var jobs = []; var seen = new Set();
  cards.forEach(function(card) {
    try {
      var jobUrl = card.href ? card.href.split('?')[0] : null;
      if (!jobUrl || seen.has(jobUrl)) return;
      var paras = [...card.querySelectorAll('p')].map(function(p) { return p.innerText.trim(); }).filter(Boolean);
      var title = paras[0] || null;
      var companyLine = paras.find(function(t) { return t.includes(' \u00b7 '); }) || '';
      var parts = companyLine.split(' \u00b7 ');
      var company = parts[0] || null;
      var location = parts.slice(1).join(' \u00b7 ') || '';
      if (!title || !company) return;
      seen.add(jobUrl);
      jobs.push({ title: title, company: company, location: location, jobUrl: jobUrl });
    } catch(e) {}
  });
  if (!jobs.length) { console.warn('Job Arc: Cards found but no data extracted.'); return; }
  console.log('Job Arc: ' + jobs.length + ' jobs found. Copy the JSON below and paste into job-arc Settings -> LinkedIn -> Import Jobs:');
  console.log(JSON.stringify(jobs));
})();`

// Run on any linkedin.com/jobs/view/XXXXX/ page — extracts a single job
export const LINKEDIN_SINGLE_JOB_SNIPPET = `(function() {
  var url = window.location.href.split('?')[0];
  if (!url.includes('/jobs/view/')) {
    console.warn('Job Arc: Open a specific LinkedIn job page (linkedin.com/jobs/view/XXXXX/) first.');
    return;
  }
  var title = (document.querySelector('h1') || {}).innerText;
  title = title ? title.trim() : null;
  var companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name, [class*="company-name"] a, [class*="company-name"]');
  var company = companyEl ? companyEl.innerText.trim() : null;
  if (!company) {
    var t = document.title || '';
    var atIdx = t.indexOf(' at ');
    var pipeIdx = t.indexOf(' | LinkedIn');
    if (atIdx !== -1 && pipeIdx !== -1) company = t.slice(atIdx + 4, pipeIdx).trim();
  }
  var locationEl = document.querySelector('.job-details-jobs-unified-top-card__bullet, [class*="workplace-type"], [class*="location"]');
  var location = locationEl ? locationEl.innerText.trim() : '';
  if (!title || !company) {
    console.warn('Job Arc: Could not extract title/company. Page may not be loaded yet.');
    return;
  }
  var job = { title: title, company: company, location: location, jobUrl: url };
  console.log('Job Arc: Job extracted. Copy the JSON below and paste into job-arc Settings -> LinkedIn -> Import Jobs:');
  console.log(JSON.stringify([job]));
})();`

export function parseLinkedInClipboard(text) {
  let raw
  try {
    raw = JSON.parse(text.trim())
  } catch {
    throw new Error('Not valid JSON. Make sure you copied the JSON line from the console output.')
  }

  // Accept both single object and array
  if (!Array.isArray(raw)) {
    if (raw && typeof raw === 'object') raw = [raw]
    else throw new Error('Expected a JSON array or object from the snippet.')
  }

  return raw
    .filter(item => item.title && item.company && item.jobUrl)
    .map(item => newJob({
      company: item.company,
      role: item.title,
      location: item.location || '',
      jd_url: item.jobUrl,
      source: 'LinkedIn Scraper',
      status: 'Saved',
      notes: '',
    }))
}
