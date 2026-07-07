# Apex Retail · Source Module · CXO Testing Brief

**Audience:** VP IT Sourcing / CIO / Chief Procurement Officer at Apex Retail
**Purpose:** This is not a product walkthrough. It's a stress-test brief — what to expect, what to demand, what to walk away from, and what "good" looks like at a Fortune 500 IT sourcing event.
**Reference scenario:** Apex Retail · ~$1.05B IT budget · AMS / IMS / managed-services portfolio
**Date:** 2026-06-02

---

## 1 · What's actually at stake

Apex IT spend ≈ $1.05B/yr. Roughly:

| Category                        | Estimated annual spend | Why it matters here                                                                          |
| ------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| AMS (Application Mgmt Services) | $220-280M              | The named scenario — SAP ECC, Sterling OMS, WMS, POS, Oracle, supplier portal, legacy estate |
| IMS / Infra Managed             | $180-240M              | Adjacent — datacenter, network, end-user computing                                           |
| Software & SaaS licenses        | $150-220M              | Inflating fastest; biggest negotiation leverage                                              |
| Cloud (hyperscaler + tooling)   | $120-180M              | Run-rate compounding 15-25%/yr if unmanaged                                                  |
| Cyber, GRC, IAM                 | $80-110M               | Tightening regulatory; cannot drop                                                           |
| Professional services / SI      | $90-130M               | Most-gamed via T&M scope creep                                                               |

**Realistic savings bands a competent CXO expects, by scenario type:**

| Scenario                                                       | Savings band (annual run-rate) | Apex $ at stake                  |
| -------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| First-time competitive AMS bid (vs. sole-source incumbent)     | 18-28%                         | $40-78M/yr on $220M AMS          |
| Multi-portfolio consolidation (AMS + IMS + EUC across BUs)     | 15-22% blended                 | $90-160M/yr on $600M scope       |
| Renewal renegotiation (no real competition)                    | 6-12%                          | $15-30M/yr                       |
| Pricing normalization + rate-card discipline (no scope change) | 3-7%                           | $30-70M/yr across all categories |
| Software/SaaS rationalization                                  | 12-25%                         | $20-55M/yr on $200M              |

**Over a 3-year contract**, a credible AMS/IMS consolidation at Apex's scale produces **$150-350M in NPV savings** plus structural protections (audit, exit, benchmarking, governance) worth another 5-10% as risk-adjusted value.

That's the prize. Anything less than 8% on a competitive event = the tool helped the incumbent. Anything more than 25% on a renewal = the tool helped you exit a bad contract.

---

## 2 · Two scenarios this brief covers

### Scenario A · Existing IT contract optimization

_"We have $35M/yr in AMS with Wipro. Contract is 2 years from renewal. Are we paying market? Where's the leverage?"_

This is not a competition. It's a renegotiation, possibly with a **stalking horse** (a credible alternative quote to keep the incumbent honest).

**CXO expectation:** 8-15% savings without a transition. Tool's job is to surface what's overpriced, what's miscoped, and what's contractually broken so you can walk into the renegotiation with evidence.

### Scenario B · AMS/IMS consolidation across portfolios

_"We have 4 AMS vendors, 3 IMS vendors, and 6 BU-level outsourcing deals. Time to consolidate to 2-3 strategic partners."_

This is a competitive sourcing event. New RFP, full TCO comparison, BAFO, contract award, transition.

**CXO expectation:** 15-22% blended savings + structural cleanup (single SoW model, unified SLAs, common governance, exit-clause parity). The tool's job is to model the consolidation properly — not just sum the spend.

---

## 3 · The CXO testing mindset

When a CXO opens a sourcing tool, they're asking five questions in this order:

1. **Can I trust what this thing says?** (= evidence chain on every claim)
2. **Will the Board believe the savings number when this is over?** (= CFO-defensible value math, no hand-waving)
3. **Will the contract protect us 3 years from now?** (= governance, audit, exit, change-control)
4. **Will my best people use it, or work around it?** (= does it match how sourcing actually runs)
5. **What does it catch that I would have missed?** (= the proof the tool is paying for itself)

