# AbarVa · QA Checklist

**For:** nexus-depth · product-map · ask-intelligence
**Run on:** staging first, production only after staging sign-off
**Format:** check off as you go, log bugs in the template at the bottom

---

## Pre-flight

- [ ] Confirm all 3 PRs merged to `main` and deployed to staging
- [ ] `/` responds 200 on staging URL
- [ ] Browser dev tools open, console tab visible (catches client-side errors live)
- [ ] Test accounts ready: one Maestro, one client_viewer (Sarah at Meridian), one observer if configured
- [ ] Known-good engagement exists to test against (Meridian · Analytics Modernization recommended)

---

## 1 · product-map (5-item nav restructure)

### 1.1 · Top nav structure

- [ ] Log in as Maestro
- [ ] Nav shows exactly **5 items** in this order: `Home · Engagements · Intelligence · Control Tower · Platform`
- [ ] No "Data setup," "User setup," "Dashboard," or "Admin" in top nav
- [ ] Active nav item has teal underline + teal text (not grey opacity)
- [ ] Hover on nav link turns teal before click

**Fail signal:** 6 or 7 items visible · old labels present · grey text · no hover state

### 1.2 · Route redirects (301s)

Paste each URL directly into the address bar and confirm redirect:

- [ ] `/dashboard` → `/home` (200 after redirect)
- [ ] `/data` → `/platform/data`
- [ ] `/data/sources` → `/platform/data/sources`
- [ ] `/data/onboard` → `/platform/data/onboard`
- [ ] `/users/new` → `/platform/users/new`
- [ ] `/admin` → `/platform`
- [ ] `/admin/agents` → `/platform/observability/agents`

**Fail signal:** 404 on any old URL · hard redirect with full page flash (should be client-side)

### 1.3 · Platform overview page (`/platform`)

- [ ] Lands on overview with 4 hero cards
- [ ] **Data coverage** card shows real percentage (not "--" or "N/A")
- [ ] **Users** card shows real counts ("X active · Y pending")
- [ ] **Integrations** card shows real status counts
- [ ] **Platform health** card shows real uptime + agent count
- [ ] Each hero card has CTA that navigates to the detail section
- [ ] Below hero cards: data dimension heat map (20 domains, color-coded by fill %)

**Fail signal:** any card shows placeholder text · uptime hardcoded · heat map missing

### 1.4 · Role visibility

- [ ] Log out, log in as **Maestro** — nav shows all 5 items + client selector on Tower
- [ ] Log out, log in as **client_viewer** (Sarah)
  - [ ] Nav shows only 3 items: Home · Engagements · Control Tower
  - [ ] **No** Intelligence, **no** Platform visible anywhere
  - [ ] **No** client selector on Tower (scoped to her client only)
  - [ ] Typing `/platform` in URL bar redirects to Home or 403 (not 200)
  - [ ] Typing `/intelligence` redirects to Home or 403
- [ ] Log out, log in as **observer** (if configured)
  - [ ] Nav shows 2 items: Home + Control Tower
  - [ ] Tower is read-only (no edit buttons, no data-add CTAs)

**Fail signal:** client_viewer can see or reach Platform · Intelligence · other clients' data

---

## 2 · ask-intelligence

### 2.1 · Layout

- [ ] Navigate to `/intelligence`
- [ ] Ask Intelligence bar is prominent above the tabs (Library · Insights · Live)
- [ ] Input placeholder reads something like "Ask Intelligence anything — vendor comparisons, pattern lookups, topic synthesis…"
- [ ] `⌘ K` keyboard hint visible on right edge of input
- [ ] 4 "TRY" suggestion chips below the input
- [ ] Input focus state: teal border + teal-tinted glow

### 2.2 · Query with available data

- [ ] Type: `What do we know about Analytics Modernization?`
- [ ] Answer streams in within **3 seconds**
- [ ] First token appears in **under 1.5 seconds**
- [ ] Answer panel has 3px teal left border
- [ ] Answer has specific bolded terms (vendor names, numbers, pattern codes)
- [ ] Source pills appear at bottom, each with type badge (`TOPIC`, `VENDOR`, `PATTERN`, etc.)
- [ ] At least 3 source pills for a topic query
- [ ] Click a source pill → opens the Library entry (either drawer or new page)
- [ ] 3 "Dig deeper" follow-up chips appear

**Fail signal:** >5s to first token · no source attribution · pills don't navigate · answer fabricates data not in Library

### 2.3 · Query with no data (honest "don't know")

- [ ] Type: `What is the average M365 Copilot adoption rate across Fortune 500 manufacturers?`
- [ ] Response explicitly says *"We don't have indexed data on this"* (or similar)
- [ ] Does NOT invent a specific percentage
- [ ] Offers either: browse Library, add source, narrow question

