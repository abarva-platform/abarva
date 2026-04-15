# AbarVa — Complete Build Instruction
# Read every word before touching anything.
# Execute tasks in exact order. No skipping.

---

## WHAT THIS BUILDS

The complete AbarVa Maestro workspace with:
- Persistent top nav (identical on every page)
- Clerk auth (sign-in, session persistence, identity in nav)
- /admin — Maestro workspace with 6 tabs
- /admin/client/[id] — per-client workspace
- All navigation paths working and tested

---

## DESIGN SYSTEM (non-negotiable)

Background:   #060A12  (every page, no exceptions)
Card:         #0D1520
Border:       #1C2D45
Teal:         #2DD4C8
White:        #EFF6FF
Muted:        #94A3B8
Dim:          #475569
Red:          #EF4444
Amber:        #F59E0B
Green:        #34D399
Mono font:    "JetBrains Mono", monospace
Sans font:    "DM Sans", sans-serif
Serif font:   Georgia, serif
Max width:    1400px
Padding:      28px sides

---

## TASK 1 — UPDATE AbarvaNav.tsx

Replace src/components/AbarvaNav.tsx with a nav that:

### Structure (left to right):
[AbarVa wordmark] [Products ▾] [Solutions ▾] [Maestro] [← Home?] ... [client pill (signed in only)] [identity (signed in) OR Maestro button (signed out)]

### Wordmark:
- "Abar" in Georgia serif 17px 800 white
- "Va" in Georgia serif 23px 900 teal #2DD4C8
- Below it: "know it. build it. own it." in JetBrains Mono 9px white lowercase
- Always links to /

### Products ▾ dropdown (hover):
Five products with name + description:
- Situation → "What's actually broken — and what is it costing?"
- Strategy → "Where should we place our AI bets?"
- Vendor → "Which vendor wins in our situation?"
- Business Case → "How do we justify this to the board?"
- Outcomes → "Did it work — and can we prove it?"
Each links to /[path]?client=[currentClientId]
currentClientId defaults to 'meridian' when not signed in

### Solutions ▾ dropdown (hover):
Three solutions (NO owner badges):
- AI-Powered PDLC → "Build products faster with AI agents" → /solutions/pdlc
- AI-Powered Delivery → "Replace consulting teams with Maestros" → /solutions/delivery
- Margin Optimization → "Recover margin across revenue, cost, AI" → /solutions/margin

### Maestro nav item:
Links to /admin. Active when on any /admin page.

### RIGHT SIDE — two states:

STATE A (not signed in):
  - Button: "Maestro →" teal background → links to /sign-in

STATE B (signed in — use useUser() from @clerk/nextjs):
  - Client context pill: shows current client name + colored dot → dropdown
    Dropdown shows all 5 clients. Click = switches ?client= param
    Clients: meridian, firstcapital, apexretail (demo), arcturus, nexora (maestro)
  - Identity: first name + "Maestro" role text + avatar circle (initials, teal)
    Avatar links to /admin

### Implementation notes:
- 'use client' at top
- Import { useUser } from '@clerk/nextjs'
- Dropdown on hover (onMouseEnter/Leave with timer to prevent flicker)
- Background: #0D1520, border-bottom: 1px solid #1C2D45
- Height: 64px, sticky top-0, z-index 200
- Active page: teal text + teal underline

---

## TASK 2 — UPDATE src/app/sign-in/page.tsx