If the tool fails any of #1-3, it doesn't get a second event. If it fails #4-5, it gets replaced by a spreadsheet within 6 months.

The test below is structured around making those five questions provable, not feel-good.

---

## 4 · Stage-by-stage CXO playbook

For each of the 11 stages, this section gives:

- **What the CXO needs** (the real-job question)
- **What they'll ask the tool** (the specific demands)
- **Pass-bar** (minimum to keep the event credible)
- **Exceed-bar** (what would make them say "this is the new standard")
- **Common failure modes** to specifically probe for

### Stage 1 · Strategy

**Need:** Is this a real competition or a renewal in disguise? What archetype are we running? What's the realistic savings range?

**Questions the CXO will ask:**

- "What's my BATNA if no vendor moves?"
- "Show me the 3 archetypes and why we're picking this one."
- "What's the savings range based on similar deals at similar companies — not based on this tool's guess?"
- "Who's the executive sponsor and what's their decision authority on day 60?"
- "What kills this deal if I'm honest about my political constraints?"

**Pass-bar:**

- Memo names the trigger (renewal/M&A/performance/cost pressure) and connects to a baseline number
- Identifies decision authority and sponsor by name
- States the savings range with confidence band, not a single number
- Calls out the 2-3 show-stoppers (regulatory, M&A overhang, tech-stack lock-in) explicitly

**Exceed-bar:**

- Pulls market benchmarks for similar AMS consolidations — not vendor marketing material
- Surfaces the dissenting view ("Why this might NOT save 18% — here's the case")
- Names the political constraints the sponsor won't say out loud (e.g., "CFO has signaled they want a single throat to choke; this archetype gives them 2")

**Common failure modes to probe:**

- AI generates a generic "competitive sourcing event" memo that could fit any company
- Doesn't surface tech-debt or M&A overhang from evidence
- Treats savings as a number, not a range — false confidence

### Stage 2 · Scope

**Need:** What's in and what's out, by application/service/geography/BU. What's the incumbent baseline. What's the demand profile.

**Questions:**

- "Show me the app inventory in scope with criticality tier, current incumbent, current cost, current SLA, current volume."
- "What's out, and why? Specifically — what apps are we leaving on the table and what's the risk?"
- "What's the ticket/incident/change baseline last 12 months? Per app. Show me the volume curve."
- "What does the demand look like in year 2-3? Are we sizing for steady-state or growth?"
- "What happens to scope if we divest the eCommerce BU next year?"

**Pass-bar:**

- Inventory tied to a real CMDB / financial system, not a hand-typed list
- Baseline numbers cite the source system + as-of date + reconciliation status
- Scope inclusion/exclusion rationale documented per application
- Exit/divestiture scenarios at least flagged

**Exceed-bar:**

- Auto-detects scope inconsistencies ("App X is in for AMS but excluded from IMS — is the OS support coming from somewhere?")
- Models 2-3 scope variants (lean / consolidated / expanded) with cost implications
- Surfaces hidden retained-org assumptions ("This scope assumes 12 retained Apex FTEs — confirm with HR")

**Common failure modes:**

- "App portfolio" is a list of names with no criticality or baseline
- Volume data missing or stale; no confidence indicator
- No scope-change cost model (what does it cost us to add/drop an app mid-flight)

### Stage 3 · RFP

**Need:** Defensible evaluation criteria, weighted, with vendor instructions tight enough to enforce. Pricing template anti-gaming.

**Questions:**

- "Show me the eval rubric with weights. Who signed off on the weights?"
- "Are the SLA definitions enforceable — or are they marketing language?"
- "How does the pricing template prevent vendors from hiding cost in transition, ramp, change-control, or T&M scope creep?"
- "What's the Q&A protocol? Are all questions symmetric to all bidders?"
- "What evidence do we require vendors to submit — case studies, financials, references, sub-contractor list?"

**Pass-bar:**

