# AbarVa Build Pack · Design Fix (URGENT)

**Date:** April 19, 2026
**Scope:** Fix three live design violations the user has flagged multiple times. Updates nav typography, kills grey text, removes max-width cap. Inspired by Snowflake + Harvey design patterns.
**Effort:** 2-3 hours. Ship same session as Pack F or ahead of it.
**Override:** this pack supersedes any nav-styling guidance in Pack F that uses opacity or secondary weighting.

---

## What's broken on live prod (app.abarva.ai/dashboard)

Audited via DOM inspection, April 19:

| Element | Spec (user memory) | Currently rendering | Fix |
|---|---|---|---|
| Nav link font size | 14px | **13px** | Increase to 15px (go beyond spec — match Snowflake scale) |
| Nav link font weight | 600 idle | **400** | Fix to 600 |
| Nav link color idle | white | **`rgb(139, 134, 128)` grey** | Fix to `#F5F5F0` white |
| Nav link color active | white | white ✓ | Keep |
| Nav link color hover | teal 700 with underline | unverified | Verify — should be `#2DD4C8` with bottom underline |
| Page container width | full | **capped at `max-width: 1280px`** | Remove cap, use 100% with responsive padding |
| Nav link padding | — | 0px 14px | Increase to 0px 20px for better tap target + rhythm |

The grey text color is the single biggest offender. It violates the design system memory that reads *"Nav links: DM Sans 14px 600 white idle → 700 teal hover with teal underline."*

---

## Design principles borrowed from Snowflake + Harvey

Six rules. Every layout + typography decision from here forward follows them.

**1 · Hierarchy through size + weight, never opacity.**
If a nav item matters less, it doesn't become grey — it just isn't there, or it goes into a secondary surface. All visible nav items are equal citizens, white, confident.

**2 · Body type 15-16px, not 13-14px.**
13px feels cramped on CIO-grade dashboards. 15px is the Snowflake baseline, 16px is Harvey. We go 15px for nav + body, 14px only for captions / metadata.

**3 · Full-bleed layouts with inner padding.**
Container is 100% width with `px-10` (40px) horizontal padding on desktop. On very wide monitors (>1920px), either stay full-bleed or cap at 1800px — never 1280px. 1280px was a 2017-era Bootstrap default; we are post-that.

**4 · Grey is for dividers and backgrounds only.**
`rgb(139, 134, 128)` and similar mid-greys are banned from text. They survive only as: subtle borders (`rgba(139, 134, 128, 0.15)`), secondary panel backgrounds (`rgba(255, 255, 255, 0.02)`), and metadata captions where the spec explicitly allows (e.g., timestamps, source attributions — and even those get full white at 12px rather than grey at 14px).

**5 · Vertical rhythm is generous.**
Space between sections = 64px (4rem) on desktop, not 32px. Section padding top/bottom = 48px+. Whitespace is the product.

**6 · Typography does the work.**
No heavy shadows, no glowing borders, no gradient overlays. Type size, weight, color, and spacing carry the hierarchy. Everything else is noise.

---

## Concrete fix spec

### Nav (primary issue)

File: wherever the nav is defined. Likely `src/components/layout/TopNav.tsx` or `src/components/app/AppChrome.tsx`.

**Replace all nav link styling with this exact CSS:**

```css
.nav-link {
  color: #F5F5F0;               /* white - NEVER grey */
  font-family: 'DM Sans', -apple-system, sans-serif;
  font-size: 15px;              /* up from 13px */
  font-weight: 600;             /* up from 400 */
  padding: 0 20px;              /* up from 0 14px */
  letter-spacing: -0.01em;
  text-decoration: none;
  position: relative;
  transition: color 120ms ease;
}

.nav-link:hover {
  color: #2DD4C8;               /* teal */
  font-weight: 700;
}

.nav-link:hover::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 20px;
  right: 20px;
  height: 1px;
  background: #2DD4C8;
}

.nav-link.active {
  color: #2DD4C8;               /* teal (selected) */
  font-weight: 700;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 20px;
  right: 20px;
  height: 1px;
  background: #2DD4C8;
}
```

**Every item is equal weight. Every item is white. There is no secondary tier.** The active item gets teal; hover gets teal + underline. Nothing else changes visually between items.

