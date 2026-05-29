# Packet 34 — Comprehensive Multi-Tenant Browser Crawl Session

**Author:** AbarVa Founder
**Created:** 2026-05-28
**Status:** Ready for Codex autonomous execution after Packet 30 Phase 7 closes
**Companion to:** Packets 28, 29, 30, 31, 32, 33

---

## 0. Why this packet exists

This is the executable specification for a **comprehensive multi-tenant browser crawl session** that proves AbarVa is not just a demo, but a real decision-execution platform.

The session runs against production (`app.abarva.ai`), authenticates as real personas, exercises every product surface with substantive content, persists actual decisions, generates real artifacts, asks the agent to enhance them, and produces a final HTML report that walks an executive through the entire experience — click by click, question by question, citation by citation.

**Two tenants in sequence:** Apex Retail first (to prove multi-tenant + retail vertical works), then SkyHarbor Air (to validate the airline reference flow).

**Seven Acts per tenant:**

1. Setup page review — "what has been loaded"
2. Intelligence — 3 topics × 10 probing questions each
3. Moves — create + persist + generate artifacts + enhance via Sentinel
4. Business case + mobilization deep dive
5. Source use case A — SI partner selection for $5-10M project
6. Source use case B — AMS/IMS portfolio optimization at $25M+/yr
7. Tower — AI initiatives review with 10+ probing questions, navigation, and decisions

**Final deliverable:** A standalone HTML report per tenant that contains every screenshot, every conversation turn, every citation, every artifact preview, and every quality score — suitable to share with a Delta CTO, PHS CDAO, or Series A investor as "this is what the platform actually does."

---

## 1. Mission

Produce two procurement-defensible, investor-defensible HTML walkthroughs (one per tenant) demonstrating end-to-end decision intelligence with real persistence, real artifact generation, real agent-augmented enhancement, and real cross-module continuity from Intelligence → Moves → Source → Tower.

**Implicit goals:**
- Prove the platform handles complex sourcing events end-to-end (RFI/RFP/normalization/BAFO)
- Prove the platform reasons across two distinct industries without code change
- Prove Sentinel can enhance its own outputs (agent-to-agent enhancement)
- Prove the audit + evidence chain (Packet 33 K10) is real
- Generate artifacts (executive memos, board slides, business cases, sourcing strategies) that withstand CXO scrutiny

---

## 2. Pre-conditions

### 2.1 Platform state required

- ✅ Packets 30 + 31 closed (Phase 7 certificate signed)
- ✅ All four product surfaces (Intelligence, Moves, Source, Tower) functional with `azureRead` consolidated
- ✅ Packet 32 P0 items shipped:
  - C5 CSV upload (will be exercised in artifact generation)
  - C12 thumbs up/down on Sentinel answers (will be exercised in scoring)
  - C9 PHS compliance schema (for audit trail)
- ✅ Packet 33 P0 capabilities:
  - K05 document generation (critical — Acts 3, 4, 5, 6 require it)
  - K10 audit-grade evidence chains (critical — every citation must trace)
  - K23 board-ready output formats (critical — Act 7 requires it)

If K05/K10/K23 are not yet shipped, this packet **cannot fully execute**. Document the gap and execute partial runs against available capability.

### 2.2 Substrate state required

**Apex Retail:**
- Per Packet 32 C1 substrate audit, Apex must score ≥18/25 on Apex-shaped Tier-1 verifier
- Apex segments must cover: retail strategy, e-commerce, store operations, omnichannel, loyalty, supply chain, merchandising, marketing, IT estate, AI initiatives, vendor portfolio, value ledger
- If Apex substrate is partial, refresh per Packet 32 C1 Phase C before running this session

**SkyHarbor Air:**
- Already validated ≥23/25 on airline Tier-1 questions per Packet 30 Phase 7
- No additional substrate work needed

### 2.3 Authentication

| Tenant | Primary persona | Secondary | Tertiary |
|---|---|---|---|
| Apex Retail | `cio@apex-retail.example.com` | `cdo@apex-retail.example.com` | `maestro@apex-retail.example.com` |
| SkyHarbor Air | `cto@skyharbor-air.example.com` | `cio@skyharbor-air.example.com` | `maestro@skyharbor-air.example.com` |

Credentials: per AbarVa demo credential vault (do not hardcode).

### 2.4 Browser environment

- Playwright with Chromium (headless: false for video capture; headless: true for CI batch)
- Viewport: 1920×1080
- Network conditions: production-like (no throttling)
- Geographic origin: US-East (matches Azure region)
- Recording: full video, full HAR, full DOM snapshots at every navigation
- Console capture: all logs, all errors

---

## 3. Two-tenant execution sequence

### 3.1 Sequence rationale

1. **Apex first** — proves multi-tenant + non-airline vertical. If Apex passes, the platform genuinely scales beyond SkyHarbor.
2. **SkyHarbor second** — reference run for Delta CTO. If SkyHarbor passes after Apex, no regressions exist.

If Apex fails materially (score <60% on overall quality), pause before SkyHarbor and remediate substrate or routing gaps.

### 3.2 Output structure

```
audit-artifacts/comprehensive-crawl-<YYYY-MM-DD>/
├── apex-retail/
│   ├── act-01-setup/
│   ├── act-02-intelligence/
│   ├── act-03-moves/
│   ├── act-04-business-case/
│   ├── act-05-source-si-selection/
│   ├── act-06-source-ams-ims-optimization/
│   ├── act-07-tower-review/
│   ├── artifacts/                           # Generated docs (.docx, .pptx, .pdf)
│   ├── transcripts/                          # Full conversation logs
│   ├── screenshots/                          # Every navigation captured
│   ├── network-logs/                         # HAR files
│   ├── video.webm                            # Full session
│   └── APEX_RETAIL_WALKTHROUGH_REPORT.html  # The deliverable
├── skyharbor-air/
│   └── (same structure)
└── COMPREHENSIVE_CRAWL_SUMMARY.html         # Both tenants in one summary
```

---