Keep existing structure. Verify:
- Dark branded design (#060A12 background)
- AbarVa wordmark at top links to /
- "← Back to AbarVa" link
- Clerk SignIn component with dark appearance vars:
  colorPrimary: '#2DD4C8'
  colorBackground: '#0D1520'
  colorInputBackground: '#060A12'
  colorInputText: '#EFF6FF'
  colorText: '#EFF6FF'
  colorTextSecondary: '#94A3B8'
- redirectUrl="/admin"
- No sign-up link visible

---

## TASK 3 — CREATE /admin PAGE (Maestro workspace)

Replace src/app/admin/page.tsx entirely.

This is the Maestro workspace. Shows ONE client at a time.
On first load: shows the first client (arcturus).

### Top section (below nav):
Client header bar:
  - Client name (large, 16px 500)
  - Subtitle: vertical · revenue · employees · HQ · region
  - Status badge (Active/Setup)

### 6 TABS:
Tab bar below client header. All 6 always visible.
Post-baseline tabs (Approvals, Outcomes) show as slightly dimmed until unlocked.

#### TAB 1 — Admin (default on first visit, renames to "Admin" after baseline)
Four sub-sections as pill buttons:
  [Setup & engagement] [Data & approvals] [Maestro users] [Security & governance]

**Setup & engagement sub-section:**
Left column — 4 steps:
  Step 1 ✓ Organization confirmed (green checkmark)
    Shows: client name, type, revenue
    Shows: "Completed by [name] · [date]"
  Step 2 (current) Upload foundation data
    Shows: file list with green/amber dots
    CTA: "+ Upload file" + "Download templates"
  Step 3 Invite stakeholders
    CTA: "+ Add stakeholder"
  Step 4 Lock the baseline
    CTA: "Schedule baseline interview →"

Right column:
  Engagement settings card (key-value pairs with edit button)
  Products unlocked card (5 products with Active/Partial/Locked status and mini progress bars)

**Data & approvals sub-section:**
  Files pending approval (with Approve/Reject buttons)
  Approved files list (with Replace buttons)
  "+ Upload file" button

**Maestro users sub-section:**
  Maestro team card: avatar + name + email + role badge + Edit/Remove buttons
  "+ Invite Maestro" button
  Client stakeholders card: same format + "Approvals only" note
  "+ Invite client" button

**Security & governance sub-section:**
  Two cards side by side: Access & security / Data governance
  Each has toggle rows (label + sub-label + toggle switch)
  Compliance card: SOC 2, GDPR, HIPAA with checkmarks

#### TAB 2 — Overview
Two rows of 4 metric cards:
  Each card: colored left border (red/amber), label in mono uppercase, large value, benchmark line, gap line in color
  Row 1 (red): C/I Ratio 71%, AI initiatives 0/28, CDO Vacant, MAS Overdue
  Row 2 (amber/red): Portal 44%, Reporting 3 days, Net flows -$28B, AI maturity 28/100

Two-column layout below:
  Left (wider):
    Key findings card — 3 findings, each with:
      Colored left stripe (red/amber)
      Title (13px 500)
      Detail text (12px muted)
      Source pills (Client data · Industry benchmark · Genome)
    Next actions card — numbered 1/2/3, each with text + link
  Right (260px):
    Genome patterns card — 4 patterns with failure rate % prominent
    Recent activity card — time + text + type badge
    Pending approvals mini card

#### TAB 3 — Data Intelligence
Overall confidence score (top right): 91%

4 sub-tabs as pill buttons:
  [Client data 92%] [Industry 89%] [Public data 86%] [Genome patterns 97%]
  Each pill shows colored dot + name + confidence %
  Active pill highlighted in that dimension's color

Content area (switches on pill click):
  Left (wider): file list for that dimension
    Each file: type icon badge + filename + meta + status pill + confidence %
    Missing files: dimmed, shows unlock description + confidence gain
  Right (220px):
    Confidence breakdown card (overall + 4 bars)
    Critical findings card (3 findings with ibadge + source)
    Missing data card (name + gain % + unlock description)

CLIENT DATA files:
  arcturus_financials_2024.xlsx — Active 96%
  arcturus_technology_inventory.xlsx — Active 88%
  arcturus_leadership_profiles.docx — Active 91%
  arcturus_regulatory_matters.xlsx — Active 94%
  Vendor contracts — Missing (unlocks Vendor product +5%)
  Outcome baselines — Missing (unlocks Business Case +7%)

INDUSTRY files:
  Asset Management Peer Benchmarks 2025 — Active 94%
  AI Maturity Index — Asset Management 2025 — Active 88%
  Technology Spend Benchmarks — FS — Active 91%
  Regulatory AI Compliance Requirements — Active 96%
  Client Portal Benchmarks — WM — Active 90%

PUBLIC DATA files:
  Arcturus Annual Report 2024 — Parsed 94%
  SEC Form ADV 2025 — Parsed 98%
  MAS FEAT public registry — Live 99%
  Press & news monitoring 90 days — Live 82%

GENOME PATTERNS files:
  CDO vacancy at AI governance crunch — Risk 79%
  Multiple AI without golden record — Risk 86%
  CRM below 50% adoption at 18mo — Risk 64%
  Regulatory overdue no plan — Risk 89%

#### TAB 4 — Projects
Two view modes (pill switcher): [Dashboard] [All projects]

**Dashboard view:**
Stats strip (5 cards): Total projects, Active, Completed, Product runs this month, Maestros active

Maestro usage table:
  Columns: Maestro | Projects | Product runs | Last active | Most used | Activity bar
  Shows all Maestros and their usage

Active projects quick view:
  Compact table: Project | Progress | Products | Findings | Maestro
  "View all →" links to table view

**All projects table view:**
Filter bar: search input + [All] [Active] [Complete] [Archived] + Sort select

Table columns:
  Project (name + client + date) | Maestro | Products used (mini pills) | Last active | Findings | Progress bar | Status badge

Each row clickable → opens that project detail

Project cards for Arcturus:
  "AI governance gap analysis" — Active — 60% — Situation✓ Strategy→
  "Salesforce FSC recovery" — In progress — 25% — Situation✓
  "Initial situation diagnostic" — Complete — 100% — Situation✓

New project form (shown when "+ New project" clicked):
  Name input + Problem description textarea + Products selector + Create/Cancel buttons

#### TAB 5 — Approvals
Three sections:
  1. Pending approval (Admin reviews Maestro uploads)
     File row: icon + name + meta | who uploaded | Approve/Reject buttons
  2. Sent to client (awaiting client response)
     File row: name + sent to | Awaiting badge
  3. Resolved (history)
     File row: name | Approved/Restricted badge with comment | dimmed

#### TAB 6 — Activity
Description line + Export CSV button

Cards organized by project:
  Card header: project name + status badge
  Table rows: Time | Actor | Action + detail | Type badge
  Type badges: Product (purple) | Data (teal) | Approval (amber) | Baseline (green) | Setup (gray)

---

## TASK 4 — CREATE /admin/client/[id] PAGE

Create src/app/admin/client/[id]/page.tsx

Uses the same 6-tab layout as /admin but for a specific client.
useParams() to get the id.

Client lookup:
  meridian → Meridian Health System · Healthcare · $11.2B · NA
  firstcapital → First Capital Financial · Financial Services · $1.84B · NA
  apexretail → Apex Retail Group · Retail · $12.4B · NA
  arcturus → Arcturus Financial Group · Asset Management · $16.2B · Global
  nexora → Nexora Retail & Consumer · Retail & CPG · $18.4B · Global

Top bar: "← Maestro" link + client name/subtitle + status badge + identity (name + avatar)
Same 6 tabs. Same tab content. Client data switches based on id.

---

## TASK 5 — UPDATE HOMEPAGE /

In src/app/page.tsx, update the client entry section to show TWO tiers:

TIER 1 — "Demo clients · no login required" (teal eyebrow label + divider line)
  Three cards: Meridian Health, First Capital, Apex Retail
  Each card: colored dot + name + subtitle
  Click → /diagnose?client=[id]
  No login required

TIER 2 — "Maestro access · login required" (muted eyebrow label + divider line)
  Cards: Arcturus Financial, Nexora Retail, + New client setup
  Each card: same style but opacity 0.8, brightens on hover
  Click → /sign-in → /admin (Clerk handles redirect)

---

## TASK 6 — CREATE QA_CHECKLIST.md

Create QA_CHECKLIST.md in the repo root:

```markdown
# AbarVa QA Checklist
Last verified: [date]

## Navigation (test on every page)
- [ ] AbarVa logo → / (homepage) from every page
- [ ] Products ▾ hover → dropdown with 5 items appears
- [ ] Products ▾ → Situation → opens /diagnose?client=[current]
- [ ] Solutions ▾ hover → dropdown with 3 items appears
- [ ] Solutions ▾ → PDLC → opens /solutions/pdlc
- [ ] Maestro nav item active when on /admin pages

## Auth flows
- [ ] Visit /admin signed out → redirects to /sign-in
- [ ] /sign-in page loads with dark branded design
- [ ] Sign in with demo@abarva.com → lands on /admin
- [ ] Session persists — close tab, reopen /admin → straight in, no sign-in
- [ ] Identity shows top-right: name + role + avatar
- [ ] Sign out → back to /
- [ ] After sign out: Maestro button shown (not avatar)
- [ ] After sign in: avatar shown (not Maestro button)

## Homepage
- [ ] Hero loads: "Know it. Build it. Own it."
- [ ] Products ▾ dropdown works
- [ ] Solutions ▾ dropdown works
- [ ] Demo client cards visible (3 cards, no login required)
- [ ] Maestro client cards visible (3 cards, dimmed)
- [ ] Click Meridian Health → /diagnose?client=meridian (no login)
- [ ] Click Arcturus Financial → /sign-in (login required)

## Maestro workspace /admin
- [ ] 6 tabs visible: Admin, Overview, Data Intelligence, Projects, Approvals, Activity
- [ ] Admin tab loads by default
- [ ] Admin → 4 sub-sections: Setup & engagement, Data & approvals, Maestro users, Security & governance
- [ ] All 4 sub-section pills clickable → content switches
- [ ] Overview tab → 8 metrics load with red/amber borders
- [ ] Overview → findings load with source pills
- [ ] Data Intelligence tab → 4 sub-tabs visible
- [ ] Data Intelligence → click each sub-tab → content switches
- [ ] Data Intelligence → Client data sub-tab → 4 active files + 2 missing
- [ ] Data Intelligence → Genome sub-tab → 4 patterns with risk %
- [ ] Projects tab → Dashboard view loads with stats strip
- [ ] Projects → "All projects" → table view loads
- [ ] Projects → filter buttons work
- [ ] Projects → "+ New project" → form appears
- [ ] Approvals tab → 3 sections visible
- [ ] Approvals → Approve button → file status changes
- [ ] Activity tab → timeline loads organized by project

## Product pages
- [ ] /diagnose?client=meridian → loads Meridian data
- [ ] /diagnose?client=arcturus → loads Arcturus data (signed in)
- [ ] /ai-strategy?client=meridian → loads
- [ ] /select?client=meridian → loads
- [ ] /justify?client=meridian → loads
- [ ] /outcomes?client=meridian → loads
- [ ] Back to Maestro from product page → /admin (no re-auth)

## Client switching
- [ ] Client pill visible when signed in
- [ ] Click pill → dropdown shows all 5 clients
- [ ] Switch from Arcturus to Meridian → workspace reloads with Meridian data

## Console checks
- [ ] npm run build → zero TypeScript errors
- [ ] Homepage console → zero errors
- [ ] /admin console → zero errors
- [ ] /diagnose console → zero errors
```

---

## TASK 7 — BUILD AND VERIFY

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Fix ALL TypeScript errors before proceeding
# Common issues:
# - useUser() returns user | null/undefined — always use optional chaining
# - useParams() returns string | string[] — cast as string
# - Missing 'use client' directives on interactive components
# - Clerk hooks only work in 'use client' components

# 4. Commit
git add -A
git commit -m "feat: Complete Maestro workspace — 6 tabs, auth, nav, data intelligence, projects"
git push
```

---

## TASK 8 — SELF QA (run before committing)

After build succeeds, Claude Code runs through this checklist:

```
VERIFY EACH ITEM. Mark pass/fail. Fix failures before commit.

NAV:
□ AbarvaNav renders on homepage
□ Products dropdown has 5 items with descriptions
□ Solutions dropdown has 3 items, NO owner badges
□ Maestro button shows when signed out
□ Identity shows when signed in (use useUser mock or real auth)

PAGES EXIST (check file system):
□ src/app/page.tsx
□ src/app/sign-in/page.tsx
□ src/app/admin/page.tsx
□ src/app/admin/client/[id]/page.tsx
□ src/components/AbarvaNav.tsx

MIDDLEWARE:
□ /admin is protected (not in public routes)
□ /diagnose is public
□ /sign-in is public

TABS (verify all 6 render without crashing):
□ Admin tab with 4 sub-sections
□ Overview tab with metrics
□ Data Intelligence tab with 4 sub-tabs
□ Projects tab with Dashboard + Table views
□ Approvals tab with 3 sections
□ Activity tab with timeline

IMPORTS:
□ All imports resolve — no missing modules
□ Data files import correctly from src/data/[client]/
□ Clerk imports from @clerk/nextjs

BUILD:
□ npm run build exits 0
□ Zero TypeScript errors
□ Zero ESLint errors blocking build
```

---

## IMPORTANT RULES

1. Every component that uses hooks or browser APIs must have 'use client' at top
2. Every page must use the dark design system — #060A12 background, never white
3. AbarvaNav appears on EVERY page — import it in each page file
4. Never hardcode client-specific data in components — always read from src/data/[client]/
5. Tab switching must use useState — never route changes (tabs are in-page)
6. Sub-section switching (Admin tab pills) must use useState
7. All buttons and interactive elements must have cursor: pointer
8. Clerk useUser() returns null before loaded — always check isLoaded first