- Eval criteria are SMART (specific, measurable, attributable, realistic, time-bound)
- Weights total to 100 and are agreed pre-RFP
- SLA template has measurement method, exclusion windows, credit/penalty structure
- Pricing template forces apples-to-apples by tower, role, location, volume bucket

**Exceed-bar:**

- Pricing template includes "what if" scenarios (volume +/- 20%, scope shift, M&A scenario)
- Auto-detects vendor gaming patterns ("Vendor X priced governance at $50K — industry low; check if buried in T&M")
- Q&A log is symmetric, searchable, time-stamped, identity-stamped

**Common failure modes:**

- Eval criteria are buzzwords ("partnership," "innovation") without measurement
- Pricing template lets vendors add lines / footnotes — kills comparability
- No T&M cap or hourly-rate ceiling

### Stage 4 · Vendor Responses

**Need:** Completeness check + compliance flagging. Who's serious, who's not.

**Questions:**

- "Which vendors submitted complete vs. incomplete? On what specifically?"
- "Where are the non-compliance flags? What do they signal — incapability or sandbagging?"
- "What did the bidders signal about appetite — generous, defensive, walking-the-line?"
- "Any conflicts of interest? Sub-contractor overlaps? IP concerns?"

**Pass-bar:**

- Completeness matrix per vendor per section
- Non-compliance flagged with material/non-material distinction
- Q&A clarification cycle managed and logged

**Exceed-bar:**

- Heat map of "where vendors had to write essays vs. where they answered crisply" — signal of comfort
- Detects copy-paste between vendor proposals (proxy for industry collusion or shared sub)

### Stage 5 · Evaluation

**Need:** Evidence-backed scoring. Identify the BATNA. Find the spread.

**Questions:**

- "Show me each material score with the evidence and the reviewer."
- "Where do reviewers disagree? Capture the dissent."
- "What's the spread between vendor #1 and vendor #2? Tight = pricing leverage; wide = real differentiation."
- "Who's my BATNA if #1 walks away in negotiation?"

**Pass-bar:**

- Every material score has a written rationale citing evidence
- Reviewer identity and timestamp captured per score
- Dissent visible at the recommendation level (not buried)
- BATNA explicitly identified, not "vendor #2"

**Exceed-bar:**

- Auto-flag scoring inconsistency ("Reviewer A scored X high on technical but low on transition — surface the tension")
- Sensitivity analysis on weights ("If we re-weight from 30% commercial / 70% technical to 50/50, does the winner change?")
- Captures "what the reviewer would change about the criteria in hindsight"

**Common failure modes:**

- Scores without rationale ("8/10")
- Single reviewer per criterion
- No dissent captured
- "BATNA" is the next-highest scorer, not a credible alternative

### Stage 6 · Pricing Normalization

This is the **load-bearing CXO test**. Get this wrong and the rest is decoration.

**Need:** TCO normalized across vendors so the comparison is apples-to-apples. Savings bridge from baseline to each vendor's run-rate.

**Questions:**

- "Show me the TCO bridge: baseline → each vendor's curb-to-curb cost → transition cost → year-1 / year-3 / year-5 run-rate."
- "Where are the hidden costs? Transition? Ramp? Dual-run? Exit? Governance overhead? Retained-org? Change-control unit rates?"
- "Are FX, indexation (CPI/COLA), volume bands, and onshore/offshore mix normalized across vendors?"
- "What's the apples-to-apples per-unit rate — per FTE, per ticket, per app, per server, per seat?"
- "What's the iceberg? Show me 30% visible pricing + 70% invisible (governance, change, exit)."
- "What's the sensitivity? If volume drops 20%, who's most exposed? If scope grows 10%, who has the best change-order rates?"

**Pass-bar:**

- TCO table normalized across all vendors with footnotes on normalization assumptions
- Hidden costs surfaced as line items, not aggregated
- Per-unit rate table (FTE day-rate by role/location, ticket cost by tier, license cost per seat)
- Multi-year shape (year-1 through year-5) with indexation rules called out
- Currency normalized; FX assumption stated