## 4. The 7-Act flow

Each Act has the same structural template:

```
Act N — Title
├── 4.N.0 — Goal
├── 4.N.1 — Personas active
├── 4.N.2 — Step-by-step playbook (per tenant)
├── 4.N.3 — Specific questions / actions
├── 4.N.4 — Expected agent behavior
├── 4.N.5 — Artifacts to collect
├── 4.N.6 — Scoring criteria
├── 4.N.7 — Estimated duration
```

---

## 5. Act 1 — Setup Page Review

### 5.1 Goal

The CXO (or Maestro) signs in for the first time and reviews **"what has been loaded and is available"** in their tenant. This sets the context for everything that follows.

### 5.2 Persona

Primary: `cio@apex-retail.example.com` (Apex) / `cto@skyharbor-air.example.com` (SkyHarbor)

### 5.3 Step-by-step playbook

1. Navigate to `https://app.abarva.ai/sign-in`
2. Authenticate as primary persona (Clerk ticket flow, OTP)
3. Land on home dashboard
4. Take screenshot of home
5. Navigate to `/setup` (or `/admin/context-layer` if `/setup` redirects)
6. Capture the full setup page DOM
7. Review and capture:
   - Tenant identity (name, key, tier)
   - Loaded data segments (count per segment)
   - Pattern overlays active (which industry pack)
   - Module enablement (Intelligence, Moves, Source, Tower)
   - User roster (count, roles)
   - Recent ingestion activity (last load timestamps)
   - Audit log preview (recent egress count)
8. Click into each segment summary card; capture details
9. Take screenshots throughout

### 5.4 Questions to ask Sentinel (within Setup or via floating Ask widget if present)

1. "What data do we have loaded for this tenant?"
2. "What industry-specific knowledge is active?"
3. "When was the substrate last refreshed?"
4. "What are the top 3 things missing from our current ingestion?"
5. "What questions am I most likely to ask in the next 30 days?"

### 5.5 Expected behavior

- Substrate inventory matches actual loaded data (verifiable against `MULTI_TENANT_STATE_AUDIT.md`)
- Pattern overlay correctly identified (retail-overlay for Apex; airline-overlay for SkyHarbor)
- Audit log shows recent activity
- Setup questions get specific, tenant-grounded answers (not generic)

### 5.6 Artifacts

- `act-01-setup/screenshots/01-home.png` through `09-setup-detail-N.png`
- `act-01-setup/setup-inventory.json` — structured capture of what's loaded
- `act-01-setup/transcript-01-setup-questions.json` — Q&A transcript with citations

### 5.7 Scoring

| Dimension | Pass criteria |
|---|---|
| Inventory accuracy | All loaded segments shown; counts match DB |
| Industry context | Correct overlay identified |
| Audit visibility | Recent activity visible |
| Question grounding | All 5 setup questions answered with tenant-specific evidence |

### 5.8 Duration

~5-7 minutes per tenant.

---

## 6. Act 2 — Intelligence Deep Dive (3 Topics × 10 Questions)

### 6.1 Goal

Demonstrate that Sentinel reasons substantively across three distinct strategic topics with depth that withstands CXO probing. Each topic gets 10 progressively deeper questions.

### 6.2 Persona

Primary persona continues.

### 6.3 Apex Retail — Three topics

#### Topic A — Customer Data Platform & Personalization (10 questions)

1. "What's the current state of our customer data fragmentation across channels?"
2. "Which customer segments are we under-investing in based on revenue contribution?"
3. "Where is our personalization stack falling behind the competitive set?"
4. "What would a unified customer data platform actually do for us in dollar terms?"
5. "Which of our existing AI/personalization initiatives are redundant or sub-scale?"
6. "What's the build vs buy decision for a CDP — Segment vs Adobe vs Salesforce vs in-house?"
7. "What's the realistic 18-month timeline to consolidate customer data infrastructure?"
8. "Where will internal resistance to a CDP project come from, and how do we counter it?"
9. "What's the right phased rollout — by brand, by region, by use case, by channel?"
10. "If I had $8M to spend on customer data over the next 18 months, where exactly should it go?"

#### Topic B — Omnichannel Order Management & Inventory (10 questions)

1. "Where are our most painful order management gaps between store and online?"
2. "Which omnichannel use cases (BOPIS, ship-from-store, endless aisle) have proven ROI for retailers our size?"
3. "What's our current state on inventory visibility — real-time vs batch — across channels?"
4. "Where is store associate productivity being lost due to system fragmentation?"
5. "Which OMS vendors should we evaluate — Manhattan, Oracle, IBM Sterling, Salesforce, custom?"
6. "What's the realistic integration burden between OMS and our existing ERP/POS/eComm stack?"
7. "Which competitors have executed this well, and what did they spend?"
8. "What are the change management failure modes during an OMS implementation?"
9. "What's the risk profile of a 'big bang' vs 'wave' deployment for OMS?"
10. "Make the business case: $10M OMS modernization vs status quo over 5 years."

#### Topic C — Supply Chain Resilience & Predictive Operations (10 questions)

1. "What are our biggest supply chain visibility gaps right now?"
2. "Which of our suppliers create the most cascading risk?"
3. "Where is AI/ML in our supply chain — and where should it be?"
4. "What's our current state on demand forecasting accuracy by category?"
5. "Which supply chain technology investments have peer retailers seen positive ROI on?"
6. "What's the build vs buy decision for demand forecasting and replenishment?"
7. "Where are our trade-off decisions between cost and resilience misaligned with risk appetite?"
8. "Which initiatives in flight are most exposed to supply chain disruption assumptions?"
9. "What's the right governance model for cross-functional supply chain decisions?"
10. "If we had to pick one supply chain bet for the next 12 months, what should it be and why?"

### 6.4 SkyHarbor Air — Three topics

#### Topic A — Mainframe Modernization (10 questions)

