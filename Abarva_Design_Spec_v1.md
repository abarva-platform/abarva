# Abarva — Best-in-Class Design Specification
*Version 1.0 — April 11, 2026 | Built for the Monday sprint*

---

## DESIGN PRINCIPLES (Non-negotiable on every screen)

1. **No blank prompts** — every input has context, suggestions, or guided choices
2. **Data first, question second** — always surface what Abarva knows before asking
3. **Progressive disclosure** — reveal intelligence as the conversation deepens
4. **C-suite language** — no consulting jargon, advisor tone throughout
5. **Numbers are the language** — every insight anchors to a real dollar amount
6. **One action per moment** — guide to the next right step
7. **Mobile-first QA** — every screen tested at 375px before called done

---

## ITEM 1 — Maestro Admin: The Starting Point

### Current state
Basic engagement list with quick-action buttons. Functional but not impressive.

### Best-in-class design

**Page architecture — three zones:**

**Zone 1: Command Header**
Full-width bar showing:
- Portfolio health score ("Portfolio Intelligence: 89%")
- Total value identified across all engagements ($1.65B)
- Pending actions count with urgency red dot
- Maestro name and access level badge
- Prominent "New Engagement" button

**Zone 2: Engagement Cards — Rich Intelligence View**
Each card is a mini-dashboard:
```
[Color bar] [Client name + industry tag]
[Phase pill] [Confidence ring — animated]
[Data completeness bar: "74% complete — 3 datasets missing"]
[3 live metrics with actual numbers from their data]
[Next milestone + days until]
[Value identified — large green number]
[Action buttons: Open | Add Data | Brief | Track Outcomes]
```
Clicking any metric drills into that intelligence view.

**Zone 3: Maestro Intelligence Panel (right sidebar)**
- Real-time activity feed across all engagements
- Pending approvals queue
- Regulatory alert ticker
- Cross-engagement pattern callout ("RCM issues in 2 of 3 clients")

**New Client Onboarding — 5-Step Wizard:**

Step 1: Org identity → Abarva pre-populates public intelligence immediately
Step 2: Data loading → visual completeness map by category, templates, drag-and-drop
Step 3: Access assignment → who gets what access level
Step 4: Engagement scope → which products, timeline, value hypothesis
Step 5: Launch → cockpit activates with first suggested action

---

## ITEM 2 — Maestro Training & Guidance

### Best-in-class design

**Dedicated tab in Admin: "Maestro Playbook"**

**Section 1: Orientation**
Interactive guided walkthrough — not a PDF. Annotated tooltips through each product. 10 minutes. Completion badge.

**Section 2: Data Mastery**
Visual table for every dataset type:
- What it is | Why it matters | Format accepted | Template download | Insight unlocked

Sample datasets available for every category — credible, anonymized, demo-ready.

**Section 3: Process Playbooks**
Step-by-step guides per engagement type:
- Data & AI Strategy: 8 steps, time per step, Abarva output, Maestro action
- Vendor Selection: 5 steps
- IT Audit: 6 steps

**Section 4: Governance & Controls**
Upload workflow → review → approval → access assignment → audit log.
Data retention policy per engagement type.

**Section 5: Demo Playbook**
- How to run a CXO demo — script, timing, talking points
- WOW moments — the 3-4 moments that consistently land
- Objection handling guide — McKinsey, ChatGPT, security, pricing

---

## ITEM 3 — Data Pivot During Engagement

### Best-in-class design

**In-conversation data nudge (inline, non-blocking):**
When Abarva detects insufficient data:
```
┌─────────────────────────────────────────────────────┐
│ 📊  Abarva can be more precise                      │
│  Your IT vendor spend data would improve this       │
│  answer from 71% to 94% confidence.                 │
│                                                     │
│  [Upload now — 2 min]  [Continue with current data] │
└─────────────────────────────────────────────────────┘
```

**Upload flow — non-disruptive:**
- Opens as slide-over panel — conversation stays visible
- Drag and drop → instant parsing → Abarva narrates what it found
- Panel closes → conversation resumes with new data incorporated
- Response upgrades automatically: "With the vendor data now loaded..."