**Exceed-bar:**

- Iceberg view literally renders 30/70 visible/hidden cost breakdown
- Sensitivity ribbon: shows TCO under volume +/- 20%, scope +/- 10%, FX shift +/- 5%
- Detects pricing games: "Vendor X has the lowest year-1 rate but the steepest year-3 escalator — true 3-yr cost is 9% higher than vendor Y"
- Surfaces "this rate is in the 95th percentile of our benchmark — challenge it" alerts
- CFO-ready savings bridge: baseline → normalized bid → scope adjustments → run-rate savings → realized value

**Common failure modes:**

- TCO is total contract value, not normalized
- Transition cost missing or rolled into year-1 (hides it)
- T&M rates compared but T&M usage volume not modeled
- No indexation normalization — vendor with 3% annual escalator looks cheaper than 5% escalator on year-1 only
- "Hidden cost" categories that aren't actually surfaced

### Stage 7 · BAFO Negotiations

**Need:** Move every commercial lever, document every concession trade, walk away credibly.

**Questions:**

- "What are the levers we're pulling and on what evidence? Price, term length, volume commit, scope flex, payment terms, SLA, governance, exit, benchmarking."
- "What's our walk-away on each lever? What's our target? What's our opening ask?"
- "What concessions are we offering back, and what are we asking for in return? Show me the concession ledger."
- "What's the BATNA strength? Is the second-bidder a credible alternative or are we bluffing?"
- "What's the negotiation cadence? Single round or iterative? In-person or written?"

**Pass-bar:**

- Per-lever target / walk-away / opening structure documented
- Concession ledger: "we asked X, vendor gave Y, in exchange we offered Z"
- BAFO evidence chain: every ask justified by benchmark, second-bid, or market data
- Risk allocation matrix (who owns what, with $ caps if applicable)

**Exceed-bar:**

- Models the negotiation envelope quantitatively: "Walking from $100M to $87M moves NPV by $X over 3 years"
- Surfaces vendor's BATNA: "Vendor probably can't go below $Y because they're carrying $Z of unrecoverable bid-team cost"
- Detects desperation signals: "Vendor moved 14% in 24hrs — they're carrying a hole; push for governance + exit improvement, not more price"
- Pre-mortem: "If we sign this, what breaks in 18 months?"

**Common failure modes:**

- BAFO ask is "we want a lower number" without lever specificity
- No concession tracking — vendor walks away with everything
- Negotiation team doesn't have a unified walk-away
- "Final" offer accepted without exit/audit/benchmark clauses

### Stage 8 · Executive Decision

**Need:** A CFO-and-Board-defensible recommendation. Evidence-backed, dissent-captured, missing-data-acknowledged.

**Questions:**

- "What's the recommendation, and what's the one-sentence reason?"
- "Show me the citations on every material claim — vendor scores, pricing math, risk assessment."
- "What's the dissent? What did the loudest contrarian say? Why are we overriding it?"
- "What do we NOT know? Where are the assumption risks?"
- "If a Board director asks 'what's the second-best option,' can I answer in 30 seconds?"
- "What's the human-approval record — who, when, what they reviewed, what reason they gave?"

**Pass-bar:**

- Executive brief has 5-7 sections: recommendation, evidence summary, missing data, risks, dissent, approval record, next steps
- Every material claim cites a source
- Dissent captured as a real section, not a footnote
- Approval record names the human, timestamp, reason text
- Brief downloadable in DOCX + PDF, full text not truncated

**Exceed-bar:**

- Auto-generates a 1-slide Board-grade summary (the "elevator to 38th floor" version)
- Identifies the 3 questions the Board is most likely to ask + pre-baked answers with citations
- Provides the "if we say no, here's plan B" outline so the Board has an off-ramp option
- Tracks pre-decision approvals through the chain (sponsor → procurement head → CFO → Board)

**Common failure modes:**