1. "After 5 years, what's our defensible progress narrative?"
2. "Which 5 mainframe workloads should we extract next, ranked by value-to-risk?"
3. "Which workloads should we explicitly NOT touch in the next 18 months?"
4. "Where has extraction created duplicate complexity we haven't unwound?"
5. "Which extractions reversed, and what did we learn that we haven't applied?"
6. "What's the AWS Mainframe Modernization Service path vs continued strangler-fig?"
7. "Where is IBM still essential, and where are we over-dependent?"
8. "What does the FY-2027 IBM restructure window look like in concrete terms?"
9. "What's the modernization wave plan for the next 18 months?"
10. "If I had to defend our modernization to the board next quarter in three slides, what are they?"

#### Topic B — AI-Powered SDLC & Engineering Productivity (10 questions)

1. "Where can AI-powered SDLC compress delivery in the next 90 days without operational risk?"
2. "Which AI tooling candidates are highest-leverage for our COBOL-heavy estate — Amazon Q Developer, watsonx Code Assistant, GitHub Copilot Enterprise?"
3. "What's the risk profile of AI-generated code in our safety-critical domains?"
4. "How are we performing on DORA metrics by domain, and where's the modernization correlation?"
5. "Where should the AI tooling stack consolidate?"
6. "What's our productivity baseline today, and where do we credibly see it in 18 months?"
7. "Which engineering teams should be first adopters, and which last?"
8. "What's the governance model for AI-generated code reaching production?"
9. "What's the customer impact (mishandled bags, OTP) if we go too fast?"
10. "Make the business case: AI SDLC investment of $5M vs continuing current trajectory."

#### Topic C — GCC Scale-Up & Operating Model (10 questions)

1. "Why are we at 1,000 GCC employees when peer carriers are at 3-5K?"
2. "Where are our current GCC capabilities — and where are the gaps?"
3. "What functions should we keep onshore vs move offshore?"
4. "Which peer carrier GCC programs should we benchmark against?"
5. "What's the right pace — double in 12 months, or 24 months?"
6. "What are the real estate and talent supply constraints we're facing?"
7. "What's the leadership architecture in Bangalore vs Hyderabad?"
8. "Which executive sponsor on our side is critical to GCC scale-up success?"
9. "What's the risk if we don't scale GCC — competitive, cost, capability?"
10. "Make the business case: GCC scale-up to 3K over 24 months — investment, risk, payoff."

### 6.5 Expected behavior across all questions

For each question:
- Sentinel responds with grounded answer (≤30s first token)
- Citation panel shows 3+ sources from tenant substrate
- At least 1 pattern-overlay reference in the reasoning
- Answer references specific records, not generic patterns
- Follow-up questions build on prior context (memory works within Topic)
- Cross-topic memory resets between Topic A and Topic B

### 6.6 Artifacts

- `act-02-intelligence/topic-A/Q01.json` through `Q10.json` — full Q&A capture
- `act-02-intelligence/topic-B/Q01-Q10.json`
- `act-02-intelligence/topic-C/Q01-Q10.json`
- Screenshots for first 3 questions in each topic (representative samples)
- Citation chain trace for each answer
- Coverage report per topic — which segments retrieved, which patterns invoked
- Quality scores per question (1-5)

### 6.7 Scoring

- ≥27/30 questions score ≥4
- ≥20/30 questions score 5
- Zero refusals on partial-evidence cases
- Zero wrong-tenant leakage
- Cross-question continuity demonstrated (Q5 references Q1-Q4 within topic)

### 6.8 Duration

~30-45 minutes per tenant (3 topics × 10 minutes each).

---

## 7. Act 3 — Move Creation + Artifact Generation + Enhancement

### 7.1 Goal

Pick a move topic from Intelligence. Create a real Move (persisted). Generate the executive artifact set. Ask Sentinel to enhance the artifact. Persist enhancement.

### 7.2 Persona

Primary persona continues. Switch to `maestro@<tenant>.example.com` for the artifact generation phase to test cross-persona handoff.

### 7.3 Apex Retail — Move topic

**Topic chosen:** "Unified Customer Data Platform Implementation"

**Justification source:** Topic A Q10 from Act 2 ("If I had $8M to spend on customer data over the next 18 months, where exactly should it go?")

### 7.4 SkyHarbor Air — Move topic

**Topic chosen:** "AI-Assisted Mainframe Dependency Mining & Test-Generation Factory for Next-Wave AWS Extraction"

**Justification source:** Topic A Q10 from Act 2

### 7.5 Step-by-step playbook

1. From the Intelligence Q10 answer, click "Shape Move" (or equivalent)
2. Move creation form opens, pre-populated with answer context
3. **Verify and edit:**
   - Thesis (auto-drafted by Sentinel; edit if needed)
   - Scope (in scope / out of scope)
   - Sponsor (assign to CIO)
   - Value model (3 value states: pessimistic, expected, stretch)
   - Risks (top 5)
   - Dependencies (vendor, internal, regulatory)
   - Kill criteria (when to stop investing)
   - Timeline (12-18 months)
4. **Persist Move** — click Save. Verify it appears in `/moves` list.
5. Capture Move ID + URL
6. Open Move detail page; capture all sections
7. Click "Generate Artifacts" (K05 capability):
   - Executive memo (.docx)
   - Board slide (5-slide deck .pptx)
   - One-page brief (.pdf)
   - ROI scorecard (.xlsx if applicable)
8. Wait for generation; capture all artifacts
9. **Enhancement loop:**
   - Open Move chat
   - Ask: "Make the value section more quantified — specifically include NPV, IRR, and payback period"
   - Capture Sentinel's response and updated artifact
   - Ask: "Add a section on executive talking points for the board presentation"
   - Capture
   - Ask: "What are the three most likely reasons this Move fails in the next 6 months? Add them as preempt mitigations."
   - Capture
   - Re-generate artifacts with enhancements
10. Click "Compare versions" — capture diff between original and enhanced artifacts

### 7.6 Expected behavior

- Move creation form auto-populates from Intelligence context (continuity)
- Move persists to DB (verifiable via direct query)
- Artifact generation succeeds within 60s per artifact
- Generated artifacts contain tenant-specific facts, not generic placeholders
- Enhancement requests produce visible improvements
- Version history captured

