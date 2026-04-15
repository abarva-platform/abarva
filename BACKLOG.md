# AbarVa — UI Backlog
# Based on live site audit: nexus-vert-kappa.vercel.app
# Date: April 14, 2026
# Priority: P0 = demo blocker, P1 = important, P2 = polish

---

## CURRENT STATE SUMMARY (from live audit)

### What exists and works:
- Homepage: hero, stat cards, product cards, composite client cards ✓
- /platform: exists, has content (Intelligence/Genome/Maestro 3 cards) ✓
- /clients: exists, shows Meridian + Arcturus cards ✓
- /diagnose?client=meridian: full page, all 6 tabs working ✓
- /diagnose?client=arcturus: full page working ✓
- /solutions/pdlc: exists, hero + stats + phases + genome ✓
- /admin/client/arcturus: working, Data & approvals tab ✓
- Nav: Intelligence ▾, Solutions ▾, Platform, Clients ✓
- Auth: Clerk, admin login working ✓

### What is broken or missing:
- Ask Anything (Tab 4 on /diagnose): "Something went wrong" error
- /solutions/pdlc: shows "1 OF 4" — should be 1 of 3
- Homepage: still shows "Three composite organizations" + First Capital + Apex
- Homepage: "See it with Meridian Health" CTA
- Admin: no "Upload new files" button — only "Replace" per file
- No engagement engine UI yet (being built by Claude Code now)

---

## P0 — DEMO BLOCKERS (fix immediately)

### P0-01: Ask Anything broken
**Page:** /diagnose (Tab 4)
**Issue:** "Something went wrong" on every question
**Fix:** Check ANTHROPIC_API_KEY in Vercel environment variables
**Impact:** Demo path includes Tab 4 — critical failure point

### P0-02: "1 OF 4" on solutions page
**Page:** /solutions/pdlc
**Issue:** Shows "SOLUTION · 1 OF 4" — we have 3 solutions
**Fix:** Change to "1 OF 3" and update any other solution count references
**Impact:** Shail will notice the inconsistency

### P0-03: Homepage still references First Capital + Apex
**Page:** /
**Issue:** "Three composite organizations" section shows all 3 old clients.
We have decided on 2 demo clients only: Meridian + Arcturus.
"See it with Meridian Health →" CTA is correct.
**Fix:**
- "Three composite organizations" → "Two composite organizations"
- Remove First Capital Financial card
- Remove Apex Retail Group card
- Keep: Meridian Health + Arcturus Financial only
- Update subtitle copy accordingly

### P0-04: Admin — no bulk upload button
**Page:** /admin/client/arcturus → Data & approvals tab
**Issue:** Only "Replace" button per existing file. Cannot add new files.
**Fix:** Add "Upload new files" button above the approved files list.
Accepts multiple files. Adds to approved files list.
(Claude Code may already be building this as part of engagement engine)

---

## P1 — LAYOUT ISSUES (fix before demo)

### P1-01: Homepage hero — dead space left and right
**Page:** /
**Issue:** Hero section has ~150-200px of blank space on each side.
Left text takes up ~40% of viewport, stat cards take up ~40%,
large gap between them and at edges. Content wrapper too narrow.
**Fix:**
- Increase content wrapper to max-w-7xl
- Hero grid should stretch: left text 45%, right stat cards 50%, gap 5%
- Stat cards: make numbers larger (current size too small for card height)
- Ensure full content area is used at 1440px viewport width

### P1-02: Homepage sections below hero — left-aligned text only
**Page:** /
**Issue:** "Intelligence that tells you what to do next" section:
product cards are good (5-col grid works well).
But section header text ("Five products · One intelligence layer") 
is left-aligned in ~50% width — right half empty.
"Diagnosis is just the start" section: same issue.
**Fix:** Section headers and body text should use full content width.
Not constrained to left half.

### P1-03: Admin page — right side completely blank
**Page:** /admin/client/arcturus
**Issue:** Content card (pending approval + approved files) is
single column, right side of page entirely empty.
No sidebar. On wide screen looks unfinished.
**Fix:** Two-column layout:
- Left 65%: pending approval card + approved files list
- Right 35%: sidebar showing:
  - Engagement settings (fee model, admin, start date)
  - Products unlocked (Situation Diagnosis Active, AI Strategy Active, etc.)
  - Quick stats (X files loaded, X approved, X pending)
  - Key client metrics (revenue, employees, vertical)