**Fail signal:** any fabricated number or confident claim without source pills

### 2.4 · Shareable URL

- [ ] After a query, check URL: `/intelligence/ask?q=<encoded>`
- [ ] Copy URL
- [ ] Open in private/incognito window
- [ ] Same answer renders without user login (or with a different account)

**Fail signal:** URL doesn't capture query · answer changes per user · 404

### 2.5 · Intent routing (verify speed)

- [ ] Open dev tools → Network tab
- [ ] Ask: `Compare Abridge and Nuance DAX`
- [ ] Observe: first network call is intent classifier (very fast, ~100ms)
- [ ] Main synthesis call fires after
- [ ] Total round-trip under 3s

**Fail signal:** no intent classifier call · single large call without routing

### 2.6 · Follow-up chip behavior

- [ ] After any answer, click a "Dig deeper" chip
- [ ] New query runs with the chip text as input
- [ ] URL updates to new `q=` param
- [ ] Previous answer is replaced, not stacked

---

## 3 · nexus-depth

### 3.1 · Open engagement

- [ ] Navigate to Meridian · Analytics Modernization
- [ ] Engagement console renders with:
  - [ ] Left rail: engagement meta (phase, sponsors, topics, stats)
  - [ ] Center: turn history scrollable top-to-bottom
  - [ ] Right rail: active patterns + recent contradictions + anticipation chips

### 3.2 · Topic intelligence injection

- [ ] Verify topic is assigned (should be "Analytics Modernization" for this test engagement)
- [ ] Send a turn: `What should I be asking Sarah next?`
- [ ] Nexus response references **specific diagnostic questions from the topic playbook** (not generic questions)
- [ ] Response cites patterns by code (F004, F008, or similar) if any active
- [ ] Response names specific vendors from the topic's vendor landscape

**Fail signal:** generic response that could apply to any engagement · no pattern codes · no specific vendor references

### 3.3 · Specificity test

- [ ] Send: `Draft a one-paragraph summary of our current state for leadership.`
- [ ] Response includes **specific Meridian numbers** (revenue $14.2B, 9 hospitals, specific tech stack items, etc.)
- [ ] Response is not generic prose that could apply to any healthcare org

**Fail signal:** "a major healthcare organization" instead of "Meridian" · "billions in revenue" instead of $14.2B · no named tech stack

### 3.4 · Citation pills (if Pack D Principle 2 is live)

- [ ] Check if response has clickable source indicators beside claims
- [ ] Click one — opens drawer showing the source chunk from knowledge layer

**Fail signal (if Pack D live):** no citations · citations don't open · sources are wrong

### 3.5 · Anticipation chips

- [ ] Below the response, verify 3-4 chips appear within 500ms of response completing
- [ ] Chips are contextually relevant (not generic "Tell me more")
- [ ] Click a chip → sends it as the next turn

### 3.6 · Empty state

- [ ] Create a new engagement with no topic assigned
- [ ] Try to send a turn
- [ ] Nexus prompts for topic assignment OR gracefully handles the absence
- [ ] No JavaScript errors in console

---

## 4 · Cross-cutting checks

### 4.1 · Forbidden names audit

Run this in browser dev tools console on each main surface (Home, Tower, Intelligence, Engagements):

```javascript
const forbidden = [
  'McKinsey','BCG','Deloitte','Accenture','Bain','Huron','Navigant',
  'Presbyterian','MD Anderson','CommonSpirit','HP Inc','CADE',
  'Meridian Health System,','First Capital Financial,' // dupe detection
];
const body = document.body.innerText;
forbidden.filter(n => body.includes(n));
```

- [ ] Returns empty array `[]` on Home
- [ ] Returns empty array on `/tower`
- [ ] Returns empty array on `/intelligence/library`
- [ ] Returns empty array on any engagement console
- [ ] Returns empty array on `/platform/data/sources`

**Fail signal:** any non-empty array — bug with severity HIGH, log immediately

### 4.2 · Design system adherence

For each main page:

- [ ] Nav text is **pure white** (`#F5F5F0` or `#FFFFFF`) — not grey (`rgb(139,134,128)` or `#8B8680`)
- [ ] Body text is **pure black** (`#0A0A0A` or `#000000`) — not grey
- [ ] Body font size is **15-16px**, not 13px
- [ ] Body font weight is 400-600, not 300 or lighter
- [ ] Main content is **full-bleed** with ~40px side padding — not capped at 1280px
- [ ] Intelligence type badges are **JetBrains Mono** (monospace), uppercase, teal
- [ ] AbarVa wordmark: `Abar` in white Georgia 17px/800, `Va` in teal Georgia 23px/900