**Persistent data confidence bar:**
```
Data confidence: ████████░░ 78%   [What would get this to 95%? →]
```

**Engagement data cockpit (persistent right panel):**
- All loaded data with timestamp and uploader
- Missing data with confidence impact
- Pending approvals
- Quick upload always visible

---

## ITEM 4 — AI Strategy: Full Artifact & Deliverable Suite

### Best-in-class design

**8-step guided workflow — not a chat interface.**

**Step 1: Current State Assessment**
Two-column layout:
- Left: auto-populated data summary by domain (Infrastructure, Apps, Data, AI/ML, Governance) — maturity scores, benchmarks, red/yellow/green
- Right: AI-generated executive narrative — prose, specific names and numbers, ends with "The 3 most consequential gaps"

**Step 2: Business Goals Alignment**
- Pre-loaded strategic priorities from org data
- Maestro adds additional goals
- Abarva maps each goal to AI capability with expected impact
- Output: Goals-to-AI alignment matrix

**Step 3: Gap Analysis**
Current capability vs. target capability:
- Gaps ranked by: financial impact, urgency, complexity
- Each gap: root cause, cost to close, value of closing, recommended sequence

**Step 4: Target State Architecture / Blueprint**
- Interactive architecture diagram (not static)
- Organized by: Front Office / Middle Office / Back Office / Data Platform / AI Layer
- Each component clickable: current vendor, recommended options, timeline
- Toggle: Current State | Target State | Gap (what changes)
- Export: PDF board diagram, PowerPoint slide

**Step 5: Roadmap by Phase**
Horizontal swimlane timeline:
- Foundation (Months 1-6)
- Acceleration (Months 7-18)
- Differentiation (Months 19-36)

Each initiative card: name, owner, investment, value, dependencies (visual), risk level.
Filters: function, investment size, time horizon, priority.

**Step 6: "What Do We Need to Execute"**
- Skills gap analysis
- Vendor recommendations by initiative (links to Select product)
- SI partner recommendations
- "Launch vendor selection for [initiative]" → opens Select pre-populated

**Step 7: Business Case**
Auto-generated:
- Total investment (3-year)
- Total value (conservative / base / optimistic)
- Payback period, NPV, IRR
- Key assumptions surfaced explicitly
- Export: CFO-ready Excel financial model

**Step 8: Export & Artifacts**
One-click generation:
- Board presentation (12-slide PowerPoint, executive quality)
- Current state assessment (PDF)
- Target state architecture diagram (PDF/SVG)
- Phased roadmap (PDF + Excel)
- Business case model (Excel)
- Executive summary (1-page PDF)

All exports branded with client name, date, "Prepared with Abarva."

---

## ITEM 5 — Vendor / Select Product: Full Rethink

### Best-in-class design

**Entry: "What are you trying to decide?"**
Four paths:
1. Select a vendor for a specific need
2. Rationalize vendors (consolidation, cost savings)
3. Audit current vendors (spend and performance)
4. Build an RFP/RFI

---

**Path 1: Select a Vendor — 6 Steps**

Step 1: Structured intake (category selector, budget, timeline, requirements — org context auto-loaded)

Step 2: Abarva shortlist — 3-5 vendors, scored 0-100
Score breakdown: org fit | implementation track record | KLAS/Gartner | financial stability | vertical references | contract flexibility
Each card: recommendation tag, key bullets, deal-breaker flags, "why not" for excluded vendors

Step 3: Side-by-side comparison table — green/red per cell, filter by priority

Step 4: Reference intelligence — peer orgs, known outcomes, red flags (KLAS trends, layoffs, ownership changes)

Step 5: Negotiation playbook (auto-generated)
- List price vs. what peers actually pay
- Most negotiable line items (typically 30-50% off list)
- Contract terms to demand: named resources, milestone payments, 90-day out clause, SLA penalties with teeth
- Outcome-based pricing language
- Walk-away triggers