If using Tailwind:
```tsx
const navLinkClass = "text-[#F5F5F0] font-semibold text-[15px] px-5 hover:text-[#2DD4C8] hover:font-bold relative transition-colors";
const activeClass = "text-[#2DD4C8] font-bold";
```

### Page container (width issue)

File: root layout or `src/app/(app)/layout.tsx` or equivalent.

**Find this:**
```tsx
<div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px' }}>
```

**Replace with:**
```tsx
<div style={{ width: '100%', padding: '0 40px' }}>
```

Or Tailwind: `w-full px-10`.

On very wide viewports (1920px+), this fills edge to edge. That's the intent. Snowflake does this. Harvey does this. The dashboard breathes.

If content readability suffers on ultra-wide (2560px+), add at root:
```tsx
<div style={{ width: '100%', maxWidth: '1800px', margin: '0 auto', padding: '0 40px' }}>
```

1800px cap only — never 1280px. And prefer true full-bleed where content is visual-heavy (Tower, Library).

### Section rhythm

File: wherever page content sections live.

Where you see `marginBottom: '32px'` or `gap: '24px'` at top-level section separators — bump to `48px` or `64px` on desktop:

```css
.page-section + .page-section {
  margin-top: 64px;             /* up from 32px */
}
```

Not every gap — just top-level section-to-section rhythm.

### Typography baseline

Audit `src/app/globals.css` or equivalent. Find anywhere that sets body font size.

**Replace 13px and 14px defaults with:**

```css
body {
  font-size: 15px;
  line-height: 1.55;
  font-family: 'DM Sans', -apple-system, sans-serif;
  color: #F5F5F0;
}

/* Caption / metadata tier — the ONLY acceptable place for smaller type */
.caption, .metadata, .timestamp {
  font-size: 12px;
  color: rgba(245, 245, 240, 0.72);   /* white at 72%, NOT grey */
  letter-spacing: 0.01em;
}
```

Note: even metadata uses *white at reduced opacity*, not grey. Different color profile, same psychological effect, aligned with design system.

---

## Files to touch

Claude Code will grep for the specific colors/values. Expected targets:

```bash
# Find the grey offender
git grep -l '139, ?134, ?128' -- 'src/'
git grep -l '#8B8680' -- 'src/'
git grep -l 'opacity.*0\.[1-6]' -- 'src/' | head

# Find 13px nav and 400 weight
git grep -l 'fontSize.*13' -- 'src/'
git grep -l 'fontWeight.*400' -- 'src/'

# Find the width cap
git grep -l '1280' -- 'src/'
git grep -l 'max-w-\[1280' -- 'src/'
git grep -l 'maxWidth.*1280' -- 'src/'
```

Replace each hit per the spec above. One commit per category is fine — or one commit for the whole design fix if small.

---

## Verification

After shipping, open `app.abarva.ai/dashboard` and paste into console:

```javascript
const nav = document.querySelector('nav');
const links = [...nav.querySelectorAll('a')].map(a => {
  const s = getComputedStyle(a);
  return { text: a.textContent.trim(), color: s.color, size: s.fontSize, weight: s.fontWeight };
});
console.table(links);
```

Every link should show:
- `color: "rgb(245, 245, 240)"` (or active/hover variant)
- `size: "15px"`
- `weight: "600"` (or "700" for active/hover)

If any link shows `color: "rgb(139, 134, 128)"` — still broken, find and fix the source.

---

## Acceptance

- All 7 nav items render in full white, 15px, 600 weight
- Active item is teal with underline; hover state is teal with underline
- Main content container extends to full viewport width on 1920px+ monitors (or caps at 1800px max)
- No `rgb(139, 134, 128)` anywhere in body text or nav text across the app
- Section-to-section spacing feels like a Snowflake dashboard, not a Bootstrap template
- User looks at it without a complaint

---

## Override on Pack F

Pack F Part 1 ("Menu restructure") contained this instruction:

> *"Three scaffolding items (Home, Data, Admin) at 60% opacity until hover."*

**Delete that line. Ignore it entirely.** All 6 nav items in Pack F's menu get equal primary treatment per this pack's spec. The menu restructure (count, order, labels) still applies — but nothing gets greyed or de-emphasized.

---

## What this pack ships

Nav looks how it's supposed to. Content uses the viewport. Typography has a pulse. Design system memory and live product stop disagreeing.
