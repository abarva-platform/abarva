# AbarVa — Investor Page Spec v4
# Route: /investor
# Design: Tabbed navigation, dark background, WHITE text throughout, teal accents
# CRITICAL: No grey text anywhere. No muted text. No opacity tricks. White only.

---

## DESIGN SYSTEM

Background: #060A12
Card background: #0D1520
Featured card background: #091828
Borders default: #1C2D45
Teal accent: #2DD4C8
All body text: #ffffff
Labels/eyebrows: #2DD4C8 teal, JetBrains Mono, 9-10px, uppercase
Stats: #2DD4C8 or #ffffff
Red (for 0% stat): #EF4444
Teal border featured cards: border: 1px solid #2DD4C8; bg: #091828

NO grey. NO rgba opacity on text. NO color: #8899AA or similar muted tones.
Every single piece of text on the page is either #ffffff or #2DD4C8.

---

## ROUTE & AUTH

/investor

- Not logged in: page visible with overlay asking for credentials
  "Investor access required. Email invest@abarva.ai"
- Role investor: full page
- Role admin: full page  
- Role client/maestro: redirect to /portal or /admin

Nav shows: "Investor view" link (leads to /investor)
Top right badge: "INVESTOR VIEW · CONFIDENTIAL · SEED 2026"
(teal border, teal text)

---

## LAYOUT

Full-width dark nav bar:
  Left: AbarVa wordmark (Abar white 800, Va teal 900, tagline below)
  Right: INVESTOR VIEW badge

Full-width tab bar (6 tabs):
  Overview | Vision | Revenue Model | The Ask | Team | Live Platform
  Background: #060A12
  Border-bottom: 1px solid #1C2D45
  Active: teal text + 2px teal underline
  Inactive: white text, 50% opacity

Panel padding: 36px 40px
Only one panel visible at a time — JS show/hide on tab click

---

## TAB 1 — OVERVIEW

Eyebrow (teal mono): SEED ROUND · APRIL 2026

H1 (white, 38px, 800, letter-spacing -0.5px):
"The $800B enterprise transformation
market has no intelligence layer.
Until now."
— "Until now." in teal italic

Body (white, 13px, line-height 1.7):
"Palantir built an $80B company embedding AI analysts inside
government and enterprise operations. ServiceNow built $200B
automating enterprise workflow. Neither touched transformation
itself — the $800B market where boards spend, consultants deliver
decks, and accountability is zero. AbarVa is that category."

4-column stat grid:
  [Market size] $800B teal / "Annual enterprise transformation spend. No outcome accountability today."
  [Palantir proof point] $80B white / "AI + human operator + enterprise data. Same structure. Different category."
  [Enterprise AI failure] 73% teal / "Of enterprise AI programmes produce no verified outcome. AbarVa fixes this."
  [Advisory accountability] 0% red #EF4444 / "Fee tied to outcomes at any leading advisory firm today."