### 7.7 Artifacts

- `act-03-moves/move-id.txt` — the persisted Move ID
- `act-03-moves/move-detail.json` — full Move record
- `act-03-moves/artifacts/v1/executive-memo.docx`
- `act-03-moves/artifacts/v1/board-deck.pptx`
- `act-03-moves/artifacts/v1/one-pager.pdf`
- `act-03-moves/artifacts/v1/roi-scorecard.xlsx`
- `act-03-moves/artifacts/v2/` (enhanced versions)
- `act-03-moves/version-diff.html`
- `act-03-moves/enhancement-transcript.json`

### 7.8 Scoring

- Move created and persisted (boolean)
- Artifacts generated within latency budget (boolean)
- Artifacts contain ≥10 tenant-specific facts per page
- Enhancement loop produces measurably improved outputs
- Version diff is meaningful, not cosmetic

### 7.9 Duration

~25 minutes per tenant.

---

## 8. Act 4 — Business Case & Mobilization Deep Dive

### 8.1 Goal

Within the Move, build a comprehensive business case AND mobilization plan. Investment range: $5-10M over 12 months. Mobilization covers: process transformation, org change, adoption playbook.

### 8.2 Persona

Primary persona returns. Maestro consults.

### 8.3 Business case section — questions to Sentinel

1. "Build the full business case for this Move over 12 months at a $7M investment level."
2. "What's the NPV at a 10% discount rate?"
3. "What's the IRR?"
4. "What's the realistic payback period?"
5. "What are the assumptions most likely to break the financial case?"
6. "If we had to defend this case to a skeptical CFO, what 3 sensitivities would she test?"
7. "What's the value-at-risk if the project slips 6 months?"
8. "What's the upside if we accelerate and deliver in 9 months?"
9. "Which line items in the cost stack are most over- and under-budgeted?"
10. "What would change the business case if we did this BYOC (customer-managed) vs vendor-managed?"

### 8.4 Mobilization section — questions to Sentinel

1. "What's the process transformation required for this Move to actually deliver value?"
2. "Which processes need to be redesigned end-to-end vs incrementally updated?"
3. "What's the org change required — new roles, retired roles, restructured teams?"
4. "Where is the resistance to change most likely to come from?"
5. "What's the adoption playbook for the first 90 days post-launch?"
6. "Who are the executive sponsors required, and what's the cadence with them?"
7. "What's the communication plan for employees during transition?"
8. "What KPIs do we set, and how do we measure quarterly?"
9. "What's the risk register specifically for change management — top 5?"
10. "If I had to brief the board on mobilization risk and mitigation in 5 minutes, what's the script?"

### 8.5 Artifact generation

After both Q&A sessions complete:

1. Generate `Business_Case_v1.docx` — full business case document (~15-20 pages)
2. Generate `Mobilization_Plan_v1.docx` — change management playbook (~10-15 pages)
3. Generate `Board_Slide_BusinessCase.pptx` — 5-slide board deck
4. Generate `Financial_Model.xlsx` — NPV/IRR/sensitivity model
5. Generate `Risk_Register.xlsx` — top 20 risks with mitigations

### 8.6 Enhancement loop

After generation:

- "Add a competitive landscape section to the business case"
- "Add a vendor risk section comparing if we go single-vendor vs multi-vendor"
- "Add a regulatory risk section specific to our industry"
- "Add an executive Q&A appendix anticipating the 10 hardest board questions"

Each enhancement updates artifacts. Capture versions.

### 8.7 Expected behavior

- Sentinel reasons across Intelligence answers, Move scope, value model
- NPV/IRR calculations are arithmetically defensible (verify spot-check)
- Mobilization advice is specific (named roles, named processes)
- Artifacts grow from v1 to v4 with meaningful enhancements

### 8.8 Artifacts

- `act-04-business-case/Business_Case_v1.docx` through `_v4.docx`
- `act-04-business-case/Mobilization_Plan_v1.docx` through `_v4.docx`
- `act-04-business-case/Financial_Model.xlsx`
- `act-04-business-case/Risk_Register.xlsx`
- `act-04-business-case/Board_Slide_BusinessCase.pptx`
- `act-04-business-case/business-case-questions.json` (Q&A capture)
- `act-04-business-case/mobilization-questions.json` (Q&A capture)
- `act-04-business-case/enhancement-versions-diff.html`

### 8.9 Scoring

- Business case includes NPV, IRR, payback, sensitivity (boolean)
- Mobilization plan covers process + org + adoption + risk (boolean)
- Final artifact ≥80% of Big 4 quality on board-readiness rubric (subjective)
- Enhancements measurably improve content

### 8.10 Duration

~20-25 minutes per tenant.

---

## 9. Act 5 — Source Use Case A: SI Partner Selection for $5-10M Project

### 9.1 Goal

The same Move (from Act 3) requires an external SI to augment and execute globally in an onshore/offshore model. Use the Source module to run the SI selection sourcing event end-to-end.

### 9.2 Persona

Primary persona drives the Source event. Maestro assists with logistics.

### 9.3 Step-by-step playbook

1. Navigate to `/source`
2. Click "New Sourcing Event"
3. **Configure event:**
   - Linked Move: select Move from Act 3
   - Event type: Strategic SI selection
   - Budget: $5-10M (12 months)
   - Geographic model: global, onshore + offshore (US + India)
   - Engagement model: T&M with milestone-based outcomes
   - Required capabilities: industry vertical depth, AI/data engineering, change management, project management
4. Persist event; capture event ID + URL
5. **Vendor longlist** — let Sentinel draft initial list, then add specific vendors:
   - Deloitte
   - Accenture
   - TCS
   - Wipro
   - One onshore boutique (e.g., Slalom, Credera, Brillio, West Monroe)
6. Capture Sentinel's vendor profile for each:
   - Service catalog match
   - Relevant case studies
   - Onshore/offshore mix
   - Typical pricing structure
   - Strengths and weaknesses for this Move

