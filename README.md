# Job Arc ⚡

> Track every application. Import from LinkedIn. Verify listings with AI.

A personal job application tracker with a dark terminal aesthetic — built for anyone actively job searching. All data stays in your browser (localStorage). No backend, no database.

---

## Features

- **Kanban Board** — Move applications through stages: Saved → Applied → Interview → Offer
- **Daily View** — New roles added today, verification queue, pipeline pulse stats
- **LinkedIn Chrome Extension** — One-click job import from any `linkedin.com/jobs/view/` page
- **AI Verification** — Confirm a listing is real by finding it on the company's own careers site (Claude API)
- **Analytics Dashboard** — Response rates, stage distribution, velocity over time
- **Pipeline View** — Full funnel view across all stages
- **Live Scan** — AI-powered scan for new job openings (requires Anthropic API key)
- **Export / Import** — Backup and restore all data as JSON

---

## Tech Stack

- React 18 + Vite
- localStorage (no backend, no database)
- Anthropic Claude API (optional — for Live Scan + AI verification)
- Chrome Extension (Manifest V3) for LinkedIn import

---

## Want to use this?

This is a personal setup with auth enabled. Email **suneet.product@gmail.com** and I'll send you the setup guide.

---

## Local Dev (once you have the setup guide)

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Data

All job data is stored in your browser's `localStorage`. Use **Settings → Export JSON** to back it up and **Import JSON** to restore on any device.