Step 6: RFP/RFI generation
One-click: scope of work, weighted evaluation criteria, required responses, scoring rubric, timeline.
Downloads as Word document, immediately editable.

---

**Path 2: Vendor Rationalization**
- Loads all vendor contracts from org data
- Maps vendor → function → cost center
- Identifies: overlap, underutilization, consolidation opportunities
- Output: "Consolidating these 3 analytics vendors saves $4.2M annually"
- Produces vendor exit sequence and transition risk assessment

---

**Path 3: IT / Tech Audit**

Spend view: IT spend by category vs. benchmark
Vendor performance view: SLA compliance, contract vs. actual performance gaps, vendor risk flags
Opportunity view: Top 5 cost reduction opportunities, top 3 vendor relationship actions

---

**Path 4: Contracting & Negotiation Support**
- Upload draft contract → Abarva redlines it
- Flags: unfavorable terms, missing SLA penalties, auto-renewal traps, IP ownership risks
- Suggests specific alternative language
- Generates negotiation talking points
- Tracks negotiation progress (asked, agreed, still open)

---

## ITEM 6 — Product Integration: Strategy as the Hub

### Best-in-class design

**Engagement Progress Map — top of every product page:**
```
[Strategy] → [Diagnose] → [Justify] → [Select] → [Track] → [Optimize]
    ✓            ✓           ◐           →           ○           ○
```
Clicking any completed step loads that output — no rework.

**Context carries forward automatically:**
Priority initiative from Strategy Step 4 → pre-loaded in Justify. No re-explaining.

**Product handoff buttons at every workflow end:**
- "Vendor selection needed → Launch Select" (pre-populated)
- "Build business case → Launch Justify" (pre-populated)
- "Return to Strategy with this finding" (auto-incorporated)

---

## ITEM 7 — Architecture: Multi-Cloud, Multi-Model

### Best-in-class design

**Admin → Architecture tab:**

Deployment model selector:
[Abarva Cloud] [Client AWS] [Client Azure] [Client GCP]

AI model selector:
[Claude Sonnet (default)] [Claude Opus] [GPT-4o] [Gemini 1.5 Pro]
Switching shows: capability comparison, cost difference, compliance implications

Security architecture diagram:
- Data flow: client → Abarva platform → AI model
- Encryption labeled, data residency options, PII handling
- "Your data never trains any AI model" — prominent

**Technical implementation:**
- Abstract AI client behind a provider interface
- Model config via environment variable or per-engagement setting
- Claude remains default — dropdown exists, others future-state

---

## ITEM 8 — Security, Privacy & Access Controls

### Best-in-class design

**Admin → Security & Governance section:**

**Data classification:**
Every dataset tagged on upload:
- Public (all engagement members)
- Internal (all Maestro roles)
- Confidential (Full Maestro only)
- Restricted (Maestro grants per-engagement, per-user, with expiry)

Auto-suggested sensitivity level → data steward confirms → logged.

**Maestro data intelligence dashboard:**
- All data across all engagements (what, when, who)
- Access log — who viewed what, when
- Pending permissions requests
- Data expiry dates
- Anomaly alerts

**4 investor-ready security statements:**
1. Data never leaves your designated cloud environment
2. Every data access is logged and auditable
3. AI model never retains or trains on client data
4. Role-based access enforced at row level (Supabase RLS)

---

## ITEM 9 — Revenue Model: Pressure-Tested

### Best-in-class design

**Investor page → "The Business Model — Built to Withstand Every Objection"**

**Two revenue streams:**

Stream 1 — Enterprise Intelligence License: $500K-750K/year (design partner flat rate, full access). Recurring, 85-90%+ gross margin.

Stream 2 — Solution Add-Ons: $120K-500K per solution (Maestro-led deployment)
Stream 3 — Marketplace Referral: 10-15% of Year 1 vendor spend, fully disclosed
Stream 4 — Outcome Fee (Series A unlock): 15-20% of verified savings — infrastructure built at seed, fee activates at Series A