### 9.4 RFP generation

7. Click "Generate RFP" (K05 capability)
8. Capture the RFP doc; verify it contains:
   - Executive summary of the Move
   - Detailed scope of work
   - Required capabilities
   - Pricing structure expectation (T&M, fixed-fee components, outcome bonuses)
   - Onshore/offshore mix expectations
   - Forward-deployed engineer expectations (this is the new expectation in modern engagements)
   - Reporting / governance cadence
   - SLA expectations
   - Knowledge transfer obligations
   - Exit and transition rights
   - Q&A timeline
   - Bid timeline (BAFO and award)
9. Sentinel produces RFP `.docx`; capture

### 9.5 Bid collection (simulated)

10. For each vendor, simulate bid submission:
    - "Simulate Deloitte's response: assume premium pricing, strong vertical depth, full onshore team for first 90 days"
    - "Simulate Accenture's response: assume aggressive pricing, blended 50/50 onshore/offshore, accelerator-driven approach"
    - "Simulate TCS's response: assume lowest pricing, 70/30 offshore-heavy, factory model"
    - "Simulate Wipro's response: assume mid-tier pricing, 60/40 offshore-heavy, with AI tooling claims"
    - "Simulate boutique response: assume premium hourly rates but lean team, 90/10 onshore, deep domain expertise"

11. Each simulation produces structured bid summary; capture as `vendor-bids.json`

### 9.6 Price normalization

12. Ask Sentinel: "Normalize the five bids on apples-to-apples comparison."
13. Expected output: a normalized comparison table that controls for:
    - Onshore vs offshore blended rates
    - In-scope vs out-of-scope work
    - Outcome bonus structure
    - Forward-deployed engineer count and tenure
    - Travel and expenses
    - Tools and accelerators (in or out of base fee)
    - SLA penalties
    - Knowledge transfer credits
14. Capture normalization table as `.xlsx`

### 9.7 Forward-deployed engineer expectations

15. Ask Sentinel: "What's the modern expectation for forward-deployed engineers in this engagement? How should we structure that ask?"
16. Expected output: definition of FDE role, count per vendor tier, tenure expectations, on-site vs remote, how to evaluate during BAFO

### 9.8 BAFO (Best and Final Offer) negotiation

17. Click "Start BAFO round"
18. For each shortlisted vendor (top 3 by normalization), simulate BAFO ask:
    - Reduce blended rate by 8-12%
    - Add 1-2 more forward-deployed engineers
    - Strengthen exit rights
    - Add specific outcome-based milestones with bonuses/penalties
19. Capture vendor responses (simulated)
20. Ask Sentinel: "Final recommendation: which vendor, with what justification?"
21. Capture recommendation

### 9.9 Artifact generation

22. Generate `SI_Sourcing_Recommendation.docx` — final recommendation memo
23. Generate `SI_Sourcing_BoardDeck.pptx` — board-presentable 5 slides
24. Generate `SI_Negotiation_Memo.docx` — post-BAFO summary
25. Generate `Vendor_Scorecard.xlsx` — multi-criteria scoring

### 9.10 Expected behavior

- Sourcing event persists
- RFP doc is procurement-grade (would withstand legal review)
- Normalization correctly compares structurally different bids
- FDE asks reflect modern (2026) engagement expectations
- BAFO simulation produces realistic vendor pushback
- Final recommendation balances cost, quality, fit, risk

### 9.11 Artifacts

- `act-05-source-si-selection/event-id.txt`
- `act-05-source-si-selection/event-config.json`
- `act-05-source-si-selection/vendor-profiles.json`
- `act-05-source-si-selection/RFP_v1.docx`
- `act-05-source-si-selection/RFP_questions-tracker.xlsx`
- `act-05-source-si-selection/vendor-bids.json`
- `act-05-source-si-selection/normalization-table.xlsx`
- `act-05-source-si-selection/bafo-responses.json`
- `act-05-source-si-selection/SI_Sourcing_Recommendation.docx`
- `act-05-source-si-selection/SI_Sourcing_BoardDeck.pptx`
- `act-05-source-si-selection/SI_Negotiation_Memo.docx`
- `act-05-source-si-selection/Vendor_Scorecard.xlsx`
- `act-05-source-si-selection/transcript.json`

### 9.12 Scoring

- Event persisted (boolean)
- RFP doc covers all 10 standard sections (boolean)
- Vendor profiles are tenant-aware (not generic)
- Normalization is mathematically sound
- FDE definitions are 2026-current
- BAFO simulation captures meaningful negotiating dynamics
- Final recommendation withstands CFO scrutiny

### 9.13 Duration

~30-35 minutes per tenant.

---

## 10. Act 6 — Source Use Case B: AMS/IMS Portfolio Optimization at $25M+/yr

### 10.1 Goal

Different scenario: VP of IT Sourcing optimizing the entire enterprise IT AMS (Application Managed Services) / IMS (Infrastructure Managed Services) portfolio. Annual spend >$25M. Cross-vendor consolidation event.

### 10.2 Persona

For this Act, the persona shifts to a hypothetical VP of IT Sourcing. Use the primary persona but explicitly state in prompts: "I'm playing the role of the VP of IT Sourcing reviewing enterprise AMS/IMS."

### 10.3 Step-by-step playbook

1. Navigate to `/source`
2. Click "New Sourcing Event"
3. **Configure event:**
   - Event type: AMS/IMS portfolio optimization
   - Annual spend in scope: $25M+
   - Number of incumbent vendors: 4-6
   - Engagement model: outcome-based, multi-year (3+5 with options)
   - Geographic coverage: enterprise-wide
   - Restructure goal: 15-25% cost reduction + improved quality + AI tooling adoption
4. Persist event

### 10.4 Portfolio analysis

5. Ask Sentinel: "Analyze our current AMS/IMS portfolio. What are we spending where, with what vendors, and what's the value realization?"
6. Expected output: Portfolio breakdown — by vendor, by domain, by service tier
7. Generate `Current_State_Analysis.xlsx`