Quick dev tools check:
```javascript
const nav = getComputedStyle(document.querySelector('nav a'));
({ color: nav.color, fontSize: nav.fontSize, fontWeight: nav.fontWeight });
```

Expected: `{ color: "rgb(245, 245, 240)", fontSize: "15px", fontWeight: "600" }`

**Fail signal:** any grey text anywhere · 13px anywhere · 1280px cap

### 4.3 · Regression on previously-shipped surfaces

- [ ] Engagement console still works (Nexus conversational flow intact)
- [ ] Tower still renders
- [ ] Home still renders (at new `/home` route)
- [ ] No broken images, no 404s on any static asset
- [ ] No uncaught JavaScript errors in console across any page

---

## 5 · Performance sanity

Rough numbers to eyeball — not formal perf testing:

- [ ] Home loads in **under 2 seconds** (first paint)
- [ ] `/intelligence` loads in under 3 seconds
- [ ] Engagement console loads in under 4 seconds (heavier surface)
- [ ] Ask Intelligence first token in under 1.5 seconds
- [ ] Nexus turn response starts streaming within 2 seconds

**Fail signal:** any page taking >5s to first paint on staging (might be cold-start, but if consistent = real)

---

## Bug triage template

When you find something, log it in this format:

```
## BUG-###

**Pack:** nexus-depth / product-map / ask-intelligence / cross-cutting
**Severity:** critical / high / medium / low
**URL:**
**Role:** Maestro / client_viewer / observer
**Browser:** Chrome Xxx / Safari Xxx / Firefox Xxx

**What happened:**
(one sentence)

**What should happen:**
(one sentence)

**Reproduction:**
1.
2.
3.

**Evidence:**
(screenshot path, console error, network call details)
```

### Severity definitions

| Severity | Definition | Response time |
|---|---|---|
| **Critical** | Breaks core flow (Nexus won't respond, nav broken, forbidden-name leak) | Block production promotion · fix same-day |
| **High** | Wrong data, wrong role visibility, privacy boundary violation | Fix before production |
| **Medium** | UX friction, design regression, performance issue | Fix within the week |
| **Low** | Copy, spacing, minor visual inconsistency | Next maintenance pass |

---

## Pre-Codex gate

Before Codex's Pack J seed data lands on staging, confirm:

- [ ] product-map is green (5-item nav locked, redirects working, role visibility correct)
- [ ] Migrations 027 + 029 applied successfully on staging
- [ ] Scaffold files exist: `src/scripts/seed/meridian-enterprise.ts` (base), `firstcapital-enterprise.ts`, `apex-enterprise.ts`, `_shared/vendor-whitelist.ts`, forbidden-name guard
- [ ] Existing seed (thin version) runs clean without errors

If any gate fails, do **not** dispatch Codex. Fix first.

---

## Post-Codex re-test (narrow, not full)

After Codex's PR merges and deploys:

- [ ] Open Meridian Tower → AI portfolio shows **42 use cases** (not 10)
- [ ] Click into a use case → vendor shown is from whitelist (Abridge, Cohere Health, Moveworks, etc.)
- [ ] Meridian monthly AI spend ≈ **$9.5M** (check Tower or `/platform/data/sources` summary)
- [ ] First Capital Tower shows **34 use cases**, ~$6.8M/mo
- [ ] Apex Tower shows **29 use cases**, ~$4.2M/mo
- [ ] Ask Intelligence query: "compare Abridge and Nuance DAX" — response now has deployment data (the "both deployed at Meridian" contradiction visible)
- [ ] Run forbidden-names audit (section 4.1) again — still empty arrays

**Fail signal:** use case counts wrong · forbidden names appear (possibly slipped in via Codex's expansion) · cost totals don't reconcile

---

## Sign-off for production

All of the following must be true before promoting main → production:

- [ ] All sections 1-4 complete with no Critical or High bugs open
- [ ] Forbidden-names audit returns empty on all surfaces
- [ ] Design system adherence confirmed (pure white/black, 15-16px, full-bleed)
- [ ] Role visibility correct for all test accounts
- [ ] No regressions on engagement console or Tower
- [ ] Codex post-test (section above) complete if Codex PR has landed
- [ ] Manual smoke test: log in as Sarah (client_viewer), open her Tower, verify she sees only Meridian data and 3 nav items max

**Sign-off:** Anand · Date · Commit hash

---

## Notes / anomalies

(Use this space to jot things that don't fit the checklist — unusual console warnings, minor visual inconsistencies, questions for Claude Code)

·
·
·