### P1-04: Platform page — too sparse
**Page:** /platform
**Issue:** Page exists but is minimal:
- Section 1: "Intelligence. Then execution. Fee on outcomes only." (text only, lots of blank space)
- Section 2: Three cards (Intelligence Layer, Genome, Maestro Model)
The page needs more depth to justify being a nav item.
**Fix:** Add below the existing content:
- The layer diagram we designed: 
  Intelligence layer (teal) → Solutions layer (amber) → 
  Knowledge/Genome layer (blue) → Foundation layer (green)
  Bold teal arrows between each layer
- How an engagement works: 5-phase timeline visual
  Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
  Each phase: name, what happens, what gets produced, gate
- The fee model explained visually:
  Baseline locked Day 0 → Monthly tracking → 
  Verified saving → Fee triggered
  "If outcomes don't happen, we don't get paid"

### P1-05: Clients page — shows 3 clients, should show 2
**Page:** /clients
**Issue:** Currently shows Meridian Health + Arcturus Financial 
(2 clients — this is correct now) but the headline says
"Three composite organizations." and there may be a third card.
**Fix:** 
- Confirm only 2 client cards show
- Update headline: "Two composite organizations. Real-world data. Live intelligence."
- Update subtitle to remove reference to "retail"
- Each card should have: scan animation on load, "See full intelligence →" CTA

### P1-06: Solutions page — engagement engine not wired
**Page:** /solutions/pdlc (and future /solutions/margin, /solutions/tech)
**Issue:** Page shows marketing content (phases, genome patterns, stats)
but logged-in state has no engagement engine.
A logged-in Arcturus user should see AbarVa speak first from their data.
**Fix:** This is the engagement engine work in progress.
Once /engage/[clientId]/[solution] is built:
- Logged-in user at /solutions/pdlc → 
  show "Your engagement is in progress → Continue →"
  linking to /engage/arcturus/pdlc
- Not-logged-in → current marketing content stays

---

## P2 — NAVIGATION FIXES

### P2-01: Solutions dropdown — shows 4 solutions
**Location:** Nav → Solutions ▾
**Issue:** Shows 4 solutions. We have 3.
**Fix:** Remove AI-Powered Delivery from Solutions dropdown.
Keep: AI-Powered PDLC, Margin Optimization, Technology Modernization.
Update "View all solutions →" link if present.

### P2-02: Client switcher shows wrong clients
**Location:** Diagnose page — "Meridian / Arcturus" selector
**Issue:** May still show First Capital, Apex, Nexora
**Fix:** Show only: Meridian | Arcturus

### P2-03: Solutions dropdown — "1 OF 4" language
**Location:** Any place that says "4 solutions"
**Fix:** Change to "3 solutions" throughout

---

## P2 — COPY FIXES

### P2-01: "See it with Meridian Health" CTA
**Page:** Homepage hero
**Issue:** CTA says "See it with Meridian Health →"
This is correct. Keep as is. But ensure it links to 
/diagnose?client=meridian (not a broken route).

### P2-02: Clients page copy
**Page:** /clients
**Fix:** 
- "Three composite organizations" → "Two composite organizations"
- "across healthcare, financial services, and retail" → 
  "across healthcare and financial services"
- Arcturus card: employees should be "13,000" not "3,400"
  (3,400 is wrong — Arcturus has 13,000 employees)

### P2-03: Platform page headline
**Page:** /platform
**Current:** "Intelligence. Then execution. Fee on outcomes only."
**Keep as is** — this is good copy.

---

## P2 — DESIGN POLISH

### P2-01: Homepage stat cards — numbers too small
**Page:** /
**Issue:** The 4 stat cards ($200B, 73%, Skin in the game, 48hrs) 
have numbers that are small relative to the card height.
**Fix:** Increase number font size. Add more visual weight.
Cards feel underpowered for the claims they're making.