### 10.5 Strategic options exploration

8. Ask Sentinel: "What strategic options should we evaluate — consolidate to one vendor, multi-vendor tower, captive build, hybrid?"
9. Capture options analysis
10. Ask: "Which industries / peer enterprises have executed each option, and what were the outcomes?"
11. Capture peer benchmarking

### 10.6 Incumbent vendor analysis

12. Ask Sentinel: "For each incumbent vendor, what's their performance over the past 24 months?"
13. Capture per-vendor scorecards covering:
    - SLA performance
    - Productivity claims vs realized
    - Innovation contribution
    - Knowledge concentration risk
    - Pricing competitiveness
    - Cultural fit
14. Generate `Incumbent_Vendor_Scorecards.xlsx`

### 10.7 New vendor evaluation

15. Add candidate replacement / additional vendors:
    - Major SIs: Deloitte, Accenture, IBM Consulting, HCLTech, Capgemini
    - Indian tier: TCS, Infosys, Wipro
    - Specialty: HCLTech for IMS specifically; Mphasis; Genpact
16. Ask Sentinel: "For each candidate, what's their AMS/IMS service catalog, pricing model, and competitive position?"
17. Capture profiles

### 10.8 RFP generation (enterprise-scale)

18. Click "Generate RFP" — note this is significantly larger scope than Act 5
19. Expected RFP sections (in addition to standard):
    - Multi-tower service catalog (apps, infra, database, network, security, end-user computing)
    - Detailed SLAs per tower
    - Transition plan template (90 days for AMS; 180 days for IMS)
    - Productivity expectations (year-over-year improvement curve)
    - AI tooling adoption commitments
    - Knowledge transfer obligations (deeper than Act 5)
    - Innovation budget (separate from run cost)
    - Exit and transition rights (more complex than Act 5)
    - Performance-based pricing components
    - Benchmark adjustment clauses
    - Governance structure (steering committee, ops committee, escalation paths)
    - Force-majeure and material adverse change clauses
20. Capture RFP `.docx` (40-60 pages expected)

### 10.9 Pricing normalization (multi-tower complexity)

21. Simulate bids from 5 vendors with realistic multi-tower structures
22. Ask Sentinel: "Normalize across all vendors and towers. Account for: blended hourly rates by tier, fixed-fee components, productivity improvement curves, AI tooling adoption credits, transition costs, knowledge transfer credits, innovation budgets."
23. Capture normalization model (`Normalized_Pricing_Multi_Tower.xlsx`)

### 10.10 Modern engagement expectations

24. Ask Sentinel: "What's the modern (2026) expectation for outcome-based AMS/IMS engagements? How is this different from the traditional T&M model?"
25. Expected output covers:
    - Productivity guarantees with year-over-year curve
    - AI-driven automation commitments
    - Forward-deployed engineers (for transition + steady-state innovation)
    - Continuous improvement budget (separate from run)
    - Innovation lab arrangements
    - Open-book pricing components
    - Benchmark-adjusted pricing
    - Customer-facing application of AI savings

26. Capture modern expectations doc

### 10.11 BAFO + negotiation strategy

27. Run BAFO for top 3 vendors
28. For each, capture negotiation strategy:
    - Specific asks (5-7 per vendor)
    - Tradeoffs willing to give
    - Walk-away conditions
    - Win-win framings
29. Generate `BAFO_Negotiation_Strategy.docx` per vendor

### 10.12 Final recommendation + restructure roadmap

30. Ask Sentinel: "Final recommendation: which combination of vendors, in which towers, with what restructure roadmap over 12 months?"
31. Capture recommendation
32. Generate:
    - `AMS_IMS_Restructure_Recommendation.docx` (~25 pages)
    - `AMS_IMS_BoardDeck.pptx` (10-slide board deck)
    - `Restructure_Roadmap.xlsx` (Gantt-like timeline)
    - `Value_Realization_Model.xlsx` (3-year savings + value model)

### 10.13 Expected behavior

- All steps build on each other (continuity)
- RFP doc is enterprise-grade
- Normalization handles multi-tower complexity correctly
- Negotiation strategies are specific, not generic
- Recommendation balances cost, quality, risk, innovation capacity

### 10.14 Artifacts

- All structured per `act-06-source-ams-ims-optimization/`
- ~15 generated documents
- Full conversation transcript
- Vendor scorecards, normalization model, recommendation

### 10.15 Scoring

- Event persists with multi-tower complexity captured
- Current-state analysis is data-driven, not generic
- Peer benchmarking cites named peer enterprises
- Normalization handles ≥5 vendor structural differences
- Modern expectations document reflects 2026 industry standards
- Final recommendation has defensible justification
- All artifacts withstand procurement legal review

### 10.16 Duration

~45 minutes per tenant.

---

## 11. Act 7 — Tower Review: AI Initiatives Portfolio

### 11.1 Goal

The CXO reviews the AI control tower wired to existing AI initiatives. Asks 10+ probing questions. Navigates to specific initiatives. Makes decisions (kill / accelerate / restructure / pause).

### 11.2 Persona

Primary persona (CIO / CTO).

### 11.3 Step-by-step playbook

1. Navigate to `/tower`
2. Land on AI initiatives portfolio view
3. Capture screenshot of portfolio dashboard
4. Review the high-level view: total initiatives, total budget, status distribution (green/yellow/red), value realized vs promised
5. Capture portfolio summary as JSON

### 11.4 10+ Probing questions

1. "What's the total AI investment across our enterprise right now, and what's the trajectory?"
2. "Which AI initiatives are delivering measurable value, and which are stuck?"
3. "Where is investment concentrated, and where are we under-investing?"
4. "Which initiatives have overlapping scope and should be consolidated?"
5. "Which initiatives have dependencies that haven't been declared?"
6. "What's the executive sponsorship concentration risk?"
7. "Which initiatives are at risk of being de-prioritized due to budget pressure?"
8. "What's our pipeline of pending initiatives, and which should be promoted?"
9. "Which vendors are we most exposed to in our AI portfolio?"
10. "If I had to kill 3 initiatives this quarter to free $X, which 3 and why?"
11. "If I had to accelerate 1 initiative, which one and how?"
12. "What's the executive memo I need to write for the board next quarter on AI portfolio?"