- "Award / proceed" rendered as a verdict at stage 3 (the L6 audit bug we just shipped a fix for — verify it's actually gone)
- Brief truncated mid-sentence (the chat truncation pattern showed up here in production)
- Dissent absent or sanitized
- Approval record without reason text
- No machine-readable audit log of the decision event

### Stage 9 · Selection / Award

**Need:** Lock the award. SoW airtight. Transition obligations enforceable.

**Questions:**

- "Are the commercial terms in the contract the same as what we agreed in BAFO? Line by line."
- "What changed between award and signature? Show me every diff and who approved each."
- "Is the SoW specific enough that a junior contract manager can enforce it 18 months from now?"
- "Are the transition obligations binding with penalties for slip?"
- "What's the kill-switch if KPIs miss in year 1?"

**Pass-bar:**

- Term sheet → MSA → SOW alignment matrix
- Contract clauses: audit rights, SLA credit/penalty, change control, exit, benchmarking, indemnification, IP/data, termination
- Every commercial drift from BAFO documented + approved

**Exceed-bar:**

- Auto-diff between BAFO commitments and contract language
- "Standard clauses you're missing" alerts (industry-standard protections benchmarked against this contract)
- Estimates the cost of any clause weakening ("This audit clause is 6 months instead of 12 — that's worth $X in lost recovery if we find an issue")

### Stage 10 · Transition

**Need:** KT plan signed off. Go-live readiness gates. Risk register live.

**Questions:**

- "Show me the KT plan with milestones, owner, evidence-of-completion criteria."
- "What's the go-live readiness scorecard? Who signs off and on what?"
- "Risk register: what's red, what's amber, who owns the burn-down?"
- "Reverse-side: what dependencies do we have on the incumbent? What's the exit-clause being invoked and on what dates?"

**Pass-bar:**

- Time-bound milestone plan with owner and evidence
- Go-live readiness gates with sign-off chain
- Risk register active

**Exceed-bar:**

- Auto-detects KT slip risk ("Milestone 12 is 80% but evidence is dated 30 days ago — probable real status is 60%")
- Cross-checks vendor staffing plan against actual onboarding ("Vendor said 47 FTEs by week 6; HR system shows 31")

### Stage 11 · Value

This is where the Board comes back and asks **"Did we actually save what you promised?"**

**Need:** Baseline locked. Savings model agreed with CFO. Realized savings tracking method credible.

**Questions:**

- "What's the locked baseline — what we were spending before, agreed with CFO, signed at the start of contract?"
- "What's the projected savings — what we said we'd save, in the model the CFO approved?"
- "What's the realized savings — what we actually saved, with what evidence?"
- "What's the variance? Why?"
- "Is this CFO-attestable? Could I sign my name to this number?"

**Pass-bar:**

- Value ledger entry per stage transition with FK to the decision approval
- Baseline + projected + realized + variance, each with evidence
- CFO attestation captured (signature, date, scope)

**Exceed-bar:**

- Auto-flags savings evaporation patterns ("Variance moved from 0% to -8% in last 60 days — investigate change orders")
- Ties realized savings back to specific BAFO commitments ("Vendor committed to 22% offshore ratio; current is 14% — savings shortfall traceable to staffing")
- Quarterly Board pack auto-generated with savings narrative

**Common failure modes (and what we just shipped to fix):**

- Value ledger entries without FK to decision — savings can't be traced back to who approved
- Baseline computed at read-time from telemetry, not persisted — moves over time, kills auditability
- Projected vs. realized lives in spreadsheets, not in the system

---

## 5 · Deliverable quality bars — what to inspect every artifact for

For each downloadable, run these 6 checks:

| Check                                   | What "pass" looks like                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| **Tenant-specific**                     | Apex Retail data only; no SkyHarbor / Meridian / template-org leakage          |
| **Cited**                               | Every material claim has a source — vendor doc, evidence ledger, scorecard row |
| **Non-truncated**                       | Last paragraph ends with terminal punctuation, not mid-word                    |
| **AI-Draft labeled (where applicable)** | Generated artifacts marked; human-edit/review event recorded                   |
| **Audit-traced**                        | Approver name + timestamp + reason on every committed artifact                 |
| **Downloadable in 2+ formats**          | DOCX + PDF for narrative, XLSX + PDF for structured                            |

A VP IT Sourcing should refuse to put their name on any artifact failing any of these six.

---

## 6 · Tool expectations vs. what the CXO must judge

The tool is responsible for:

- Maintaining the evidence chain
- Enforcing gates server-side (not just UI)
- Normalizing TCO across vendors
- Surfacing inconsistencies and hidden costs
- Producing audit-traced approvals
- Generating CFO-defensible savings narratives
- Preventing scope/spec drift

The CXO is responsible for:

- Business realism judgment
- Political constraint navigation
- Negotiation strategy and risk appetite
- Stakeholder alignment
- The final go/no-go call

If the tool tries to make the second list of calls, walk away. If it fails the first list, it's a $200K spreadsheet.

---

## 7 · Value bar for the Apex testing event

This is what "exceeded the bar" looks like at our scale:

| Outcome                                       | What you'd report to the Board                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pricing normalization caught hidden costs** | "TCO was 7% higher than vendor headline once we normalized governance, change control, and exit; that 7% on $35M is $2.4M/yr we would have missed" |
| **BAFO negotiation moved real levers**        | "Vendor moved 11% on price plus added 9-month exit, 3-yr benchmarking, doubled audit rights; net NPV improvement $9.8M over 3 years"               |
| **Decision packet was Board-ready**           | "I read 4 pages and could defend the recommendation to the Audit Committee"                                                                        |
| **Value ledger held**                         | "Year-1 realized savings = 94% of projected; variance traceable to specific scope event in Q3"                                                     |
| **Audit posture defensible**                  | "Auditor reviewed approval log, found timestamped human approvals with documented reasons at every stage gate. No findings."                       |

If the Source module delivers this for a real Apex event, it pays for itself **in the first 90 days** on a single AMS portfolio. The 3-year NPV opportunity at Apex's scale is **$150-350M+** across the IT portfolio if the tool gets traction beyond a single event.

---

## 8 · How to score the test

After the VP IT Sourcing walks the full event, ask them to score on these 5:

| Dimension            | 1                               | 5                         | 10                                    |
| -------------------- | ------------------------------- | ------------------------- | ------------------------------------- |
| **Trust**            | I'd rebuild the math myself     | I'd verify spot-checks    | I'd hand the brief to my CFO unread   |
| **Defensibility**    | Would not present to Board      | Need cleanup before Board | Board-ready as generated              |
| **Coverage**         | Missing core sourcing artifacts | Has the basics, no depth  | Has artifacts I didn't know I needed  |
| **Audit trail**      | Couldn't reconstruct decisions  | Reconstruct with effort   | One-click audit-ready packet          |
| **Outcome leverage** | Tool added friction             | Tool kept me on plan      | Tool surfaced savings I'd have missed |

**Pass = 7+ on every dimension. Anything below 7 on Trust or Audit Trail is a "not yet" — even if other dimensions are 9-10.**

---

## 9 · The conversation that proves it worked

The single best signal is a quote from the VP IT Sourcing, unprompted, after a full event:

> "I used to spend three weeks normalizing pricing in Excel. The tool did it in an hour, and caught two cost burials I would have missed. The BAFO ask was sharper because I could see the levers and the evidence at the same time. The decision brief was the cleanest packet I've ever taken to the CFO. Most importantly — when an auditor asks me 'who approved this gate and why' six months from now, I can answer in 30 seconds."

If that quote is unrecognizable to a real VP IT Sourcing after using the tool on a real event, we're not there yet. If it's recognizable but understated, we're at the bar. If they want to use it on the next event without being asked, we've exceeded it.

---

_Drafted for CXO testing of the Source module against the Apex Retail AMS portfolio scenario. Pair with the technical test bar in `tests/e2e/source/README.md` and the Hard Pass/Fail rules from the L6 audit memo. The product test is necessary but not sufficient — this is the value test._