**Unit economics display:**
```
Meridian Health System — Year 1
Platform fee:        $500K
Outcome fee:       $4,200K   (15% × $28M verified savings)
─────────────────────────────
Total revenue:     $4,700K
Delivery cost:       $420K   (1 Maestro × 12 months)
Gross margin:           91%
```

**Objection table (8 objections):**

| Objection | Our response |
|---|---|
| "McKinsey will do this" | They are a channel, not a competitor. Their partners use Abarva to deliver more engagements with higher margins. |
| "ChatGPT does this" | ChatGPT knows nothing about this org. Abarva knows their denial rate, their SLA penalties, their benchmark gaps — before the first conversation. |
| "Client won't pay" | They already pay $4-8M per engagement with zero outcome accountability. We cost less and put our fees at risk. |
| "Attribution is impossible" | We set a documented baseline at engagement start and track every metric continuously. Same model outcome-based SI firms have used for 20 years — automated. |
| "Security concerns" | We deploy within the client's own cloud. Their data never crosses our boundary. |
| "Claude gets too expensive" | We are model-agnostic. Claude is today's best — not a hard dependency. |
| "Just a wrapper" | Show them the contradiction detection engine and failure genome. No wrapper has that. |
| "SIs will build their own" | They cannot be outcome-accountable — it would cannibalize their time-and-materials revenue. We can because we start clean. |

---

## ITEM 10 — Structured Response Options

### Best-in-class design

**Every Abarva response ends with 3 tappable option cards + free text:**

```
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ 📊 Root cause        │ │ 💰 Financial impact  │ │ 🏢 Peer benchmarks  │
│                      │ │                      │ │                      │
│ Why is the denial    │ │ What does 18.2%      │ │ Where does Meridian  │
│ rate this high?      │ │ denial rate cost us? │ │ rank nationally?     │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│ ✏️  Ask something else...                                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Context-aware:** Options generated from what was just discussed + user role + org's specific data. Reference real numbers — never generic.

**Option card design:** Icon + bold headline (4-6 words) + 1-sentence description. Min 48px touch target.

**Multiple output views for strategy questions:**
```
[Board summary — 3 slides]  [CIO technical deep dive]  [CFO financial impact]  [Custom]
```
Same analysis, different framing per audience.

---

## ITEM 11 — Each Product Stands Alone

### Best-in-class design

**Standalone mode:** Arrive at /diagnose directly. Select client or create new. Full functionality. Save to engagement later.

**Engagement mode:** Org pre-selected, prior work pre-loaded, progress tracked.

**Product landing page (each product):**
- 2-sentence description
- Data completeness indicator for selected client
- Output examples
- One button: "Start [Product Name]"

---

## ITEM 12 — AI Strategy Scope: Enterprise vs. Narrow

### Best-in-class design

**Scope selector at strategy start:**
```
Narrow ←─────────────────────────────→ Enterprise
[Finance] [HR] [Operations] [IT] [Clinical]   [All functions]
```

**Narrow scope:** Single function. Function-specific benchmarks and use cases. 4 steps. Single-function strategy document.

**Enterprise scope:** Full 8-step. All functions. Use case rationalization. Portfolio prioritization with dependencies.

**Hybrid (most common):** Enterprise scan (Steps 1-2) → top 3 function opportunities → deep-dive on selected.

**Persistent scope indicator:**
```
📍  Scope: Finance  |  Meridian Health System  |  Step 3 of 5
```

---

## ITEM 13 — Data Upload: Robust, Guided, Intelligent

### Best-in-class design

**Data categories by domain:**

Technology: Infrastructure inventory, application portfolio, architecture artifacts, cloud utilization, integration maps

Financial: IT budget by category, vendor spend, earnings reports, capital allocation, initiative tracking

Operations: Process documentation, KPI dashboards, operational metrics

People: Org charts, leadership profiles, skills inventory

Engagement-specific: Interview notes, strategic plans, vendor proposals, contracts, drafts

---

**Upload experience — 5 stages:**

1. **Drop or browse** — Excel, CSV, PDF, Word, PowerPoint, text. Up to 50MB. Multiple files.

2. **Instant parsing feedback:**
"Found: IT budget FY2024. Identified $28M across 47 vendors."
"This file added 12 new data points to [Client]'s intelligence profile."

3. **Confidence score update:**
Animated: "Confidence: 62% → 74% ↑12 points"

4. **Gap identification:**
"You uploaded financial data. These additions would most improve your analysis:"
Prioritized missing data with impact estimate per item.

5. **Sensitivity tagging:**
Auto-suggested level → confirm or override → access permissions set → logged.

**Template gallery:** Every data category has a downloadable template with fill-in guide and "what good looks like" example tab.

**Interview notes handling:**
Upload raw notes → Abarva extracts: themes, sentiment, priorities, contradictions, concerns. Tags to leader, date, phase. Quotes surface automatically in conversation.

**Engagement vs. master data:**
Upload dialog always asks: "Is this engagement-specific or permanent org data?"
Engagement-specific: visible only in this engagement unless Maestro promotes it.

**Sensitive data flag:**
Non-permitted users see: "[LOCKED] This dataset exists. Access requires Maestro approval."
Maestro grants: per engagement, per user, with expiry date.

---

## ITEM 14 — Preconfigured Use Cases by Role

### Best-in-class design

**Every product opens with 5 pre-configured use case cards + free text:**

Example — CIO at Meridian entering Diagnose:
```
MOST RELEVANT FOR YOU — MERIDIAN HEALTH SYSTEM (CIO)

