# ABARVA TRACK 2 — COMPLETE DESIGN OVERHAUL
# Execute all tasks in order. Commit after each. No approval pauses.

════════════════════════════════════════════════════════════════
TASK 1 — DESIGN SYSTEM: ELIMINATE ALL GREY TEXT
════════════════════════════════════════════════════════════════

Two grey colors confirmed in use across the platform:
  rgb(148, 163, 184) = #94A3B8 (slate-400)
  rgb(71, 85, 105)   = #475569 (slate-600)

GLOBAL FIND AND REPLACE — hit every file:

1. In the theme/tokens object (wherever T.muted, T.text2 are defined):
   T.muted  = 'rgba(255,255,255,0.55)'  (was grey)
   T.text2  = 'rgba(255,255,255,0.75)'  (was grey)
   T.border = 'rgba(45,212,200,0.15)'   (keep teal border)

2. Find ALL instances of these hex/rgb values used as text color
   and replace with appropriate white/teal:
   
   '#94A3B8' → 'rgba(255,255,255,0.55)'
   '#64748B' → 'rgba(255,255,255,0.55)'  
   '#475569' → 'rgba(255,255,255,0.70)'
   '#718096' → 'rgba(255,255,255,0.55)'
   '#9CA3AF' → 'rgba(255,255,255,0.55)'
   'rgb(148, 163, 184)' → 'rgba(255,255,255,0.55)'
   'rgb(71, 85, 105)'   → 'rgba(255,255,255,0.70)'
   
   EXCEPTION: do NOT replace grey used for backgrounds or borders.
   Only replace grey used as text color (color: property).

3. Solutions pages specifically:
   - All body copy: #FFFFFF
   - Phase descriptions: rgba(255,255,255,0.80)
   - Tag text: #FFFFFF with teal border
   - "THREE PHASES" section label: #2DD4C8
   - "GENOME PATTERNS" label: #2DD4C8
   - Genome pattern descriptions: rgba(255,255,255,0.85)
   - Metric card secondary text: rgba(255,255,255,0.75)

4. AI Strategy page:
   - Phase header subtitles: rgba(255,255,255,0.80)
   - Module card descriptions: rgba(255,255,255,0.85)
   - "→" arrows on cards: #2DD4C8
   - "How engagements start" section body: rgba(255,255,255,0.80)

5. Engagement workspace sidebar:
   - Phase names (inactive): rgba(255,255,255,0.75)
   - Phase sublabels ("Situation Brief approved"): #2DD4C8
   - "PHASES" label: #2DD4C8
   - "GENOME PATTERNS" label: #2DD4C8
   - Genome pattern descriptions: rgba(255,255,255,0.80)

COMMIT: "design: eliminate all grey text — white/teal only system-wide"

════════════════════════════════════════════════════════════════
TASK 2 — SOLUTIONS PAGES: FULL REAL ESTATE + CXO DESIGN
════════════════════════════════════════════════════════════════

Apply to: src/app/solutions/[solution]/page.tsx

LAYOUT CHANGES:
- Remove narrow centered column constraint
- Use 90% viewport width (max-width: 1400px, centered)
- Padding: 0 5vw