### P2-02: /solutions/pdlc — hero gap
**Page:** /solutions/pdlc
**Issue:** Large gap between hero section and "Three Phases" section below.
Separator line creates dead space.
**Fix:** Reduce gap, tighter section transitions.

### P2-03: /diagnose — Tab 6 "Situation Brief Ready"
**Page:** /diagnose (Tab 6)
**Issue:** Tab 6 exists but has not been seen — may be empty or placeholder.
**Fix:** Check what Tab 6 shows. If empty, either:
- Remove it until the engagement engine produces a brief, or
- Show: "Your Situation Brief will appear here once Phase 1 is complete."
  with a CTA to start the engagement

### P2-04: Genome patterns section
**Page:** /solutions/pdlc
**Issue:** Genome patterns are listed as static content.
They should reference which patterns apply to the current client
when logged in.
**Fix:** When logged in as Arcturus:
- Highlight the patterns that are confirmed for Arcturus
- Show evidence per pattern from their datasets
This connects to the engagement engine Phase 0 output.

---

## ENGAGEMENT ENGINE — STATUS

**Being built now by Claude Code:**
- /engage/[clientId]/[solution] — Maestro Workspace
- /portal/[solution] — Client Portal
- Database: 15 tables (engagements, phases, workstreams, 
  findings, outputs, approvals, uploads, activity, genome_matches, baseline)
- Prompting engine: solution-config.ts + engagement-prompts.ts
- First implementation: Arcturus × AI-Powered PDLC

**When engagement engine is complete, wire:**
- /solutions/pdlc → logged-in → redirect to /engage/arcturus/pdlc
- /portal/pdlc → Arcturus client portal
- Admin page → show active engagement status per client

---

## BUILD ORDER FOR CLAUDE CODE

After current engagement engine build:

1. P0-01: Fix Ask Anything API (ANTHROPIC_API_KEY)
2. P0-02: Fix "1 of 4" → "1 of 3" on solutions pages
3. P0-03: Fix homepage — remove First Capital + Apex cards
4. P1-01: Fix homepage hero layout (max-w-7xl, dead space)
5. P1-03: Fix admin page — add right sidebar
6. P1-04: Add layer diagram + phase timeline to /platform
7. P1-05: Fix /clients — 2 clients, correct copy
8. P2-01: Fix nav Solutions dropdown (3 solutions only)
9. P2-02: Fix Arcturus employee count (3,400 → 13,000)
10. P2-03: Wire /solutions pages to engagement engine when ready

---

## CREDENTIALS (for testing)

| Email | Role | Routes to | Password |
|---|---|---|---|
| anand+clerk_test@abarva.com | admin | all clients | AbarVa2026! |
| anand.sundaram@thesundaram.com | admin | all clients | personal |
| investor+clerk_test@abarva.com | investor | /investor | Demo2026! |
| af@abarva.com | maestro | /admin/client/arcturus | Demo2026! |
| mh+clerk_test@abarva.com | maestro | /admin/client/meridian | Demo2026! |

Verification code: 424242

---

## DEMO PATH (Shail Jain — 8 minutes)

1. Homepage (30s) — hero, stat cards, product cards
2. /clients → click Arcturus Financial
3. /diagnose?client=arcturus — Tab 1: "AI spend up, pilots zero"
4. Switch to CFO — "Revenue growing. Margin collapsing."
5. Tab 2: Contradiction Map
6. Tab 3: What's At Risk — £840M
7. /ai-strategy?client=arcturus — ranked AI bets
8. /select?client=arcturus — vendor scored
9. /outcomes?client=arcturus — baseline locked D0
10. Close: "What would you want to see with your data?"

**SKIP:** Tab 4 Ask Anything (broken until P0-01 fixed)
**SKIP:** /platform, /engage (not yet wired for demo)

---

## COMMIT CONVENTION

Each fix should be committed separately:
- "fix: Ask Anything API - ANTHROPIC_API_KEY"
- "fix: solution count 4 → 3 throughout"
- "fix: homepage remove First Capital + Apex cards"
- "fix: homepage hero layout max-w-7xl"
- "fix: admin client page right sidebar"
- "feat: platform page layer diagram + phase timeline"
- "fix: clients page 2 clients + correct copy"
- "fix: nav solutions dropdown 3 solutions"