### 11.5 Navigation + click-through

13. Click into the top 3 initiatives by budget
14. For each: capture full detail page, value tracker, risk register, milestone status
15. Click into top 3 initiatives by risk (red status)
16. For each: capture root cause, recovery plan, decision options
17. Click into 1 initiative the CXO wants to consider killing
18. Generate "Kill decision memo" (K05 capability)
19. Click into 1 initiative the CXO wants to accelerate
20. Generate "Acceleration plan" with required incremental investment + risks

### 11.6 Decisions made (persisted)

21. For one initiative: mark as "Kill" with reason captured
22. For one initiative: mark as "Accelerate" with incremental budget
23. For one initiative: mark as "Restructure" with new scope
24. Verify decisions persist in DB

### 11.7 Final synthesis

25. Ask Sentinel: "Summarize the decisions made today, the rationale, and the cumulative impact on AI portfolio. Generate a board memo."
26. Generate `AI_Portfolio_Quarterly_Review.docx`
27. Generate `AI_Portfolio_BoardDeck.pptx` (5 slides)
28. Generate `Decisions_Made_Log.xlsx`

### 11.8 Expected behavior

- Tower shows real AI initiatives from substrate (not generic)
- Per-initiative detail pages are populated
- Click-throughs work without 404s
- Decision persistence works (CRUD on initiatives)
- Generated artifacts reflect actual decisions made

### 11.9 Artifacts

- `act-07-tower-review/portfolio-dashboard.png` + JSON
- `act-07-tower-review/initiative-detail-N/` × 6 captures
- `act-07-tower-review/Kill_Decision_Memo.docx`
- `act-07-tower-review/Acceleration_Plan.docx`
- `act-07-tower-review/Decisions_Made_Log.xlsx`
- `act-07-tower-review/AI_Portfolio_Quarterly_Review.docx`
- `act-07-tower-review/AI_Portfolio_BoardDeck.pptx`
- `act-07-tower-review/transcript.json`

### 11.10 Scoring

- Tower has real data (not placeholder)
- All click-throughs succeed
- Decisions persist
- Generated artifacts reflect actual decisions
- ≥10 of 12 questions score ≥4

### 11.11 Duration

~25 minutes per tenant.

---

## 12. The Final HTML Report Specification

### 12.1 Per-tenant report structure

File: `APEX_RETAIL_WALKTHROUGH_REPORT.html` (and `SKYHARBOR_AIR_WALKTHROUGH_REPORT.html`)

```
COVER PAGE
├── Tenant name + identity
├── Persona(s) authenticated
├── Date + duration
├── Modules exercised
├── Overall quality score
└── Executive summary (auto-generated by Sentinel at end of run)

TABLE OF CONTENTS
├── Act 1 — Setup
├── Act 2 — Intelligence (3 topics × 10 questions)
├── Act 3 — Moves
├── Act 4 — Business Case + Mobilization
├── Act 5 — SI Sourcing
├── Act 6 — AMS/IMS Sourcing
├── Act 7 — Tower
├── Artifacts gallery
├── Full transcript
└── Quality scoring summary

ACT N SECTION (repeated per Act)
├── Goal stated
├── Screenshots embedded (with captions)
├── Each Q&A turn:
│   ├── Question typed (verbatim)
│   ├── Time to first token (ms)
│   ├── Time to complete answer (ms)
│   ├── Answer text (verbatim, with citations highlighted)
│   ├── Sources panel (with click-through to source records)
│   ├── Pattern overlay refs invoked
│   ├── Quality score (1-5) with rationale
│   └── Screenshot at end of turn
├── Artifacts generated (with thumbnail preview + download link)
└── Act-level scoring

ARTIFACTS GALLERY
├── All generated documents
├── Thumbnail previews
├── Click-through to full doc
└── Version comparison view

FULL TRANSCRIPT
├── Every word of every conversation
├── Searchable
└── Timestamped

QUALITY SCORING SUMMARY
├── Per-Act score
├── Per-question score distribution
├── Cross-tenant comparison
├── Where Sentinel excelled
├── Where Sentinel needed improvement
└── Overall verdict (Pass / Needs Review / Fail)

EXECUTIVE SUMMARY
├── Auto-generated by Sentinel
├── 1-page summary
├── What was demonstrated
├── What could be improved
└── Recommended next steps
```

### 12.2 Visual design

- Header: AbarVa branding (per design system)
- Layout: vertical scroll with sticky TOC
- Screenshots: high-resolution (≥1920px wide)
- Citation chains: collapsible, with full chain visible
- Artifacts: embedded preview (.docx, .pdf via PDF.js; .pptx via thumbnail)
- Color palette: per `design_system.md` lock

### 12.3 Cross-tenant summary report

File: `COMPREHENSIVE_CRAWL_SUMMARY.html`

```
COVER PAGE
├── Both tenants compared
├── Total session duration
├── Total artifacts generated
└── Cross-tenant verdict

SIDE-BY-SIDE
├── Act 1: Apex setup vs SkyHarbor setup
├── Act 2: Intelligence comparison
├── (continues per Act)

QUALITY COMPARISON
├── Score deltas
├── Cross-tenant isolation verification
└── Where each tenant shined

PROCUREMENT EVIDENCE
├── Citation provenance (Packet 33 K10)
├── Audit trail
├── Compliance posture
└── Why this is procurement-defensible
```

---

## 13. Scoring Framework (overall)

### 13.1 Per-question scoring (1-5)

| Score | Criteria |
|---|---|
| 5 | Fully grounded; ≥3 citations from tenant substrate; pattern overlay invoked; decision-useful; no admissions of unavailability |
| 4 | Grounded; ≥2 citations; some pattern overlay; mostly decision-useful |
| 3 | Partially grounded; ≥1 citation; some admissions of partial evidence (acceptable per Packet 30 §5) |
| 2 | Grounded but missing key segments; multiple unavailability admissions |
| 1 | Ungrounded or pure pattern-only answer |
| 0 | Wrong-tenant leak OR system error (automatic fail-product) |