🔴 RCM Denial Rate       🔴 Epic Underutilization   🟡 CDO Vacancy Impact
18.2% vs 11.4% benchmark  58/100 vs 80+ benchmark    8 months vacant
$94M at risk annually     12 of 47 dashboards live    3 vendors waiting

🟡 Blue Ridge Delay      ✏️ Something else...
8 months overdue          Describe your question
2 hospitals on Cerner
```

**Clicking a use case:** Pre-populates context. Abarva begins immediately. 3 option cards follow. No setup required.

**Role-aware sets:**
- CIO: technology (EHR, vendor SLA, cloud, infrastructure, integration)
- CFO: financial (denial rate, IT spend, ROI, budget, vendor cost)
- COO: operational (throughput, staffing, vendor delivery, efficiency)
- CMIO: clinical (quality, EHR utilization, AI initiatives, compliance)
- CEO: board-level (margin, strategic risk, competitive position, AI readiness)

---

## ITEM 15 — Investor Page: Naysayer Tab

### Best-in-class design

**New tab: "The Hard Questions"**

*"Every transformative company faces the same challenge: convincing skeptics before the results are undeniable. Here is how we respond to every objection — directly and with evidence."*

**12 objection cards (accordion):**

1. **"McKinsey / BCG / Deloitte will build this"**
They are a channel, not a competitor. Their partners use Abarva to deliver more engagements at higher margins. We are their leverage — not their replacement.

2. **"ChatGPT already does this"**
ChatGPT knows nothing about Meridian's denial rate, their Ensemble SLA penalties, or their benchmark gaps. Abarva knows all of it before the first conversation. The intelligence is the product.

3. **"Clients won't pay for AI-generated strategy"**
They already pay $4-8M per engagement for a PowerPoint with no outcome accountability. AbarVa charges $500K-750K and tracks outcomes against a documented baseline from day one. The outcome fee activates at Series A. That is a fundamentally better deal.

4. **"Attribution is impossible"**
We set a documented baseline at engagement start. We track every metric continuously. This is the same model outcome-based SI firms have used for 20 years — we are the first to automate it.

5. **"Security — our data can't leave our environment"**
It doesn't have to. We deploy within the client's own AWS, Azure, or GCP. Their data never crosses our boundary. We are the only transformation platform that can make that statement credibly.

6. **"Claude will get too expensive or change their API"**
We are model-agnostic. Our architecture abstracts the AI layer. We can run on GPT-4o or Gemini with a configuration change. Claude is today's best — not a permanent dependency.

7. **"This is just a wrapper on Claude"**
Show them the contradiction detection engine — deterministic logic that surfaces conflicts in their own data that no one has found in years. Show them the failure genome. No wrapper has that.

8. **"The big SIs will build their own version"**
They will try. But they cannot be outcome-accountable — it would cannibalize their time-and-materials business model. We can do it because we build from scratch.

9. **"The market isn't ready"**
$500B is spent annually on enterprise transformation with no outcome measurement and no platform intelligence. The market is not early — it is massive and completely unaccountable. We make it accountable.

10. **"You need a much bigger team to scale"**
The seed funds a CTO, 6 engineers, and 10 Maestros from top consulting firms. Each Maestro supports 3-5 clients. At 30 clients the economics work. At 100 the network effects compound.

11. **"What about HIPAA, SOX, regulatory compliance?"**
HIPAA BAA in place with AWS. SOC2 Type I at seed close. SOC2 Type II within 9 months. HITRUST at Series A. Every regulated client strengthens our posture.

12. **"What when someone better-funded copies this?"**
The moat is the Transformation Genome — institutional knowledge of what works and what fails, built from real engagements, proprietary to Abarva. It compounds with every engagement. A copycat starts with zero. We start with three.

---

## ITEM 16 — Remove Accenture / CADE / Presbyterian References

### What to scrub

Search entire codebase and remove all references to:
- "Accenture"
- "CADE" or "Catalyst Analytics Delivery Engine"
- "Presbyterian" or "Presbyterian Healthcare Services" or "PHS"

Replace origin story if needed: "Built by a team with deep enterprise transformation experience across healthcare and financial services." No firm named.

Files to check:
- CLAUDE.md
- README.md
- All system prompts in /api routes
- All data files in /src/data
- Investor page content
- Any comments in code

---

## ITEM 17 — Founder Profile & Team Build Plan

### Best-in-class design

**Investor page → Team section:**

**Anand Sundaram — Founder & CEO**
*Previously: CTO at Dell | Enterprise transformation leader across healthcare and financial services*

Positioning: Former CTO with operating experience. Watched the consulting model from the inside. Now building the platform that replaces it.

**Seed-funded team build:**

Co-founder / CTO (before seed close):
- Leads product and technology
- Engineering background at high-growth SaaS + AI/ML experience

Engineering (6-10 headcount):
- 2 senior full-stack (Next.js, TypeScript, cloud)
- 1 AI/ML engineer (agent pipelines, RAG, fine-tuning)
- 1 data engineer (Supabase, Pinecone, pipelines)
- 1 UX/design engineer (design system, component quality)
- 1 DevOps/security (multi-cloud, compliance)

Maestro team (10 headcount):
- Hired from: McKinsey, Deloitte, Huron, Navigant
- Backgrounds: healthcare IT, financial services transformation, ERP, RCM
- Each supports 3-5 client engagements simultaneously
- Doubles as sales within client accounts

Product Managers (2-3):
- Drive client engagement workflows
- Double as Maestros on select engagements
- Own product roadmap per vertical

**Hiring philosophy:**
"We hire practitioners, not consultants. Every Maestro has delivered a real transformation — not just advised on one. Every engineer has shipped production AI at scale."

---

## ITEMS 18 & 19 — Reserved

Placeholder for additional items to be defined during Monday session.

---

## BUILD SCHEDULE — This Week

| Day | Focus | Screens |
|---|---|---|
| Monday | Foundation | Maestro Admin rebuild, new client wizard, engagement progress map, scrub CADE/Accenture refs |
| Tuesday | Products | Structured response options (all products), role-aware use case cards, AI Strategy Steps 1-4 |
| Wednesday | Products | AI Strategy Steps 5-8, Select product full rethink (4 paths) |
| Thursday | Data & Governance | Intelligent data upload, sensitivity tagging, engagement cockpit, Maestro Playbook |
| Friday | Investor & Polish | Naysayer tab, revenue model visualization, export suite, full QA sweep |
| Weekend | Final | Mobile QA, design polish, demo dry run |

---

*This document is the build contract for the week.*
*Every screen is QA'd against these specs before it ships.*
*Design quality and UX excellence are non-negotiable at every step.*
