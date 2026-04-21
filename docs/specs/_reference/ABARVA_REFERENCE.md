# AbarVa — Complete Product & Technical Reference

> This document is the single source of truth for the AbarVa platform built in the `nexus` repository. It covers product purpose, architecture, design system, all page specs, components, data, APIs, and deployment. Intended as a rebuild guide.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Authentication & User Roles](#4-authentication--user-roles)
5. [Design System](#5-design-system)
6. [Navigation (AbarvaNav)](#6-navigation-abarvanav)
7. [Page Inventory & Specs](#7-page-inventory--specs)
8. [Data Architecture](#8-data-architecture)
9. [API Routes](#9-api-routes)
10. [Component Library](#10-component-library)
11. [Client Context & State](#11-client-context--state)
12. [Deployment](#12-deployment)
13. [Environment Variables](#13-environment-variables)

---

## 1. Product Overview

**AbarVa** is an enterprise AI transformation consulting platform. It diagnoses what is broken inside large organizations, prescribes the right architecture and vendors, and embeds a small "Maestro" team to execute — with a fee tied to outcomes, not hours.

### Tagline
> "know it. build it. own it."

### Brand Statement
> "Act on intelligence. Before the window closes."

### Core Value Proposition
AbarVa diagnoses what's broken, prescribes the right architecture and vendors, and embeds a small Maestro team to execute — fee tied to your outcomes, not our hours.

### The Four-Step Model
| Step | Name | Description |
|------|------|-------------|
| 01 | DIAGNOSE | Situation product · 48hrs · your data |
| 02 | PRESCRIBE | Strategy + Vendor + Business Case |
| 03 | EXECUTE | Maestro team embeds · knowledge stays |
| 04 | VERIFY | Baseline vs actuals · fee on outcomes only |

> The baseline is locked on Day 0 and is immutable. The fee is calculated only against verified outcome delivery.

### The Transformation Genome
AbarVa's intelligence layer runs on 340 cross-client failure patterns — the "Transformation Genome." Every diagnosis, vendor recommendation, and business case is validated against this pattern library.

### Demo Organizations
The platform ships with two composite demo organizations:

| Client | Short Name | Industry | Revenue | Color |
|--------|-----------|----------|---------|-------|
| Meridian Health System | Meridian Health | Healthcare (IDN) | $11.2B | `#2DD4C8` (teal) |
| Arcturus Financial Group | Arcturus Financial | Financial Services (Asset Manager) | $16.2B | `#818CF8` (indigo) |
| Apex Retail Group | Apex Retail | Retail | — | `#F59E0B` (amber) |

---

## 2. Tech Stack

### Core Framework
| Package | Version |
|---------|---------|
| Next.js | 16.2.2 |
| React | 19.2.4 |
| TypeScript | ^5 |

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@clerk/nextjs` | ^7.0.11 | Authentication, user metadata, role management |
| `@anthropic-ai/sdk` | ^0.85.0 | Claude API for intelligence generation |
| `@supabase/supabase-js` | ^2.102.1 | Backend database (engagements, phases, outputs) |
| `posthog-js` | ^1.368.0 | Product analytics |
| `tailwindcss` | ^4 | Utility CSS (PostCSS config) |
| `@playwright/test` | ^1.59.1 | End-to-end tests |

### NPM Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run test:nav     # Navigation tests (Jest)
npm run test:e2e     # End-to-end tests (Playwright)
npm run seed         # Seed demo datasets
```

---

## 3. Repository Structure

```
nexus/
├── src/
│   ├── app/                   # Next.js App Router pages + API routes
│   │   ├── page.tsx           # Home page (/)
│   │   ├── layout.tsx         # Root layout (Clerk provider, fonts)
│   │   ├── admin/             # Admin workspace pages
│   │   │   └── client/[id]/   # Maestro client home (the client workspace)
│   │   ├── api/               # API routes (Claude, Supabase, Clerk)
│   │   ├── solutions/         # Solutions library + detail pages
│   │   ├── engage/            # Engagement workflow pages
│   │   ├── portal/            # Client portal
│   │   └── [module pages]/    # 9 AVR intelligence modules
│   ├── components/            # Shared React components
│   ├── data/                  # Embedded client + industry datasets
│   │   ├── meridian/          # Meridian Health data (14 files)
│   │   ├── arcturus/          # Arcturus Financial data (9 files)
│   │   ├── apexretail/        # Apex Retail data (16 files)
│   │   ├── firstcapital/      # First Capital data (14 files)
│   │   ├── nexora/            # Nexora data (8 files)
│   │   └── knowledge/         # Industry benchmarks (finserv, retail, cross-industry)
│   └── lib/                   # Utilities, hooks, helpers
├── public/                    # Static assets
├── ABARVA_REFERENCE.md        # This file
└── next.config.ts
```

---

## 4. Authentication & User Roles

### Provider
Clerk (`@clerk/nextjs`) handles all authentication. The root layout wraps the entire app in `<ClerkProvider>`.

### ClerkProvider Config (`src/app/layout.tsx`)
```typescript
<ClerkProvider
  signInUrl="/sign-in"
  afterSignOutUrl="/"
  signInForceRedirectUrl="/auth-redirect"
  signUpForceRedirectUrl="/auth-redirect"
>
```

After sign-in, users land on `/auth-redirect` which reads `publicMetadata.role` and redirects accordingly.

### User Roles (set in Clerk `publicMetadata`)

| Role | `publicMetadata.role` | `publicMetadata.clientId` | Access |
|------|----------------------|--------------------------|--------|
| Admin | `"admin"` | — | All clients, all modules, admin pages, client switcher |
| Investor | `"investor"` | — | All clients, investor page, all modules |
| Client | `"client"` | e.g. `"meridian"` | Single assigned client only |

### Demo Users (OTP: 424242)
- Admin user: full access
- Arcturus client user
- Meridian client user
- Investor Demo user

### Middleware
`middleware.ts` at root protects routes — public routes (home, solutions, platform, investor, sign-in) pass through; signed-in routes require Clerk session.

---

## 5. Design System

### Philosophy
AbarVa follows a Harvey.ai-inspired typography-first aesthetic: large serif statements, generous whitespace, disciplined color usage. Two visual contexts:
- **Light sections**: cream background, near-black text, white cards — used for marketing and client-facing pages
- **Dark sections**: near-black background, pale text, dark cards — used within product modules and as alternating sections

### Color Tokens

#### Light Section (Canonical)
```
Background:   #F8F7F4    (warm cream)
Card:         #FFFFFF    (white)
Heading text: #0C0C0C    (near-black)
Body text:    #3C3C3C    (dark charcoal)
Muted text:   #888888    (mid grey)
Border:       #E2E1DC    (warm grey)
```

#### Dark Section (Canonical)
```
Background:   #060A12                   (near-black blue)
Card:         #0D1520                   (dark blue-grey)
Heading text: #EFF6FF                   (pale blue-white)
Body text:    rgba(255,255,255,0.74)    (74% white)
Muted text:   rgba(255,255,255,0.46)    (46% white)
Border:       #1C2D45                   (dark blue border)
```

#### Brand & Semantic Colors
```
Brand Teal:   #2DD4C8    (CTAs, active states, teal labels)
Red:          #EF4444    (critical, errors, high severity)
Amber:        #F59E0B    (warning, medium severity)
Green:        #34D399    (success, positive) / #10B981 (alt green)
Indigo:       #818CF8    (info, AI-related)
Purple:       #6366F1    (alternate info)
```

#### Phase Colors (AI Value Realization module nav)
```
Phase 1 DIAGNOSE:           #4DA3FF    (blue)
Phase 2 PRESCRIBE:          #F59E0B    (amber)
Phase 3 VALUE REALIZATION:  #34D399    (green)
```

### Typography

#### Font Families
```
Sans:   "DM Sans, sans-serif"
Mono:   "JetBrains Mono, monospace"
Serif:  "Georgia, serif"
```

#### Type Scale
| Usage | Font | Size | Weight | Notes |
|-------|------|------|--------|-------|
| H1 (hero statements) | Georgia | 52–60px | 400 | Line height 1.1–1.2 |
| H2 (section headers) | Georgia | 36–44px | 400 | Line height 1.3 |
| Statement (Maestro) | Georgia | 42px | 400 | max-width 560px |
| Hero numbers (home) | Georgia | 60–72px | 400 | |
| Client workspace numbers | Georgia | 38–52px | 400 | |
| Sub-section numbers | Georgia | 24–26px | 400 | |
| Body copy | DM Sans | 14–16px | 400 | Line height 1.65–1.7 |
| Card body | DM Sans | 13px | 400 | |
| Secondary body | DM Sans | 12px | 400 | |
| Eyebrow labels | JetBrains Mono | 9–11px | 600 | Uppercase, 0.10–0.14em spacing |
| Nav items | DM Sans | 13px | 400 | |
| Micro labels | JetBrains Mono | 9–10px | 600 | Uppercase |

#### Typography Rules
- All eyebrow/section labels: `JetBrains Mono`, uppercase, letter-spacing `.10em–.14em`
- All large numbers/headlines: Georgia serif
- All body/navigation/UI text: DM Sans
- Teal is used ONLY for CTAs, active states, and eyebrow labels — never for body text

### Cards
```typescript
// Standard card style (light pages)
{
  background: '#FFFFFF',
  border: '1px solid #E2E1DC',
  borderRadius: '8px',  // standard cards
  // or '10px'          // larger feature cards
  padding: '20px',      // compact
  // or '28px–32px'     // spacious
}

// Dark page cards
{
  background: '#0D1520',
  border: '1px solid #1C2D45',
  borderRadius: '8px',
}
```

### Status Indicators
- **Critical**: red left border (`4px solid #EF4444`) + small red dot (`6px circle`)
- **Warning**: amber left border (`4px solid #F59E0B`) + small amber dot
- **Success**: green dot or green text
- Never use full red/amber fill backgrounds — use only borders, dots, and text color

### Spacing
- Page max-width: `1400px` (centered, `0 auto`)
- Page padding: `0 28px` horizontal
- Section vertical padding: `56–96px` for major sections
- Card gap: `12–20px` in grids
- Hero padding (Maestro): `56px 0 52px`

### Buttons
```typescript
// Primary CTA (dark bg)
{ background: '#0C0C0C', color: '#FFFFFF', padding: '14px 28px', borderRadius: '6px', fontSize: '15px' }

// Teal CTA
{ background: 'rgba(45,212,200,0.1)', border: '1px solid #2DD4C8', color: '#2DD4C8' }

// Ghost / secondary
{ background: 'transparent', border: '1px solid #E2E1DC', color: '#3C3C3C' }

// Nav teal CTA (small)
{ background: '#2DD4C8', color: '#060A12', fontFamily: MONO, fontWeight: 700 }
```

---

## 6. Navigation (AbarvaNav)

**File:** `src/components/AbarvaNav.tsx`
**Style:** Sticky, dark (`#060A12` bg), `1px solid #1C2D45` bottom border, `z-index: 1000`
**Height:** 52px (approx)

### Wordmark
```
"Abar"  — Georgia, 17px, 800wt, #EFF6FF
"Va"    — Georgia, 22px, 900wt, #2DD4C8
Tagline — JetBrains Mono, 7.5px, "know it. build it. own it."
```

### Client Selector (Admin + Investor only)
- Colored dot (client color) + client short name + chevron
- Dropdown panel (white bg, `#FFFFFF`) lists all allowed clients
- Clicking a client calls `switchClient(id)` — writes to localStorage + updates `?client=` URL param
- Clients: Meridian Health (teal), Arcturus Financial (indigo), Apex Retail (amber)

### Main Menu Items

#### Intelligence (signed-in only)
→ `/ai-strategy?client={clientId}`

#### Solutions ▾ (dropdown)
| Label | Route |
|-------|-------|
| AI-Powered PDLC | `/solutions/pdlc` |
| Margin Optimization | `/solutions/margin` |
| Technology Modernization | `/solutions/tech` |
| View all solutions → | `/solutions` |

#### AI Value Realization ▾ (dropdown, signed-in)
Three-phase structure:

**Phase 1 — DIAGNOSE** (color: `#4DA3FF`)
| Module | Route |
|--------|-------|
| Situation Intelligence | `/diagnose?client={id}` |
| Contradiction Intelligence | `/contradictions?client={id}` |
| Data Intelligence | `/data-intelligence?client={id}` |

**Phase 2 — PRESCRIBE** (color: `#F59E0B`)
| Module | Route |
|--------|-------|
| Technology Intelligence | `/intelligence?client={id}` |
| Vendor Intelligence | `/vendor-intelligence?client={id}` |
| Architecture Intelligence | `/architecture?client={id}` |
| Business Case Intelligence | `/justify?client={id}` |

**Phase 3 — VALUE REALIZATION** (color: `#34D399`)
| Module | Route |
|--------|-------|
| AI Delivery Intelligence | `/ai-pdlc?client={id}` |
| Outcome Intelligence | `/outcome-intelligence?client={id}` |

Footer: "View all 9 modules →"

### Right Side (always visible)
- **Maestro** → `/admin/client/{clientId}` (signed-in)
- **Platform** → `/platform`

### Signed-Out State
- "Investor" link → `/investor`
- "Login →" button (teal bg, dark text, mono font)

### Signed-In State
- User avatar: initials in teal circle (30px)
- Name + role label (Admin / Investor / Client)
- Dropdown:
  - Admin Dashboard (admin only) → `/admin`
  - Sign out

### Dropdown Panel Design
```
background: #FFFFFF
border: 1px solid #E5E7EB
borderRadius: 8px
boxShadow: 0 8px 32px rgba(0,0,0,0.4)
padding: 16px

  Category headers: 9px JetBrains Mono, #9CA3AF, uppercase
  Link items: DM Sans 13px, #0C0C0C
  Link sub-text: DM Sans 11px, #6B7280
  Hover bg: #F9FAFB
```

---

## 7. Page Inventory & Specs

Each page listed with route, audience, background theme, and design notes.

---

### 7.1 Home Page `/`

**File:** `src/app/page.tsx`
**Audience:** Public
**Theme:** Light hero → Dark sections → Light → Dark alternating

#### Sections

**HERO** (Light, `padding: 96px 0`)
- Eyebrow: "Enterprise transformation · AI-native · Outcome-accountable" (mono, 10px, `#888888`)
- H1: "Act on intelligence. Before the window closes." (Georgia, 60px, `#0C0C0C`)
- Body: AbarVa value prop copy (DM Sans, 18px, `#3C3C3C`, max-width 600px)
- CTAs: "See it with Meridian Health →" (dark button) | "Watch a demo" (border) | "Contact us" (text)
- Right side: 2×2 grid of stat cards (white bg, `#E2E1DC` border):
  - "$200B" — Consulting spend wasted
  - "73%" — Enterprise AI with zero ROI
  - "Skin in the game" — AbarVa model
  - "48hrs" — Time to first intelligence

**PROBLEM BAND** (Dark, `padding: 72px 0`)
- Tagline: "The problem · in real organizations · right now"
- 3-column stat grid (Georgia, large numbers, `#EFF6FF`):
  - "$94M" — Meridian Health's AI portfolio
  - "71%" — Arcturus Financial's cost-to-income ratio
  - "18 months" — Apex Salesforce Einstein deployment

**INTELLIGENCE PRODUCTS** (Light, `padding: 96px 0`)
- Eyebrow: "Five products · One intelligence layer"
- H2: "Intelligence that tells you what to do next."
- Body: 340 Genome patterns copy
- 1×5 card row (white cards):
  - Situation Intelligence: "What's actually broken — and what is it costing?"
  - AI Strategy Intelligence: "Where should we place our AI bets?"
  - Vendor Intelligence: "Which vendor actually wins in our situation?"
  - Business Case Intelligence: "How do we justify this to the board?"
  - Outcome Intelligence: "Did it work — and can we prove it?"

**SOLUTIONS** (Dark, `padding: 96px 0`)
- H2: "Diagnosis is just the start. We execute."
- Body: Maestro embed model copy
- 3-row table:
  - AI-Powered PDLC + $18M consulting reduction
  - AI-Powered Delivery + 4 Maestros replace 40
  - Margin Optimization + $60–120M annual recovery

**HOW WE EARN** (Light, `padding: 96px 0`)
- H2: "Skin in the game. Fee on outcomes only."
- 4-step process grid (2×2, white cards):
  - 01 DIAGNOSE · 02 PRESCRIBE · 03 EXECUTE · 04 VERIFY
- Lockbox callout: "🔒 The baseline is locked on Day 0..."

**SEE IT WORKING** (Dark, `padding: 96px 0`)
- H2: "Two composite organizations. Real-world data. Live intelligence."
- 2-card grid → Meridian Health + Arcturus Financial
  - Each links to `/admin/client/{id}`
- Video teaser component

**PROOF** (Light, `padding: 96px 0`)
- 3 stats: "340" Genome patterns, "89%" regulatory issues, "79%" CDO vacancies

**CONTACT FORM** (Dark, `padding: 96px 0`)
- H2: "Ready to see your organization in here?"
- Left: Entry points (live demo, Maestro login, Investor view)
- Right: Form (name, email, org, interest, message)

---

### 7.2 Solutions Index `/solutions`

**File:** `src/app/solutions/page.tsx`
**Audience:** Public
**Theme:** Light hero, dark cards grid

#### Hero (Light)
- Tagline: "Solution Library"
- H1: "Find your problem. Run the solution."
- 3 stat boxes: 5 Solutions, 76% Avg success rate, 176 Genome engagements

#### Filter Panel (Left sidebar, dark)
- Objective: All / Grow / Optimise / Protect
- Office: All / Front / Middle / Back
- Vertical: All / Healthcare / Financial Services / Retail

#### Solution Cards (dark, 2-column grid)
Five solutions:
| Code | Name | Objective | Vertical |
|------|------|-----------|----------|
| HC-01 | Revenue Cycle Intelligence | Grow | Healthcare |
| AM-01 | Analytics Modernisation Intelligence | Optimise | All |
| IT-01 | IT Spend Optimisation Intelligence | Optimise | All |
| FS-01 | Digital Banking Transformation | Grow | Financial Services |
| AI-01 | AI Portfolio Accountability | Protect | All |

Each card shows: code, name, problem quote (italic), client insights (severity dots), product tags, typical outcome, Genome stats, CTAs.

---

### 7.3 Solution Detail `/solutions/[slug]`

**File:** `src/app/solutions/[slug]/page.tsx`
**Audience:** Public + signed-in
**Theme:** Light hero, dark lower section

#### Slugs
- `revenue-cycle-intelligence` (HC-01)
- `analytics-modernisation` (AM-01)
- `it-spend-optimisation` (IT-01)
- `digital-banking-transformation` (FS-01)
- `ai-portfolio-accountability` (AI-01)

#### Hero Section (Light)
- Eyebrow: "SOLUTION · N OF 5" (mono, muted)
- H1: Solution name (Georgia, ~60px, black)
- Body: 2–3 sentence problem statement (DM Sans, 16px)
- Tag pills: buyer persona, verticals, tech platforms, model
- Right: 4 stat cards (2×2 grid, white bg):
  - Industry problem metrics with colored dot indicator + number + description

#### Lower Section (Dark)
Layout: `1fr 320px` grid

**Left — Three Phases:**
- "THREE PHASES" eyebrow
- Numbered phase items (teal circle number, bold heading, body text, product/tool tag pills)
- Each phase links to a module

**Right — Genome Patterns Card (dark card):**
- "GENOME PATTERNS" label (teal mono)
- 3 failure patterns with:
  - Large percentage (Georgia, `#EFF6FF`)
  - Pattern name (bold)
  - Risk description (muted)

---

### 7.4 Maestro Client Workspace `/admin/client/[id]`

**File:** `src/app/admin/client/[id]/page.tsx`
**Audience:** Signed-in (admin views any, client sees own)
**Theme:** All light (`#F8F7F4`)

#### Supported Client IDs
- `meridian` — Meridian Health System (Active)
- `arcturus` — Arcturus Financial Group (Setup)

#### Design Tokens (this page)
```
BG='#F8F7F4', CARD='#FFFFFF', BORDER='#E2E1DC'
WHITE='#0C0C0C', MUTED='#3C3C3C', DIM='#888888'
TEAL='#2DD4C8', RED='#EF4444', AMBER='#F59E0B'
GREEN='#34D399', PURPLE='#818CF8'
SANS='DM Sans, sans-serif'
MONO='JetBrains Mono, monospace'
SERIF='Georgia, serif'
```

#### Hero Section (`padding: 56px 0 52px`)
Layout: 2-column flex (`gap: 64px`)

**Left (flex: 1) — Statement:**
- Eyebrow: "AbarVa · Client Workspace" (mono, 10px, teal, 0.14em spacing)
- Welcome line: personalised string (DM Sans, 13px, `#888888`)
- Statement: punchy 1–2 sentence provocation (Georgia, 42px, `#0C0C0C`, max-width 560px)

**Right (width: 460px) — Stat Cards:**
3 stacked cards (white bg, `#E2E1DC` border, `borderRadius: 10px`, `padding: 20px 24px`):
- Row layout: colored dot (6px) | label + sub-text (flex: 1) | large number (Georgia, 38px, black)
- Colored dot indicates status (RED or AMBER)
- Label: mono, 10px, `#888888`, uppercase
- Sub-text: DM Sans, 11px, `#888888`
- Number: Georgia, 38px, `#0C0C0C`

**Meridian Hero:**
- Welcome: "Welcome back, Meridian Health."
- Statement: "You committed $94M to AI. Zero initiatives have a documented baseline. We found out why."
- Numbers: $94M (AI spend, red) | 18.2% (Denial rate, red) | 1.8% (Op. margin, amber)

**Arcturus Hero:**
- Welcome: "Welcome to your AbarVa workspace, Arcturus."
- Statement: "71% cost-to-income ratio. Your peers are at 58%. There is $840M sitting in that gap."
- Numbers: $840M (Efficiency gap, red) | 0 of 28 (AI initiatives, red) | 71% (Cost-to-income, amber)

#### Tab Bar (`height: 44px`, `borderBottom: 1px solid #E2E1DC`)
Tabs (left-to-right, no client identity):
- Admin | Overview | Data Intelligence | Projects | Approvals (badge: 2) | Activity

Active tab: teal text + `2px solid #2DD4C8` bottom border
Inactive: `#3C3C3C` text

#### Tab Commentary (below tab bar)
13px DM Sans `#888888`, `padding: 16px 0 24px`, `borderBottom: 1px solid #E2E1DC`, `marginBottom: 28px`

| Tab | Commentary |
|-----|-----------|
| admin | "Engagement configuration, data governance, and access control." |
| overview | "Your situation. The numbers are real. The gap is specific." |
| data | "Uploaded files, confidence scores, and the benchmarks behind the numbers." |
| projects | "Active initiatives, milestones, and what is waiting on a decision." |
| approvals | "Two documents require sign-off before the next phase can proceed." |
| activity | "Everything that happened — who did it, what changed, and when." |

#### Overview Tab
Layout: stacked sections

**4 Metric Cards (2×2 grid, `gap: 16px`):**
- Card: white bg, `borderRadius: 10px`, `padding: 32px 28px`, colored left border (4px, RED or AMBER)
- Header row: colored dot (6px) + mono label (10px, `#888888`, uppercase)
- Number: Georgia, 52px, `#0C0C0C` (black — never colored)
- Benchmark: DM Sans, 13px, `#888888`
- Gap: DM Sans, 13px, 600wt, RED or AMBER

**Top Contradiction Card (full width):**
- White bg, `borderRadius: 10px`, `padding: 32px`, colored left border
- Label: mono, 10px, colored (RED or AMBER), uppercase
- Claim: Georgia, 18px, italic, `#3C3C3C`, line-height 1.6
- Reality: DM Sans, 15px, 500wt, `#0C0C0C`, line-height 1.7

**Next Actions Card (full width):**
- Title: mono, 10px, `#888888`, uppercase
- 3 items with teal numbered circles (22px), DM Sans 14px text, dividers

**Genome Patterns Sidebar (width: 300px):**
- 3 patterns (top 3 only)
- Each: red dot + Georgia 26px number + "failure rate" label | DM Sans 13px name | 12px mitigation

#### Other Tabs

**Admin Tab** — Sub-sections: Setup & engagement, Data & approvals, Maestro users, Security
- Data upload UI (file input, drag-drop)
- Seed demo data buttons (admin-only)

**Data Intelligence Tab** — Sub-tabs: Client data, Industry, Public data, Genome patterns
- File list with confidence scores and upload bars
- Industry benchmarks comparison table
- Genome pattern detail cards

**Projects Tab** — Views: Dashboard (stats strip + active projects), All projects (table)
- Stats: Total projects, Active, Pending, Maestros, Avg progress
- Progress bars (teal)

**Approvals Tab** — Document sign-off workflow

**Activity Tab** — Timestamped activity log

---

### 7.5 AI Value Realization Modules (9 pages)

All 9 module pages share this layout pattern:

**Common Structure:**
1. `<AbarvaNav activePage="{moduleId}" />` (dark sticky nav)
2. `<ModuleHeader>` (dark sticky sub-header with module name, phase, and sub-navigation tabs)
3. Content area (`background: #F8F7F4`) — light cream
4. All text in content area: `#0C0C0C` headings, `#3C3C3C` body, `#888888` muted
5. Cards: `#FFFFFF` bg, `#E2E1DC` border

**Phase 1 — DIAGNOSE**

| Route | Module | File |
|-------|--------|------|
| `/diagnose` | Situation Intelligence | `src/app/diagnose/page.tsx` |
| `/contradictions` | Contradiction Intelligence | `src/app/contradictions/page.tsx` |
| `/data-intelligence` | Data Intelligence | `src/app/data-intelligence/page.tsx` |

**Phase 2 — PRESCRIBE**

| Route | Module | File |
|-------|--------|------|
| `/intelligence` | Technology Intelligence | `src/app/intelligence/page.tsx` |
| `/vendor-intelligence` | Vendor Intelligence | `src/app/vendor-intelligence/page.tsx` |
| `/architecture` | Architecture Intelligence | `src/app/architecture/page.tsx` |
| `/justify` | Business Case Intelligence | `src/app/justify/page.tsx` |

**Phase 3 — VALUE REALIZATION**

| Route | Module | File |
|-------|--------|------|
| `/ai-pdlc` | AI Delivery Intelligence | `src/app/ai-pdlc/page.tsx` |
| `/outcome-intelligence` | Outcome Intelligence | `src/app/outcome-intelligence/page.tsx` |

**Client Context:** All 9 pages read `?client=` URL param → localStorage fallback → default 'meridian'. Uses `useActiveClient` hook (`src/lib/use-active-client.ts`).

**Shared Design Tokens (all 9 modules):**
```
BG = '#F8F7F4'    CARD = '#FFFFFF'    BORDER = '#E2E1DC'
WHITE = '#0C0C0C'  MUTED = '#3C3C3C'   DIM = '#888888'
TEAL = '#2DD4C8'   RED = '#EF4444'     AMBER = '#F59E0B'
GREEN = '#34D399'
SANS = 'DM Sans, sans-serif'
MONO = 'JetBrains Mono, monospace'
SERIF = 'Georgia, serif'
```

---

### 7.6 Engagement Workflow `/engage/[clientId]/[solution]`

**File:** `src/app/engage/[clientId]/[solution]/page.tsx`
**Audience:** Signed-in (admin/Maestro)
**Purpose:** Full engagement workflow UI — phases, workstreams, outputs, approvals

Supports all phases with phase-specific workstreams, data requirements, AI-generated outputs, and client approval workflows.

---

### 7.7 Platform `/platform`

**File:** `src/app/platform/page.tsx`
**Audience:** Public
**Theme:** Light
**Purpose:** Platform capabilities overview

---

### 7.8 Investor `/investor`

**File:** `src/app/investor/page.tsx`
**Audience:** Public + investors
**Theme:** Light
**Purpose:** Investor-facing overview, AUM, differentiation

---

### 7.9 Client Portal `/portal/[solution]`

**File:** `src/app/portal/[solution]/page.tsx`
**Audience:** Client users
**Purpose:** Client-facing portal for reviewing outputs, approving deliverables

---

### 7.10 Supporting Pages

| Route | File | Purpose |
|-------|------|---------|
| `/ai-strategy` | `ai-strategy/page.tsx` | AI strategy overview, 9-module map |
| `/select` | `select/page.tsx` | Vendor selection workflow |
| `/domain-strategy` | `domain-strategy/page.tsx` | Domain strategy planner |
| `/how-to-build` | `how-to-build/page.tsx` | Build guide for AI initiatives |
| `/value-template` | `value-template/page.tsx` | Value realization template |
| `/blueprint` | `blueprint/page.tsx` | Blueprint document builder |
| `/board-deck` | `board-deck/page.tsx` | Board presentation generator |
| `/brief` | `brief/page.tsx` | Executive brief template |
| `/timeline` | `timeline/page.tsx` | Initiative timeline view |
| `/scenarios` | `scenarios/page.tsx` | Scenario planning |
| `/outcomes` | `outcomes/page.tsx` | Outcomes tracking |
| `/marketplace` | `marketplace/page.tsx` | Integration marketplace |
| `/clients` | `clients/page.tsx` | Client list (scan animation, sign-in redirect) |
| `/trust` | `trust/page.tsx` | Security & trust |
| `/status` | `status/page.tsx` | Platform status |
| `/control-tower` | `control-tower/page.tsx` | Control tower view |
| `/analytics-modernization` | `analytics-modernization/page.tsx` | Analytics modernization module |
| `/future-of-work` | `future-of-work/page.tsx` | Future of work content |

---

### 7.11 Admin Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `admin/page.tsx` | Admin dashboard |
| `/admin/context` | `admin/context/page.tsx` | Client setup & onboarding |
| `/admin/approvals` | `admin/approvals/page.tsx` | Data governance & sign-offs |
| `/admin/new-client` | `admin/new-client/page.tsx` | User management |
| `/admin/data-guide` | `admin/data-guide/page.tsx` | Demo data install guide |
| `/admin/data` | `admin/data/page.tsx` | Data administration |
| `/admin/intelligence` | `admin/intelligence/page.tsx` | Intelligence admin |
| `/admin/outcomes` | `admin/outcomes/page.tsx` | Outcomes administration |
| `/admin/revenue` | `admin/revenue/page.tsx` | Revenue reporting |
| `/admin/brief` | `admin/brief/page.tsx` | Brief admin |
| `/admin/playbook` | `admin/playbook/page.tsx` | Playbook admin |
| `/admin/data-governance` | `admin/data-governance/page.tsx` | Data governance |

---

## 8. Data Architecture

### Client Datasets

Each client has a directory of TypeScript data files under `src/data/`. Data is imported directly into pages and API routes — no database lookup required for the demo datasets.

#### Meridian Health (`src/data/meridian/`) — 14 files
| File | Contents |
|------|---------|
| `index.ts` | Core org data (revenue, employees, hospitals, health plan, technology, financials, contradictions) |
| `financials.ts` | Financial statements, uploadedBy/At, confidence |
| `technology.ts` | EHR, RCM, IT landscape details |
| `technology_inventory.ts` | Full technology inventory |
| `architecture.ts` | Current state architecture |
| `leadership.ts` | Leadership profiles, uploadedAt |
| `clinical.ts` | Clinical metrics |
| `benchmarks.ts` | Industry benchmarks |
| `ai.ts` | AI initiative inventory |
| `opportunities.ts` | Transformation opportunities |
| `outcomes.ts` | Outcome tracking |
| `interviews.ts` | Leadership interview insights |
| `rfp_data.ts` | RFP data |
| `vendors.ts` | Vendor landscape |

#### Arcturus Financial (`src/data/arcturus/`) — 9 files
Key files: `index.ts` (org + situationMetrics + contradictions), `financials.ts`, `technology.ts`, `leadership.ts`, `regulatory.ts`, `industry.ts`

#### Core Data Types (from Maestro page)
```typescript
interface Metric {
  label: string
  value: string
  benchmark: string
  status: 'critical' | 'warning'
  gap: string
}

interface Contradiction {
  id: string
  claim: string
  reality: string
  severity: string
}

interface GenomePattern {
  code: string          // e.g. 'F011'
  name: string          // e.g. 'RCM Vendor Misalignment'
  failureRate: number   // 0–100
  present: boolean
  mitigation: string
}

interface HeroNumber {
  value: string   // e.g. '$94M'
  label: string   // e.g. 'AI spend'
  sub: string     // e.g. 'No ROI tracked on any initiative'
  color: string   // RED or AMBER
}
```

### Knowledge Base (`src/data/knowledge/`)
- `finserv/` — Financial services industry benchmarks and patterns
- `retail/` — Retail industry data
- `crossIndustry/` — Cross-industry patterns, the Transformation Genome data

### Use Cases (`src/data/use-cases.ts`)
25KB file of cross-client use cases database — used for solution matching and recommendations.

---

## 9. API Routes

All under `src/app/api/`. All use Next.js Route Handlers.

### Intelligence Generation (Claude)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/diagnose` | POST | Situation Intelligence — Claude generates situation brief + contradictions + failure patterns |
| `/api/chat` | POST | Streaming chat for workstream conversations |
| `/api/intelligence/contradictions` | POST | Contradiction analysis |
| `/api/intelligence/failures` | POST | Failure pattern matching |
| `/api/org-search` | GET/POST | Organization search |

**Claude Integration Pattern:**
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// Uses claude-3-5-sonnet or claude-opus-4 models
// Imports client data + knowledge base as context
// Returns structured intelligence output
```

### Engagement Workflow (Supabase)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/engage/[clientId]/[solution]` | GET/POST | Get or create engagement |
| `/api/engage/[clientId]/[solution]/list` | GET | List engagements |
| `/api/engage/[clientId]/[solution]/seed-demo` | POST | Seed demo engagement data |
| `/api/engage/[clientId]/[solution]/data-requests` | GET/POST | Data request tracking |
| `/api/engage/[clientId]/[solution]/vendor-intelligence` | GET | Vendor scoring |
| `/api/engage/[clientId]/[solution]/opportunity-map` | GET | Opportunity mapping |
| `/api/engage/[clientId]/[solution]/select-scope` | POST | Scope selection |
| `/api/engage/[clientId]/[solution]/switch` | POST | Client context switch |
| `/api/engage/start` | POST | Start new engagement |

### Phase Management (Supabase)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/engage/phase/[phaseId]/generate-output` | POST | Generate phase output via Claude |
| `/api/engage/phase/[phaseId]/publish-output` | POST | Publish output to client |
| `/api/engage/phase/[phaseId]/approve` | POST | Client approval |
| `/api/engage/phase/[phaseId]/admin-unlock` | POST | Admin unlock |
| `/api/engage/phase/[phaseId]/upload` | POST | Data file upload |

### Admin Operations
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/seed-all-demos` | POST | Seed all demo engagements |
| `/api/admin/seed-clerk-metadata` | POST | Seed Clerk user roles/clientId |
| `/api/admin/upload-dataset` | POST | Upload client dataset |

---

## 10. Component Library

**Location:** `src/components/`

### AbarvaNav.tsx (26.7 KB)
Full sticky navigation. Props: `{ activePage: string }`. Handles: client selector, all dropdown menus, role-based visibility, Clerk sign-out, user avatar.

### ModuleHeader.tsx
Sticky dark sub-header for the 9 AVR module pages. Props include module name, phase, and tab navigation.
- Background: `#060A12` (dark, does not inherit light-page theme)
- Text: `rgba(255,255,255,0.85)` for readability on dark bg

### OutputRenderer.tsx (33 KB)
Renders intelligence outputs with approval workflow. Handles: output display, edit mode, approval states, publish/sign-off actions.

### SolutionLayout.tsx (17.9 KB)
Wrapper layout for solution detail pages. Manages phase navigation, data requirements, and output sections.

### EngagementProgress.tsx
Displays engagement phase progress bar and status.

### DataUnlock.tsx
UI for unlocking data categories (requires upload/approval).

### LockedCard.tsx
Displays locked content state with unlock call-to-action.

### MobileGuard.tsx
Detects mobile devices and displays a "desktop required" message.

### PlatformEvaluator.tsx (7.5 KB)
Cloud AI platform comparison matrix component.

### PostHogProvider.tsx
Wraps children in PostHog analytics provider.

### ReferralBadge.tsx
Attribution/referral badge display.

### ResponseOptions.tsx
Response selection buttons for intelligence outputs.

---

## 11. Client Context & State

### Primary Hook: `useClientContext` (`src/lib/use-client-context.ts`)

**Purpose:** Full client context with Clerk integration, role management, and switching.

**Resolution Order:**
1. URL `?client=` param
2. localStorage key `abarva_selected_client`
3. Clerk `publicMetadata.clientId`
4. First allowed client (fallback)

**Returns:**
```typescript
{
  clientId: string
  currentClient: Client | undefined
  allowedClients: Client[]
  canSwitch: boolean        // true for admin + investor
  switchClient: (id: string) => void
  isLoaded: boolean
  role: string              // 'admin' | 'investor' | 'client'
  isElevated: boolean       // admin or investor
  isAdmin: boolean
}
```

**`switchClient(newId)`:** Validates → writes localStorage → updates URL param via `router.push`.

### Lightweight Hook: `useActiveClient` (`src/lib/use-active-client.ts`)

**Purpose:** For pages that only need the current client ID (no switching, no Clerk).

**Resolution:** `searchParams.get('client')` → `localStorage.getItem('abarva_selected_client')` → `'meridian'` (fallback)

**Returns:** `string` (just the clientId)

**Used by:** All 9 AVR module pages, solutions pages, value-template, domain-strategy, how-to-build, etc.

### ALL_CLIENTS Array
```typescript
[
  { id: 'meridian',   name: 'Meridian Health System',   shortName: 'Meridian Health',   color: '#2DD4C8', vertical: 'Healthcare' },
  { id: 'arcturus',   name: 'Arcturus Financial Group', shortName: 'Arcturus Financial', color: '#818CF8', vertical: 'Financial Services' },
  { id: 'apexretail', name: 'Apex Retail Group',        shortName: 'Apex Retail',       color: '#F59E0B', vertical: 'Retail' },
]
```

### Client ID Aliasing
Some internal data files use `firstcapital` as the key for Arcturus Financial data (historical naming). The `solutions/[slug]/page.tsx` maps `arcturus` → `firstcapital` for data lookups. Both keys exist in `CLIENT_DATA` objects where needed.

---

## 12. Deployment

### Platform
**Vercel** — Project: `nexus`
- Production URL: `https://nexus-vert-kappa.vercel.app`
- Project ID: `prj_ni9Pi0Ob4pjnWieBxey8evHlrMmY`
- Org ID: `team_S8RBzjWzro3TNjYoeMtlz3kF`

### Build Command
```bash
npm run build
```
Next.js 16 builds to `.next/` — 63 pages, mix of static and dynamic routes.

### Deploy Command
```bash
vercel --prod
```

### Next.js Config (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],
}
```

### Static vs Dynamic Routes
- `○ Static` — Pre-rendered at build time (most marketing pages, solutions)
- `ƒ Dynamic` — Server-rendered on demand (sign-in, admin/client pages, portal)

---

## 13. Environment Variables

Create `.env.local` in root with:

```env
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-jwt-token]
SUPABASE_SERVICE_ROLE_KEY=[service-role-jwt]

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=nexus-artifacts

# Pinecone (optional, vector search)
PINECONE_API_KEY=
PINECONE_INDEX=nexus-knowledge

# PostHog (analytics)
# NEXT_PUBLIC_POSTHOG_KEY= (if used)
```

---

## Appendix A: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Inline styles throughout (no Tailwind in JSX) | Predictable, portable, no class name conflicts |
| Light-section / Dark-section alternation | Harvey.ai / Snowflake aesthetic — premium SaaS feel |
| Georgia serif for headlines and numbers | Premium, editorial — contrasts with DM Sans UI |
| JetBrains Mono for labels | Technical credibility, distinguishes metadata from content |
| Single `#F8F7F4` cream background | Warmer than pure white, easier on eyes |
| `#0C0C0C` not pure `#000` for text | Softer, more refined — avoids harsh contrast |
| Metric numbers in black (never colored) | Color on numbers looks amateurish; use border/dot as indicator |
| Client context in localStorage | Survives page navigation without `?client=` on every link |
| Clerk public metadata for roles | Serverless-compatible, no separate user DB needed |
| Claude at the core of all intelligence | Consistent quality, streaming support, system prompt context injection |

---

## Appendix B: Rebuild Checklist

To recreate this build from scratch:

1. **Init:** `npx create-next-app@16.2.2 nexus --typescript --app`
2. **Install deps:** See Section 2 tech stack table
3. **Clerk setup:** Create app at clerk.com, add publishable + secret keys, configure sign-in/redirect URLs
4. **Supabase setup:** Create project, run schema migrations for engagements/phases/outputs tables
5. **Anthropic:** Get API key, configure `ANTHROPIC_API_KEY`
6. **Copy `/src/data/`:** All client datasets (meridian, arcturus, apexretail, etc.)
7. **Copy `/src/lib/`:** Hooks (use-client-context, use-active-client), utilities
8. **Copy `/src/components/`:** All 13 components (see Section 10)
9. **Copy `/src/app/`:** All pages and API routes (see Sections 7 and 9)
10. **Vercel:** `vercel link` → `vercel env add` (all env vars) → `vercel --prod`
11. **Clerk metadata:** Run `/api/admin/seed-clerk-metadata` to set demo user roles
12. **Demo data:** Run `/api/admin/seed-all-demos` to populate demo engagements

---

*Generated: 2026-04-15 | AbarVa Platform v1 | Repo: nexus*