### 13.2 Per-Act scoring

| Score | Criteria |
|---|---|
| 5 | All questions ≥4 average; all artifacts generated and high-quality; all expected behaviors observed |
| 4 | ≥75% questions ≥4; all artifacts generated; minor quality issues |
| 3 | ≥60% questions ≥4; most artifacts; visible gaps |
| 2 | ≥40% questions ≥4; partial artifact generation |
| 1 | <40% questions ≥4; multiple artifact failures |
| 0 | Major failures or tenant bleed |

### 13.3 Overall verdict

- **PASS** — All 7 Acts ≥4; cross-tenant isolation verified; ≥80% artifacts high-quality
- **NEEDS REVIEW** — 1-2 Acts at 3; document gaps and plan remediation
- **FAIL** — Any Act at <3 OR tenant bleed observed

---

## 14. Playwright Execution Prompt

The Codex prompt that orchestrates this:

```
You are authorized to execute the complete Packet 34 comprehensive browser
crawl session against production (https://app.abarva.ai).

EXECUTION ORDER:
  A. Apex Retail (run first)
  B. SkyHarbor Air (run second)

EACH TENANT EXECUTES 7 ACTS sequentially per Packet 34 §5-11.

AUTHORITY:
  ✅ Authenticate as designated personas via Clerk ticket flow
  ✅ Create and persist Moves and Source events (real DB writes)
  ✅ Generate artifacts via K05 capability
  ✅ Make and persist Tower decisions
  ✅ Capture all screenshots, transcripts, network logs
  ✅ Generate final HTML reports per §12

NOT AUTHORIZED:
  ❌ Modify production data outside the scope of this session
  ❌ Make decisions on real customer accounts
  ❌ Take down any tenant
  ❌ Skip Acts even if one fails

EXECUTION DISCIPLINE:
  - One Act at a time
  - Full artifact capture per Act before proceeding
  - If Act fails: capture failure evidence, attempt single retry, then proceed to next Act with failure marked
  - Cross-tenant cleanup: explicitly clear sessions between Apex and SkyHarbor runs
  - Final HTML report generated after each tenant
  - Cross-tenant summary report generated last

OUTPUT:
  - audit-artifacts/comprehensive-crawl-<YYYY-MM-DD>/ directory
  - Per-tenant subdirectory per §3.2
  - Final HTML reports per §12

ESCALATION:
  - If substrate quality is insufficient for a tenant, document and continue
  - If platform error blocks an Act, capture and continue
  - If tenant bleed observed: STOP IMMEDIATELY, page founder, do not continue

DURATION ESTIMATE:
  ~3-4 hours per tenant; ~6-8 hours total session

Begin with Apex Retail Act 1. Continue through all 14 Acts (7 per tenant).
Generate reports. Stop when complete.
```

---

## 15. Acceptance Gates

The session is "complete" when:

- [ ] Apex Retail walkthrough completed end-to-end
- [ ] SkyHarbor Air walkthrough completed end-to-end
- [ ] Both per-tenant HTML reports generated
- [ ] Cross-tenant summary report generated
- [ ] All artifacts archived under `audit-artifacts/comprehensive-crawl-<DATE>/`
- [ ] Quality verdict: PASS or NEEDS REVIEW (FAIL requires founder review before sharing)
- [ ] Zero cross-tenant leaks observed
- [ ] Full conversation transcripts captured (every word)
- [ ] Source provenance traceable (Packet 33 K10) in every cited claim

---

## 16. Use Cases for the Output

### 16.1 Customer-facing
- Send to Delta CTO as the "see what your data will look like" send-ahead
- Send to PHS CDAO as the pilot-readiness evidence packet
- Send to future enterprise prospects as the "this is what AbarVa actually does" artifact

### 16.2 Investor-facing
- Series A pitch supplement: "this is the platform in action, end-to-end"
- Diligence room artifact: procurement-defensible evidence of capability
- Reference architecture: shows the multi-agent orchestration in practice

### 16.3 Internal-facing
- Quality regression baseline: future Packet 34 runs scored against this
- Training data for new hires (engineers, sales engineers)
- Substrate health proof point per tenant

### 16.4 Codex-facing
- Verifier baseline: future Tier-1 verifier runs cross-checked against this
- Continuous learning: failure modes captured here feed into Packet 32 C7 loop

---

## 17. What this packet does NOT cover

- Pilot customer onboarding (Packet 32 §5.5 covers)
- Industry overlay authoring (Packet 32 C2 covers)
- Architecture consolidation (Packet 30 covers)
- Tenant lifecycle management (Packet 32 C3 covers)

---

## 18. Companion to Packets 28-33

| Packet | Role | Relationship to Packet 34 |
|---|---|---|
| 28 — Substrate generator | Generates tenant data | Tenants in this packet rely on it |
| 29 — Demo capture | Demos one tenant | Packet 34 is the "deep" version of Packet 29 |
| 30 — Architectural fix | Required before this packet executes | Gating dependency |
| 31 — Constitution + operating model | Authority framework | Authority for execution |
| 32 — Productization roadmap | Required for K05/K10/K23 | Gating dependency |
| 33 — Readiness audit framework | Capability requirements | K05/K10/K23 must be live |
| **34 — This packet** | Comprehensive demonstration | Standalone execution post-gates |

---

## 19. Document control

- **Version:** Packet 34 v1
- **Date:** 2026-05-28
- **Author:** AbarVa Founder + Claude
- **Status:** Ready for Codex execution after Packets 30, 31, 32 (P0), 33 (K05/K10/K23) close
- **Refresh cadence:** Re-run quarterly per tenant; update questions as industries evolve

---

*End of Packet 34. Comprehensive multi-tenant browser crawl specification. Execute when prerequisites close.*
