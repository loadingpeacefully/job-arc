# job-arc / skills

Claude Code skill files for the job-arc project.

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | Master context — architecture, schema, data flow, utilities |
| `design-system.md` | Colors, tokens, component patterns, styling rules |
| `claude-api.md` | All Claude AI workflows — scan, verify, JD analysis, interview prep |
| `chrome-extension.md` | Extension architecture, data contract, debugging |
| `linkedin-scraper.md` | py-linkedin-jobs-scraper integration plan |
| `resume.md` | Suneet's profile — used for JD match scoring and tailored prep |

## Setup (symlink into Claude Code)

```bash
# From repo root:
bash skills/setup.sh
```

This symlinks `skills/` → `~/.claude/skills/job-arc` so Claude Code picks it up automatically.

## How Claude Code uses these

Claude Code reads `SKILL.md` first for any task. Sub-files are loaded on demand based on the task:
- UI work → loads `design-system.md`
- AI feature → loads `claude-api.md`  
- Extension work → loads `chrome-extension.md`
- LinkedIn scraper → loads `linkedin-scraper.md`
- JD analysis / match scoring → loads `resume.md`

## Keeping skills current

When you make significant architectural changes, update the relevant skill file. Key things to keep in sync:
- New fields added to the job schema → `SKILL.md` section 4
- New Claude workflows → `claude-api.md`
- New tabs/views → `SKILL.md` section 2 (file structure)
- Design token changes → `design-system.md`
- Resume updates → `resume.md` (critical for accurate JD matching)