Section title (white 22px): "The structural opportunity"
2-column comparison (border radius 8px, overflow hidden):

  LEFT col (bg #0D1520):
    Teal mono label: "HOW ADVISORY FIRMS WORK TODAY"
    6 items: white dot + white text
    · CXO pays £2-8M per engagement
    · Consultants spend weeks 1-4 learning the client
    · Deliverable is a PowerPoint deck
    · Knowledge walks out with the team
    · No accountability for outcomes
    · Same firm, same process, 2 years later

  RIGHT col (bg #091828, border-left 3px solid #2DD4C8):
    Teal mono label: "HOW ABARVA WORKS"
    6 items: teal dot + white text, key phrases in teal strong
    · Data ingested before first meeting. Phase 0 runs in 48 hours.
    · Maestro arrives knowing every gap, every failure pattern
    · Deliverable is structured data — feeds every next phase
    · Knowledge stays in the platform permanently
    · Baseline locked Day 0 — accountability built in from the start
    · Genome compounds — every engagement makes the next better

Horizontal divider (1px #1C2D45)

Section title: "The four compounding advantages"
4-column card grid (bg #0D1520, border #1C2D45):

  Card 1: 01 · GENOME (teal mono label)
  Title (white 13px bold): "Cross-client intelligence no firm can share"
  Body (white 11px): "Patterns from real transformations. Failure rates.
  Recovery ranges. Vendor track records. Every engagement makes it smarter.
  Advisory firms have this in partners' heads — walks out when they retire.
  Ours compounds permanently."
  Key phrases: color #2DD4C8

  Card 2: 02 · DATA FIRST
  "Week 4 insight in 48 hours"
  "Client uploads data. Phase 0 runs. Every gap quantified, every pattern
  matched before the first Maestro meeting."

  Card 3: 03 · MAESTROS EMBEDDED
  "Operators, not advisors"
  "Maestros govern delivery from inside the client. They hold vendors
  accountable. Knowledge transfers to the client team — not back to us."

  Card 4: 04 · PLATFORM NOT PEOPLE
  "Scales without headcount"
  "One Maestro runs 3-4 engagements simultaneously. AI does the analysis.
  Same team handles 10x the engagements of a traditional consulting model."

---

## TAB 2 — VISION

Eyebrow: 5-YEAR VISION

H1: "The operating system
for enterprise transformation."

Body (white): "Today: a platform that makes Maestros 10x more effective.
In 5 years: the platform that every board mandates before approving any
transformation programme. The Genome becomes the most valuable dataset
in enterprise transformation — more verified outcome data than any entity
on earth."

4-column vision cards (equal width, same height):

  Card 1 (teal border, #091828 bg — ACTIVE NOW):
    Stage: TODAY · SEED (teal mono)
    Title: Platform + Maestro engagements
    Body: Phase-gated engagement engine. Maestros embedded.
    Platform license + engagement fees. Healthcare IT + FinServ beachhead.
    Genome seeded from research + founder experience.
    ARR number: $0 → $5M (teal 24px bold)
    ARR label: ARR target at Series A trigger

  Card 2:
    Stage: YEAR 2 · SERIES A
    Title: Genome becomes the product
    Body: 30+ real engagements feeding live pattern data. AbarVa predicts
    outcomes before programmes begin. "94% confidence — based on 12 similar
    engagements." No advisory firm can say that.
    ARR: $20–30M

  Card 3:
    Stage: YEAR 3–4 · SERIES B
    Title: Outcome accountability layer
    Body: Baseline methodology proven. Outcome fees introduced on top of base.
    15-20% of verified savings above baseline. The category-defining move —
    earned through delivery first.
    ARR: $50–80M

  Card 4:
    Stage: YEAR 5 · MARKET LEADERSHIP
    Title: Category defined and owned
    Body: CFOs mandate AbarVa before approving transformation spend.
    Genome licensed to advisory firms. "Has AbarVa assessed this?"
    becomes the standard board question.
    ARR: $150M+

Section title: "Why now — three converging forces"
3 cards with teal left border, white bg sides/top/bottom border:

  01 · AI CAPABILITY
  "The technical prerequisite just became available"
  "Claude, GPT-4, Gemini can now genuinely analyse enterprise data and
  produce board-quality output. This was not true 24 months ago.
  AbarVa's core capability became technically feasible in 2024.
  The window to define the category is open now."

  02 · ACCOUNTABILITY CRISIS
  "Boards are asking what £40M actually bought them"
  "Post-COVID transformation spend exploded. Results didn't follow.
  Boards are demanding ROI on advisory spend for the first time.
  The market is ready for a firm that builds accountability in from
  Day 0 — not as a differentiator, as a baseline expectation."

  03 · AI DISILLUSIONMENT
  "73% of enterprise AI produces no verified outcome"
  "$94M AI spend, zero ROI — this is not one company. It is most
  enterprise AI programmes. Boards are demanding accountability
  on AI investment specifically. AbarVa diagnoses why AI isn't
  working and creates the governance structure to fix it."

The Genome box (teal border card, #091828):
Header: "The Genome compounds. Here is where it stands today vs where it goes."

4 rows (label white | value teal bold | description white):
Today — Seeded          | 40+ patterns    | Built from published research, public case studies, Everest Group / KLAS / Gartner data, and 15 years of founder engagement experience
After 10 engagements    | 80–100 patterns | First live data. Recovery ranges start updating from actual outcomes. Vendor track records verified.
After 30 engagements    | 200–340 patterns| Cross-client intelligence live. Predictive capability emerges.
After 100 engagements   | 1,000+ patterns | The most comprehensive verified transformation outcome dataset in existence.

Footer line (white 11px):
"Third-party data sources feeding the Genome: KLAS Research · Everest Group PEAK Matrix
· Gartner Magic Quadrant · IDC transformation studies · Forrester TEI reports
· Public ERP vendor case studies · SEC earnings disclosures"

---

## TAB 3 — REVENUE MODEL

Eyebrow: REVENUE MODEL

H1: "Platform + services today.
Outcome fees in Phase 2."
— "Outcome fees in Phase 2." in teal italic

Body (white): "Seed stage: predictable platform license + Maestro engagement fees.
Series A: outcome accountability layer added on top of base fees.
Series B: pure outcome model for anchor clients.
We earn the right to outcome fees through delivery first — not as a starting position."

3 pricing tier cards:

  TIER 1 (border #1C2D45, bg #0D1520):
    Label: TIER 1 · INTELLIGENCE PLATFORM (teal mono, top border: 3px solid #445566)
    Price: $80K–200K (teal 22px bold)
    Subline: annually · platform license (white 11px)
    Features (teal dot + white text):
    · 5 Intelligence products — full access
    · Phase 0 + Phase 1 diagnostic only
    · No embedded Maestro
    · Client executes internally with AbarVa intelligence
    Footer: "Target: 50 clients · $150K avg = $7.5M ARR" (white, teal for dollar)

  TIER 2 (border #2DD4C8, bg #091828 — FEATURED):
    Pill: "Most common" (teal bg, dark text, 10px)
    Label: TIER 2 · MAESTRO-ASSISTED (teal mono, top border: 3px solid #2DD4C8)
    Price: $400K–1.2M
    Subline: per engagement · fixed fee per phase
    Features:
    · Platform + part-time Maestro (2-3 days/week)
    · Full Phase 0 through Phase 4
    · Fixed fee per phase — predictable for client
    · Baseline agreement from Phase 3 (outcome layer ready when Phase 2 arrives)
    Footer: "Target: 20 clients · $800K avg = $16M ARR"

  TIER 3 (border #1C2D45, bg #0D1520):
    Label: TIER 3 · FULL PROGRAMME (teal mono, top border: 3px solid #2DD4C8)
    Price: $1.5M–4M
    Subline: per programme · 12-18 months
    Features:
    · Platform + full-time senior Maestro on-site
    · Multi-solution engagement simultaneously
    · Fixed fee base + outcome bonus (Phase 2 model)
    · Anchor client relationships — Maestro brings their network
    Footer: "Target: 10 clients · $2M avg = $20M ARR"

Total box (teal border, #091828):
  "Total at scale — 80 clients across 3 tiers" (white 11px)
  "$43.5M ARR" (teal 28px 800)
  "· $7.5M + $16M + $20M · before outcome fees kick in" (white 14px)

ARR timeline: 5-cell horizontal grid
  Cell 1: Month 0–6 / $0 / "3 design partners. Proving the model."
  Cell 2: Month 6–12 / $3.2M / "6 clients. 3 converted DPs + 3 new."
  Cell 3: Month 12–18 / $9.6M / "12 clients. Series A trigger."
  Cell 4: Month 18–30 / $28M / "Post Series A. Outcome layer introduced."
  Cell 5 (teal border): Month 30–42 / $54M (teal) / "40 clients. Outcome fees compound."

---

## TAB 4 — THE ASK

Eyebrow (use amber #F59E0B instead of teal for this one): THE ASK

Large card (teal border, #091828 bg):
  Grid: 3fr left | 2fr right, divided by 1px border

  LEFT:
    "$8M" (white 52px 800)
    "seed · $25M cap · SAFE MFN" (teal 20px 700)
    Body (white 12px line-height 1.7):
    "Category-creation round. The product is built and working.
    The model is validated on paper. This money buys the team
    and the first real engagements that validate it in practice.

    Primary target: Anthropic Anthology Fund. Strategic angels
    who have built and exited professional services + AI businesses.
    Small number of high-conviction investors preferred over
    a large syndicate.

    Series A trigger: $5M ARR. At that point, the Genome has live
    data from 10+ engagements. Outcome layer is being introduced.
    Pre-money: $100M."

    Buttons (margin-top 20px):
    [Request briefing →] → mailto:invest@abarva.ai (teal filled, dark text)
    [See the platform] → https://nexus-vert-kappa.vercel.app (ghost, white border)

  RIGHT:
    Table rows (white label | teal or white value):
    Round size:          $8M (teal)
    Valuation cap:       $25M (teal)
    Structure:           SAFE — MFN
    Use of funds:        Team 55% · Product 25% · GTM 12% · Ops 8%
    Series A trigger:    $5M ARR
    Series A pre-money:  $100M
    Target close:        Q2 2026

Section title: "Use of funds — what $8M specifically buys"
4-card grid:

  40% (teal 32px bold)
  Team · $4.4M
  "CTO ($280K). Head of Product ($200K). 3 engineers ($180K avg).
  5 Maestros ($235K avg + delivery bonus). Founder ($200K).
  Recruiting + benefits."

  25%
  Product · $2M
  "AWS Bedrock + cloud infrastructure. Third-party data licensing
  (KLAS, Everest Group, Gartner). Engagement engine productisation.
  Genome automation pipeline build."

  12%
  GTM · $960K
  "HIMSS + ViVE (healthcare). Sibos + FIS (FinServ). Genome Insights
  published as research. 3 design partners converted to paying clients."

  8%
  Operations · $640K
  "Legal, compliance, D&O insurance. Office + equipment.
  Advisory board equity grants. Contingency."

---

## TAB 5 — TEAM

Eyebrow: THE TEAM

H1: "11 people.
Every one has done
this from the inside."
— "this from the inside." in teal italic

Body: "The Maestros are not just delivery. They sell. Every senior Maestro
comes with their client relationships — their prior clients become AbarVa's
first design partners. This is the GTM strategy: hire the right Maestros,
their network walks in with them."

Founder card (teal border, #091828 bg, grid: auto | 1fr):
  Left: "AS" circle (52px, teal bg, dark text)
  Right:
    Name: Anand Sundaram (white 20px 800)
    Title: FOUNDER · CEO (teal mono 9px)
    Bio (white 12px):
    "Former Managing Director and Data & AI NA Growth Lead at a top
    consulting firm. Sold and delivered the exact engagements AbarVa
    replaces — for Fortune 500 clients across healthcare IT and
    financial services. Watched £4M decks walk out the door with the
    knowledge. Built the platform to fix it.

    Why this founder: Knows exactly what advisory firms charge, how
    they deliver, where they fail, and what CXOs actually need. The
    product is built from the inside — not by someone guessing at the market."
    (key phrases in teal)

3-column grid (leadership):

  CTO card:
    Avatar: "CTO" (40px teal circle)
    Chief Technology Officer
    $260–300K + 2–3% equity
    From: Engineering lead at Palantir, C3.ai, Veeva, or enterprise AI
    platform. Or VP Engineering from consulting firm's AI arm.
    Delivers: All engineering, cloud architecture, Bedrock knowledge
    layer, platform scalability. Most critical hire.

  Head of Product card:
    Avatar: "HP" (green #00E676 circle)
    Head of Product
    $190–220K + 1–1.5% equity
    From: Senior PM at Palantir, ServiceNow, or enterprise SaaS.
    Delivers: Product roadmap, engagement engine UX, client portal,
    Genome product experience.

  Engineers card:
    Avatar: "ENG" (white circle)
    3 Engineers
    $170–190K avg + equity-heavy
    Profile: 2 senior full-stack. 1 AI/ML (Bedrock/RAG specialist).
    Delivers: S3 → Bedrock → RAG → Genome automation pipeline.

Section title: "Maestro team — they also sell"
3-column grid:

  Head of Delivery (teal border card):
    Avatar: "M1" teal
    Head of Delivery + Maestro Lead
    $260K + 1.5% equity + 25–30% delivery bonus
    From: Big 4 Partner or senior transformation exec.
    Delivers: Owns delivery methodology. Trains future Maestros.
    Runs Tier 3 engagements. Brings 3-5 warm CXO relationships day 1.

  Healthcare Maestros:
    Avatar: "M2" teal
    Healthcare IT Maestro × 2
    $230–250K + equity + delivery bonus
    From: Big 4 health practice lead, Epic implementation director,
    or CMO/CIO from major health system.
    Delivers: Each brings 2-3 warm healthcare relationships.
    Prior clients become first design partners.

  FinServ Maestros:
    Avatar: "M3" teal
    Financial Services Maestro × 2
    $230–250K + equity + delivery bonus
    From: Top consulting MD in asset management/banking or
    CDO/CIO from major financial services firm.
    Delivers: Each brings 2-3 warm FinServ relationships.

Footer bar (teal dot + white text):
"Advisory board (equity only): Former Fortune 100 CIO — Healthcare
· Former Fortune 100 CFO — FinServ · AI/ML architect (Bedrock/cloud)"

---

## TAB 6 — LIVE PLATFORM

Eyebrow: LIVE PLATFORM

H1: "Not a prototype.
A working product."
— "A working product." in teal italic

Body: "Deployed April 2026. Two composite clients loaded with real-world
datasets. Engagement engine built. Phase-gated from data upload to
board-ready output. Login credentials below — see it yourself in 5 minutes."

2×2 grid of clickable cards (hover: border → teal):

Card 1 → onclick window.open /diagnose?client=meridian
  Vert label: HEALTHCARE · $11.2B IDN · 42,000 EMPLOYEES
  Name: Meridian Health System (white 16px bold)
  Stat: $94M AI portfolio · $0 verified ROI · 18.2% denial rate (teal mono)
  Desc: 18.2% denial rate vs 12% benchmark. $94M in AI with zero verified
  return. Epic score 58/100 vs 80 benchmark. CMS mandate 14 months away.
  Diagnosed from uploaded datasets before first meeting.
  CTA: → See live diagnosis (teal 12px bold)

Card 2 → onclick /diagnose?client=arcturus
  Vert: ASSET MANAGEMENT · £16.2B REVENUE · £840B AUM
  Name: Arcturus Financial Group
  Stat: C/I 71% · target 58% · £840M gap · 28 AI initiatives · 0 live
  Desc: 28 AI initiatives. None in production. £94M committed.
  Bloomberg AIM 28yr — 3 failed modernisations at £32.6M total.
  CDO vacant 11 months. Everything visible before first meeting.
  CTA: → See live diagnosis

Card 3 → onclick /admin/client/arcturus
  Vert: MAESTRO WORKSPACE · PHASE-GATED · ADMIN VIEW
  Name: Maestro Admin Workspace
  Stat: Data uploaded · Phase 0 scored · Engagement active
  Desc: Upload datasets, review Phase 0 findings, manage engagement
  lifecycle, publish outputs to client portal. What a Maestro
  sees every day.
  CTA: → See the workspace

Card 4 → onclick /solutions/margin
  Vert: SOLUTIONS · 3 BUILT · MARGIN · PDLC · TECH
  Name: Solution Pages
  Stat: Margin Optimization · AI-Powered PDLC · Tech Modernization
  Desc: Three solution pages with Genome patterns and real client
  data. When logged in, AbarVa speaks first from uploaded datasets
  before any conversation begins.
  CTA: → See Margin Optimization

Confidentiality bar (teal dot, white text, #0D1520 bg):
"Login: investor+clerk_test@abarva.com / Demo2026!
· Verification: 424242
· Admin: anand+clerk_test@abarva.com / AbarVa2026!
· Confidential. Do not distribute.
Composite clients built from real-world datasets — not live client information."

---

## JAVASCRIPT

Simple tab switcher:
function show(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
}

---

## COMMIT

feat: investor page at /investor
- 6 tabs: Overview, Vision, Revenue Model, The Ask, Team, Live Platform
- White text throughout — no grey, no muted, no opacity tricks
- Teal #2DD4C8 for all accents, labels, featured elements
- Dark #060A12 background, #0D1520 cards, #091828 featured cards
- Palantir + ServiceNow analogies (not Harvey/McKinsey)
- Honest Genome: 40 patterns seeded, 340 after 30 engagements
- Revenue model: platform + services now, outcome fees Phase 2 (Series B)
- Team: 11 people — CTO critical hire, 5 Maestros who also sell
- Use of funds: 55% team, 25% product, 12% GTM, 8% ops
- Role-based auth: investor + admin full page, others see overlay
- All 4 demo links wired to live routes

Commit: "feat: investor page — seed 2026 thesis"
