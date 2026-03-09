# Job Arc — Design System

> Load this when adding or modifying any UI component, layout, or styling.

---

## Visual Language

Hacker terminal aesthetic. Dark, dense, information-rich. Every pixel earns its place.

**Core rules:**
- `border-radius: 0` — square corners everywhere, no exceptions
- Monospace labels only — `JetBrains Mono`, `uppercase`, `9-10px`, `letterSpacing: 0.1em`
- Body text — `Inter, sans-serif`, `11-13px`
- All async feedback → `ScanBanner` only. Never inline errors, never `alert()`
- Card section headers prefixed `// ` (terminal comment style)

---

## Color Tokens

```css
/* Backgrounds */
--bg:       #050505      /* page background */
--surface:  #0a0a0a      /* cards, panels */
--surface2: #111111      /* nested surfaces, inputs */

/* Borders */
--border:   rgba(255,255,255,0.08)   /* default border */
--border2:  rgba(255,255,255,0.15)   /* hover / active border */

/* Text */
--text:     #d1d1d1      /* primary text */
--muted:    #71717a      /* secondary / labels */

/* Accents */
--amber:    #39FF14      /* PRIMARY — neon green (named amber for legacy reasons) */
--blue:     #58A6FF      /* Applied status, links */
--green:    #3FB950      /* Offer status, success */
--red:      #F85149      /* Rejected status, errors */
--purple:   #BC8CFF      /* Withdrawn status, misc */
```

> `--amber` is `#39FF14` (neon green). The name is a legacy accident. Always use `var(--amber)` for the primary accent — never hardcode `#39FF14` directly.

---

## Status Colors

From `constants.js`:

```js
STATUS = {
  Saved:     { color: '#71717a', bg: 'rgba(113,113,122,0.08)', border: 'rgba(113,113,122,0.25)' }
  Applied:   { color: '#58A6FF', bg: 'rgba(88,166,255,0.06)',  border: 'rgba(88,166,255,0.25)'  }
  Interview: { color: '#39FF14', bg: 'rgba(57,255,20,0.06)',   border: 'rgba(57,255,20,0.25)'   }
  Offer:     { color: '#3FB950', bg: 'rgba(63,185,80,0.06)',   border: 'rgba(63,185,80,0.25)'   }
  Rejected:  { color: '#F85149', bg: 'rgba(248,81,73,0.06)',   border: 'rgba(248,81,73,0.25)'   }
  Withdrawn: { color: '#BC8CFF', bg: 'rgba(188,140,255,0.06)', border: 'rgba(188,140,255,0.25)' }
}
```

Use `STATUS[job.status].color/bg/border` for all status-dependent styling. Never hardcode status colors inline.

---

## Utility Classes (index.css)

```
.mono          — JetBrains Mono font, uppercase, letter-spacing 0.1em
.grid-bg       — subtle dot/grid background pattern on page root
.scanline      — animated horizontal scan line (used on page root div)
.card-hover    — border brightens on hover (border → border2)
.animate-fade  — fadeUp entrance animation
.animate-slide — slideLeft entrance animation (DetailPanel)
.cursor-blink  — blinking cursor character
.ping          — pulsing circle (used in logo)
.spinner       — rotating element (used on scan button during loading)
```

---

## Component Patterns

### Labels / section headers
```jsx
<div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
  // section_name
</div>
```

### Primary button (ghost → fills on hover)
```jsx
<button
  style={{
    padding: '6px 16px',
    border: '1px solid var(--amber)',
    background: 'transparent',
    color: 'var(--amber)',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    fontFamily: 'JetBrains Mono, monospace',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#000' }}
  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)' }}
>
  Label
</button>
```

### Secondary / ghost button (no fill)
```jsx
<button
  style={{
    padding: '4px 10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    fontFamily: 'JetBrains Mono, monospace',
  }}
>
  Label
</button>
```

### Card / surface panel
```jsx
<div style={{
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  padding: '14px 16px',
}}>
```

### Status badge
```jsx
const cfg = STATUS[job.status]
<span style={{
  fontSize: 9, fontWeight: 700, padding: '2px 7px',
  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
  fontFamily: 'JetBrains Mono, monospace',
  textTransform: 'uppercase', letterSpacing: '0.1em',
}}>
  {cfg.label}
</span>
```

### Input / textarea
```jsx
<input
  style={{
    width: '100%', padding: '7px 10px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  }}
  onFocus={e => e.currentTarget.style.borderColor = 'var(--border2)'}
  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
/>
```

### Modal overlay
```jsx
<div style={{
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200,
  backdropFilter: 'blur(4px)',
}}
  onClick={onClose}
>
  <div className="animate-fade" onClick={e => e.stopPropagation()} style={{
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    padding: 24,
    width: 480, maxWidth: '95vw', maxHeight: '90vh',
    overflowY: 'auto',
  }}>
    {/* content */}
  </div>
</div>
```

### Loading state (inline spinner)
```jsx
<span className="spinner" style={{ display: 'inline-block', marginRight: 6 }}>↻</span>
Loading…
```

---

## Layout

- Max content width: `1440px`, centered, `padding: 0 24px`
- Main layout: flex row — left `flex: 1` (list/view) + right `width: 460px` (DetailPanel, only in board tab)
- Header: `position: sticky; top: 0; zIndex: 50; height: 56px`
- DetailPanel: `position: sticky; top: 76px` (below header)

---

## Spacing Scale

Use multiples of 4px: `4, 8, 12, 16, 20, 24, 28, 32, 40`

Avoid: arbitrary values like `13px`, `17px`, `22px`

---

## What NOT to do

- No Tailwind classes
- No CSS modules or separate `.css` files (except `index.css` for globals)
- No `border-radius` (other than `50%` for dot indicators)
- No `box-shadow` drop shadows — only glow effects on neon elements
- No colored backgrounds on buttons — ghost style only (fill only on hover)
- No emoji in labels or section headers — keep terminal aesthetic
- No `console.log` left in production code