HERO SECTION (top):
- Intelligence name: JetBrains Mono 11px teal uppercase — keep
- Solution name: 52px bold white — increase from current
- One-line outcome: 18px rgba(255,255,255,0.80) — replace grey
- Metrics cards: 2x2 grid, full width
  Each card: dark surface (#0D1420), teal border on hover
  Primary value: 36px bold (teal for positive, white for neutral)
  Label: JetBrains Mono 10px teal uppercase
  Secondary text: rgba(255,255,255,0.75) — NOT grey

TAGS ROW:
- Background: rgba(45,212,200,0.08)
- Border: 1px solid rgba(45,212,200,0.25)
- Text: #FFFFFF
- Font: DM Sans 12px

PHASES SECTION:
- "THREE PHASES" label: #2DD4C8, JetBrains Mono
- Phase number: 48px bold teal (was small)
- Phase name: 20px bold white
- Phase description: 14px rgba(255,255,255,0.80) — not grey
- Workstream tags under each phase: teal text, teal border, dark bg

GENOME PATTERNS SECTION (right panel or bottom):
- "GENOME PATTERNS" label: #2DD4C8
- Pattern ID (F002 etc): JetBrains Mono teal bold
- Pattern title: white bold
- Pattern description: rgba(255,255,255,0.80)
- Confidence %: teal large
- Severity badge: 
  CRITICAL = red (#EF4444) text, dark red border
  HIGH = orange (#F97316) text, dark orange border  
  CONFIRMED = teal text, teal border

POWERED BY INTELLIGENCE (new section, bottom of page):
- Label: "POWERED BY" — JetBrains Mono 9px teal uppercase
- Intelligence module tags: small teal pill buttons
  Margin: "Situation Intelligence · Margin Intelligence · Contradiction Intelligence"
  PDLC: "Situation Intelligence · Delivery Intelligence · Technology Intelligence"
  Tech: "Situation Intelligence · Technology Intelligence · Vendor Intelligence"

CTA SECTION:
- Primary button: teal background, dark text, "See it with [Client] →"
- Secondary: white border, white text, "See it with your data →"

COMMIT: "design: solutions pages — full real estate, no grey, CXO-ready"

════════════════════════════════════════════════════════════════
TASK 3 — ENGAGEMENT WORKSPACE: LAYOUT + DELIVERABLES PANEL
════════════════════════════════════════════════════════════════

Apply to: src/app/engage/[clientId]/[solution]/page.tsx

LAYOUT — full real estate:
- Left sidebar: 220px (keep, tighten)
- Main content: flex-1, no max-width constraint
- Right panel: 340px (wider than current)
- Total: 100vw minus sidebar minus right panel = chat area

SIDEBAR DESIGN:
- "PHASES" label: JetBrains Mono 9px #2DD4C8 uppercase
- Phase name active: #FFFFFF bold 13px
- Phase name inactive: rgba(255,255,255,0.60) 13px
- Phase sublabel (e.g. "Situation Brief approved"): #2DD4C8 10px
- Phase sublabel (e.g. "Awaiting approval"): rgba(255,255,255,0.50) 10px
- Progress line: teal (#2DD4C8) for completed, rgba(255,255,255,0.15) for pending
- UNLOCK button: teal border, teal text, dark background
- "GENOME PATTERNS" label: JetBrains Mono 9px #2DD4C8
- Genome pattern ID: JetBrains Mono teal bold
- Genome description: rgba(255,255,255,0.80) — not grey

WORKSTREAM TAB BAR (sticky, between header bar and chat):
- Full width, dark background (#0A1018)
- Tab items: DM Sans 13px 
- Active tab: white bold, teal underline 2px
- Inactive tabs: rgba(255,255,255,0.55), teal on hover
- Right side of tab bar: "X of Y deliverables signed off" — JetBrains Mono 10px teal
- Border bottom: 1px solid rgba(45,212,200,0.15)

CHAT AREA:
- Background: #060A12
- AbarVa AI message bubble: 
  Background: rgba(45,212,200,0.06)
  Border left: 2px solid #2DD4C8
  Sender label: "AbarVa AI" — JetBrains Mono 10px teal
  Text: #FFFFFF 14px, line-height 1.7
  Genome pattern tags [ARC-M02]: JetBrains Mono 10px, 
    teal background rgba(45,212,200,0.15), teal border, teal text
- User message bubble:
  Background: rgba(255,255,255,0.04)
  Border left: 2px solid rgba(255,255,255,0.15)
  Sender label: user name — DM Sans 10px rgba(255,255,255,0.60)
  Text: #FFFFFF 14px
- Timestamp: JetBrains Mono 9px rgba(255,255,255,0.35)

RIGHT PANEL:
Add DELIVERABLES as the second tab (between FINDINGS and OUTPUT):
Tabs order: FINDINGS | DELIVERABLES | OUTPUT | ACTIVITY
All tab labels: JetBrains Mono 11px
Active: #FFFFFF, teal underline
Inactive: rgba(255,255,255,0.50)

FINDINGS TAB (existing — improve styling):
- Finding card: dark surface (#0D1420), teal left border 2px for CRITICAL
- Finding title: #FFFFFF 13px bold
- Finding body: rgba(255,255,255,0.80) 12px
- CRITICAL badge: #EF4444 text, rgba(239,68,68,0.15) background
- CONFIRMED badge: #2DD4C8 text, rgba(45,212,200,0.15) background
- HIGH badge: #F97316 text
- Dispute/Publish/Remove buttons: small, mono font

DELIVERABLES TAB (new):
Each deliverable card:
  Container: dark surface (#0D1420), border 1px solid rgba(45,212,200,0.12)
  Border-radius: 8px, padding: 14px, margin-bottom: 8px
  
  Deliverable name: #FFFFFF 13px DM Sans 600
  
  Status badge (right-aligned):
    IN PROGRESS: rgba(255,255,255,0.15) bg, rgba(255,255,255,0.50) text
    READY FOR REVIEW: rgba(45,212,200,0.15) bg, #2DD4C8 text
    SIGNED OFF: rgba(34,197,94,0.15) bg, #22C55E text + "✓"
  
  Signed-off timestamp: JetBrains Mono 9px rgba(255,255,255,0.40)
  "Anand Sundaram · Apr 15, 2026"
  
  "Sign Off" button (Maestro/admin only, READY FOR REVIEW state):
    Background: #2DD4C8, color: #060A12, DM Sans 12px 600
    Border-radius: 6px, padding: 6px 14px
  
  MASTER OUTPUT deliverables (special styling):
    Border: 1px solid rgba(45,212,200,0.35) (brighter teal)
    Left accent: 3px solid #2DD4C8
    Name: white bold + "MASTER OUTPUT" tag in teal mono
    When all sub-deliverables signed off:
      "Ready for CXO Approval →" button appears
      Background: teal, full width, bold

COMMIT: "design: engagement workspace — deliverables panel, full layout, no grey"

════════════════════════════════════════════════════════════════
TASK 4 — PHASE OUTPUT PAGES: CXO-READY HTML RENDERS
════════════════════════════════════════════════════════════════

When a phase output is published and viewed in the OUTPUT tab,
it renders as a full designed HTML page — not markdown/plain text.

Create a renderer component: src/components/OutputRenderer.tsx
Takes: output type + content data
Renders: designed HTML page within the OUTPUT tab panel

OUTPUT TYPE 1: SITUATION BRIEF

Layout: full width, dark background
Font: DM Sans body, JetBrains Mono for labels/codes

HEADER BLOCK:
  Row 1: "AbarVa" wordmark left + "CONFIDENTIAL" mono tag right
  Row 2: Client name (24px bold white) + "Situation Brief" (teal)
  Row 3: Date generated + Engagement ID (mono 10px muted white)
  Divider: 1px teal line

EXECUTIVE SUMMARY (3 cards, full width row):
  Each card: dark surface, teal left border 3px
  Card title: 14px bold white
  Key metric: 36px bold teal
  Description: 13px rgba(255,255,255,0.80)
  Example:
    "Total addressable gap" / "$167M" / "Across 5 confirmed categories"
    "Highest confidence finding" / "F008 — 94%" / "AI spend zero ROI"
    "Recovery timeline" / "14 months" / "To full payback at base case"

GAP REGISTER (full width table):
  Header: "GAP REGISTER" — JetBrains Mono teal uppercase
  Table headers: teal text, JetBrains Mono 10px
  Columns: # | Gap | Category | Annual Cost | Genome Pattern | Confidence | Status
  Rows: alternating #0D1420 and #060A12
  Text: white
  Pattern tags: teal pill
  Status: color-coded badge (CRITICAL/HIGH/MEDIUM)

RECOVERY RANGE VISUALIZATION:
  Header: "RECOVERY RANGE"
  Visual: horizontal bar
    Left label: "Addressable" — teal
    Right label: "Structural (not recoverable)" — rgba white
    Teal fill for addressable portion
    White outline for structural
    Dollar amounts at each boundary
  Below: "Fee charged only on verified savings · 15–20% of recovery"

GENOME MATCHES (card grid, 2-3 per row):
  Each card: dark surface, teal top border 2px
  Pattern ID: JetBrains Mono large teal bold (F001, F008 etc)
  Confidence bar: teal fill, shows X%
  Title: white 13px bold
  Description: rgba(255,255,255,0.80) 12px
  Severity: badge

APPROVAL BLOCK (bottom):
  "This Situation Brief was reviewed and approved by:"
  Name: white bold | Role: teal | Date: mono muted
  AbarVa logo + "Intelligence. Now act on it."

---

OUTPUT TYPE 2: INVESTMENT COMMITTEE PACKAGE

HEADER: Same as Situation Brief header pattern

3-SCENARIO MODEL (main visual, full width):
  3 columns: BEAR | BASE | BULL
  Column headers: mono uppercase
  Investment row: white bold
  Return row: teal bold LARGE (48px)
  IRR row: teal
  Payback row: white
  BEAR column: slightly muted
  BASE column: full brightness, teal left border
  BULL column: slightly muted
  "Genome-validated against 3 comparable FinServ transformations"

PAYBACK TIMELINE (horizontal bar chart):
  Title: "PAYBACK TIMELINE"
  Bar: teal fill shows months to payback
  Milestone markers: Month 0, Month 6, Month 14 (payback), Month 36
  Year 1 / Year 2 / Year 3 return labels above bar

RISK REGISTER (table):
  Columns: Risk | Likelihood | Impact | Mitigation
  Traffic light: 🔴 🟡 🟢 (as colored dots not emoji)
  All text white, alternating rows

GENOME BENCHMARK COMPARISON (table):
  "This engagement vs Genome comparables"
  Columns: Metric | This Engagement | Genome Average | Best Case
  Highlight rows where this engagement exceeds Genome average (teal)

VENDOR RECOMMENDATION CARD:
  Full width, teal border
  "RECOMMENDED" badge top right (teal)
  Vendor: "Tier 1 SI — B" (white bold)
  Genome match: "87%" (teal large)
  Day rate: "$2,100 vs $2,800 market" (white)
  3 contract protections: bulleted list with teal dots

---

OUTPUT TYPE 3: BASELINE AGREEMENT

Formal document style — still AbarVa dark design

HEADER: Client + "Baseline Agreement" + "Day 0: [date]"
Subtitle: "This agreement locks the measurement baseline 
for the AbarVa engagement. Fee is earned only when verified 
savings exceed the baseline."

KPI TABLE:
  Columns: KPI | Current Baseline | Target | Measurement Method | Frequency
  All white text, teal headers
  Key rows highlighted: C/I ratio, consulting spend, AI portfolio

FEE TRIGGER TABLE:
  Columns: Savings Threshold | Fee % | Fee $ Released | Verification Method
  Teal highlight on trigger rows

SIGNATURE BLOCK:
  "Agreed and accepted by:"
  Two columns: Client CEO | AbarVa (Anand Sundaram)
  Name: white bold
  Role: teal
  Date: mono
  "Digital signature via AbarVa platform · [timestamp]"

---

OUTPUT TYPE 4: OUTCOME DASHBOARD (live, monthly)

HEADER: "OUTCOME TRACKING · Month [N]" + date range

4 KPI CARDS (2x2 grid):
  Each card: dark surface, colored top border (green=on track, amber=behind, red=at risk)
  Metric name: mono teal uppercase
  Current value: 48px bold white
  Target: 14px "Target: X" — rgba white
  Variance: teal for positive, red for negative
  "↑ Ahead" / "→ On track" / "↓ Behind" badge

TREND CHART (SVG, full width):
  Background: #0D1420
  X-axis: months (white, mono small)
  Y-axis: values (white, mono small)
  Target line: dashed rgba(255,255,255,0.30)
  Actual line: solid teal #2DD4C8
  Data points: teal circles
  Area fill: rgba(45,212,200,0.08)

FEE TRACKER (bottom):
  Full width dark card, teal border
  "VERIFIED SAVINGS TO DATE" — mono teal uppercase
  Amount: 48px bold teal
  "AbarVa fee earned: $X" — 24px white
  "Next trigger at $X additional savings" — mono muted white
  Progress bar: teal fill towards next trigger threshold

MONTHLY TIMELINE (bottom):
  Horizontal dots: Month 1 through Month N
  Completed months: teal dot + checkmark
  Current month: teal dot, pulsing
  Future months: rgba white dot
  Each dot: hover shows monthly summary card

COMMIT: "design: CXO-ready phase output pages — Situation Brief, IC Package, Baseline Agreement, Outcome Dashboard"

════════════════════════════════════════════════════════════════
TASK 5 — AI STRATEGY PAGE: ENRICH MODULE CARDS
════════════════════════════════════════════════════════════════

Apply to: src/app/ai-strategy/page.tsx

Keep the 3-phase structure exactly as is.
Enrich each module card with this structure:

MODULE CARD LAYOUT:
  Container: dark surface (#0D1420), full width
  Border: 1px solid rgba(45,212,200,0.12)
  Border-radius: 10px
  Padding: 20px 24px
  Hover: border-color rgba(45,212,200,0.35)
  
  Left: Number badge (keep teal circle)
  
  Content area:
    Row 1: Module name (16px bold white) + Output artifact tag (right-aligned)
           Output tag: JetBrains Mono 9px teal uppercase
           e.g. "OUTPUT: SITUATION BRIEF · 48HRS"
    
    Row 2: CXO question (13px italic #2DD4C8)
           e.g. "What's actually broken — and what is it costing right now?"
    
    Row 3: 3 capability bullets (12px rgba(255,255,255,0.80))
           Bullet: teal dot (·)
           Each bullet is specific and data-referenced:
    
    Row 4: "→" arrow right-aligned teal

MODULE CONTENT (all 9):

01 Situation Intelligence
   CXO question: "What's actually broken — and what is it costing right now?"
   Bullets:
   · 340 Genome patterns run against your cost structure and operations
   · Every gap ranked by recovery range, confidence, and time-to-fix
   · Addressable vs structural split delivered in 48 hours
   Output: SITUATION BRIEF · 48HRS

02 Contradiction Intelligence  
   CXO question: "What did leadership tell the board — and what does the data actually show?"
   Bullets:
   · Every leadership statement cross-referenced against financial and operational data
   · Source-by-source verification with confidence rating per contradiction
   · Contradiction map used to calibrate Phase 2 prescriptions
   Output: CONTRADICTION MAP · 72HRS

03 Data Intelligence
   CXO question: "What can your data actually support — and what gaps are blocking AI?"
   Bullets:
   · Completeness scored across 12 data dimensions
   · Pipeline gaps flagged with specific remediation steps
   · Data readiness certificate generated before AI investment approved
   Output: DATA READINESS CERTIFICATE · 1 WEEK

04 Technology Intelligence
   CXO question: "Which systems are blocking you — and in what order do you fix them?"
   Bullets:
   · Every system scored: age, cost, dependency depth, migration risk
   · EOL systems flagged with regulatory and operational exposure
   · Modernisation sequence generated and Genome-validated
   Output: AI READINESS CERTIFICATE · 1 WEEK

05 Vendor Intelligence
   CXO question: "Which vendor will actually deliver — in your specific context, not their deck?"
   Bullets:
   · Vendors scored against Genome outcomes from comparable engagements
   · Contract anchors generated: benchmark rates, key person clauses, IP terms
   · Failure probability calculated per vendor based on pattern match
   Output: VENDOR SCORECARD · 1 WEEK

06 Architecture Intelligence
   CXO question: "What do we build, in what order — and what will fail if we get the sequence wrong?"
   Bullets:
   · Architecture options generated with dependency mapping
   · Each option validated against Genome failure patterns
   · Build sequence optimised for risk and speed-to-value
   Output: ARCHITECTURE BLUEPRINT · 2 WEEKS

07 Business Case Intelligence
   CXO question: "What is the CFO-grade case — with ranges the board will actually approve?"
   Bullets:
   · Three scenarios (Bear/Base/Bull) built from your data and Genome comparables
   · Risk-adjusted IRR with sensitivity analysis
   · Investment committee package: every objection pre-answered
   Output: IC PACKAGE · 1 WEEK

08 AI Delivery Intelligence
   CXO question: "How do we get AI from approved spec to production — without the usual 18-month slip?"
   Bullets:
   · Delivery bottlenecks mapped before programme starts
   · MLOps sequence designed for your specific stack
   · Deployment rails built to your engineering capacity
   Output: EXECUTION BASELINE · 2 WEEKS

09 Outcome Intelligence
   CXO question: "How do we know it worked — and how does AbarVa's fee get earned?"
   Bullets:
   · Baseline locked Day 0 — no retroactive adjustment
   · Monthly actuals vs baseline tracked in real time
   · Fee released only on verified, audited savings
   Output: LIVE OUTCOME DASHBOARD · ONGOING

COMMIT: "design: AI Strategy module cards — CXO questions, capabilities, output artifacts"

════════════════════════════════════════════════════════════════
TASK 6 — HOMEPAGE: MINOR UPDATES
════════════════════════════════════════════════════════════════

src/app/page.tsx (or wherever homepage lives)

1. Under the hero subhead, add one line:
   "Start with a Solution. Scale to a full AI Strategy engagement."
   Style: DM Sans 14px rgba(255,255,255,0.70), centered

2. Replace any grey text with white/rgba white (same rules as Task 1)

3. The "See it with Meridian Health" CTA button:
   Update to: "See it with Arcturus →" OR keep Meridian — 
   whichever matches the primary demo client for Shail

4. Stats on homepage ($200B, 73%, 48hrs, "Skin in the game"):
   All values: teal or white bold
   All labels: rgba(255,255,255,0.75) — NOT grey

COMMIT: "design: homepage — no grey, AI Strategy line, stats polish"

════════════════════════════════════════════════════════════════
COMMIT SEQUENCE SUMMARY:
════════════════════════════════════════════════════════════════
1. "design: eliminate all grey text — white/teal only system-wide"
2. "design: solutions pages — full real estate, no grey, CXO-ready"  
3. "design: engagement workspace — deliverables panel, full layout"
4. "design: CXO-ready phase output pages — all 4 output types"
5. "design: AI Strategy module cards — enriched with capabilities"
6. "design: homepage — no grey, AI Strategy line, stats polish"

Push after each commit. QA each page before moving to next.
Do not bundle commits. Do not pause for approval.
