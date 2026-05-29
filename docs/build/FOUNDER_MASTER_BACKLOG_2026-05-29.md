# Founder Master Backlog — Sequenced for Execution

**Created:** 2026-05-29 (companion to `CODEX_MASTER_BACKLOG_2026-05-29.md`)
**Author:** Anand + Claude
**Status:** Live
**Audience:** Founder (Anand) — items here are NOT Codex execution scope

---

## How to use this document

This is the **founder-owned backlog** that complements the Codex Master Backlog. Everything here requires founder judgment, founder relationships, founder commitments, or founder cash — Codex cannot autonomously execute these.

Read alongside `CODEX_MASTER_BACKLOG_2026-05-29.md`. Where the two overlap (e.g., founder review of a Codex deliverable), the Codex backlog calls it out.

### Format per item

- **Owner** — who actually does the work (founder solo / founder + Claude / founder + external / founder + Codex)
- **Trigger** — when this item starts (date, milestone, customer signal)
- **Spend** — estimated external cash cost
- **Outcome** — what closes this item
- **Sequencing** — what precedes / what follows

### The mental model

If `CODEX_MASTER_BACKLOG_2026-05-29.md` is "what gets built," this is "what makes the building matter to customers, investors, and the company."

---

## Section 1 — Immediate external engagements (Days 1-30)

These unblock everything downstream. Sequenced for maximum leverage on minimal founder time.

### 1.1 — Engage SOC 2 vendor (Vanta or Drata)
- **Owner:** Founder solo
- **Trigger:** Now
- **Spend:** $25-50K/yr (Vanta ~$30K, Drata similar)
- **Outcome:** Vendor onboarded; evidence collection workflow live; Type I gap analysis report in hand within 30 days
- **Why now:** SOC 2 Type II takes 6-12 months. Starting now means attestation lands before Delta close or PHS BAA execution would otherwise stall. Every week of delay pushes Series A.
- **Decision:** Vanta vs Drata vs Secureframe. Recommendation: Vanta — broader Anthropic/Voyage subprocessor templates exist; faster startup setup. Drata is fine alternative.
- **Sequencing:** Precedes 1.4 (pen test) and 4.X (Delta/PHS commercial close)

### 1.2 — Engage corporate + privacy legal counsel
- **Owner:** Founder solo (then ongoing)
- **Trigger:** Now
- **Spend:** $5K retainer; $30-60K Year-1 estimated
- **Outcome:** Counsel of record. MSA template, SOW template, BAA template, DPA template, subprocessor list current, privacy policy compliant
- **Why now:** PHS BAA execution requires this. Delta enterprise contract requires this. Series A diligence requires this.
- **Decision:** Tier 1 (Cooley/Gunderson/Goodwin/Orrick) vs Tier 1B (Fenwick/Wilson Sonsini). Recommendation: tier 1B for cost; promote to tier 1 at Series A.
- **Sequencing:** Precedes 4.1 (PHS BAA), 4.2 (Delta MSA)

### 1.3 — Bind cyber insurance
- **Owner:** Founder solo
- **Trigger:** Now
- **Spend:** $5-15K/yr ($5M minimum coverage)
- **Outcome:** Policy bound. Certificate of insurance available for customer requests.
- **Why now:** Enterprise customers ask for COI before signing. Cheap insurance vs the alternative (a single incident wiping the company).
- **Decision:** Embroker vs Vouch vs Coalition. Recommendation: Embroker for startup-tier breadth.

### 1.4 — Schedule pen test for Day 60
- **Owner:** Founder solo (vendor selection)
- **Trigger:** After 1.1 vendor onboarded
- **Spend:** $15-50K (Bishop Fox / NCC Group tier 1; Trail of Bits / smaller boutiques mid-tier)
- **Outcome:** Pen test scheduled for ~Day 60. Pre-test scoping call done.
- **Why now:** SOC 2 Type I requires pen test evidence. Delta architect review will ask. Series A diligence requires.
- **Recommendation:** Trail of Bits or comparable mid-tier for first engagement; tier 1 at Series A.

### 1.5 — Identify and retain 1 healthcare industry advisor
- **Owner:** Founder solo
- **Trigger:** Now (network outreach)
- **Spend:** $10-15K equity (50-100 bps) + $1-3K/mo
- **Outcome:** Former hospital CIO or healthcare COO with PHS-shape pattern recognition, accepting advisor engagement
- **Why now:** Healthcare-provider overlay (Section 6.1) benefits enormously from credible industry voice. PHS pilot conversations get more sophisticated. Series A pitch credibility increases.
- **Profile:** Former CIO of a $3-10B health system. Bonus: payvider experience for PHS PHP.

### 1.6 — Schedule 5 friendly investor coffees (LISTEN, not pitch)
- **Owner:** Founder solo
- **Trigger:** Now
- **Spend:** $0
- **Outcome:** 5 meetings booked with seed/Series A investors who would be "first call" candidates 6-9 months out. Listen for: feedback on AI vertical depth thesis, comparable rounds, what they'd want to see at Series A.
- **Why now:** Building investor relationships pre-pitch is high-leverage. Asks like "what would you want to see?" produce better information than "would you invest?"
- **Target list:** 1-2 tier-1 (Sequoia/Greylock/a16z partners with AI/SaaS focus), 2-3 tier-1B (Bessemer/Index/Accel), 1-2 ex-operators-turned-investors. Use existing network; avoid cold outreach.

### Acceptance for Section 1

- [ ] SOC 2 vendor onboarded (1.1)
- [ ] Legal counsel retained (1.2)
- [ ] Cyber insurance bound (1.3)
- [ ] Pen test scheduled (1.4)
- [ ] Healthcare advisor engaged (1.5)
- [ ] 5 investor coffees on calendar (1.6)

**Total Section 1 spend: ~$80-120K external in next 30 days.** This is the structural investment that unblocks Q2 closes and Q3 Series A.

---

## Section 2 — Customer-facing workstreams (active)

### 2.1 — PHS pilot — discovery to SOW v3
- **Owner:** Founder + Claude
- **Trigger:** When PHS CDAO discovery call completes
- **Outcome:** SOW v3 finalized with:
  - Phase 0 (BAA, InfoSec review, kickoff) — 2 weeks
  - Phase 1 (synthetic data warmup, 3 use cases identified) — 4 weeks
  - Phase 2 (decision workflows, Anchor Moves run) — 5 weeks
  - Phase 3 (conversion case, 7 success criteria assessed) — 3 weeks
  - $300K pilot fee + $10K infra cap + included founder/architect time
  - Year-1 conversion path defined
- **Companion artifacts:** Update PHS_PILOT_SOW_DRAFT_v2 to v3; update PHS_YEAR_ONE_PRICING_v1 based on final tier classification
- **Sequencing:** Once SOW v3 lands → BAA execution → Phase 0 kickoff (Section 2.2)

### 2.2 — PHS Phase 0 kickoff prep
- **Owner:** Founder + Claude + Codex (technical) + legal counsel (BAA)
- **Trigger:** SOW v3 signed
- **Outcome:**
  - BAA executed
  - PHS dedicated Azure tenant provisioned (T3 per Packet 31 §2.1)
  - 5 named PHS users onboarded
  - InfoSec review packet delivered
  - Kickoff session scheduled
- **Sequencing:** Gates real-pilot execution

### 2.3 — Delta CTO pre-meeting prep
- **Owner:** Founder + Claude
- **Trigger:** When Delta CTO meeting is calendar-confirmed
- **Outcome:**
  - Asynchronous send-ahead: Packet 34 walkthrough HTML (after Codex backlog Section 9 closes)
  - Sign-in walkthrough doc updated for Delta CTO solo replay
  - 30-second opening pitch rehearsed
  - 10 hardest questions practiced (per Packet 33 §17.2)
- **Sequencing:** Codex backlog Section 9 must close first (Apex + SkyHarbor walkthroughs)

### 2.4 — 5 customer interviews (proxy CTOs/CDOs)
- **Owner:** Founder solo
- **Trigger:** Now (parallel with Section 1 + 2)
- **Spend:** $0 (network) or $500-1000 in incentive gift cards
- **Outcome:** 5 interviews completed with retail / healthcare / financial-services CXOs. Capture:
  - Would you commit budget for what AbarVa does? Why / why not?
  - What's the must-have capability?
  - What would scare you about adopting this?
  - What's the realistic procurement path at your company?
- **Why now:** Per Packet 33 §3 product capability audit Test 3. Findings shape Packet 32 P1+ priorities and Series A narrative.

### Acceptance for Section 2

- [ ] PHS SOW v3 signed (or PHS goes dormant — surface explicitly)
- [ ] PHS Phase 0 kicked off (or deferred — track)
- [ ] Delta CTO meeting held with prep artifacts in hand
- [ ] 5 customer interviews complete with findings doc

---

## Section 3 — Strategic decisions queued (founder reflection cycle)

These are the 10 questions raised by Packet 32 §21 + similar surfaced in subsequent sessions. **Decide deliberately within the next 30 days.** Each requires 30-90 min of founder thinking, not extensive analysis.

### 3.1 — Apex / First Capital tenant disposition
- **Decision:** Refresh substrate to current standard, freeze, or deprecate?
- **Considerations:** No active sales path for either currently. Apex serves the retail overlay validation work; First Capital is dormant. Northstar (Solventum-shape) is active per Phase 0D.
- **Recommendation:** Apex refreshes (Codex backlog Section 7); First Capital freezes until banking overlay or active prospect emerges.

### 3.2 — SOC 2 Type II timing commitment
- **Decision:** Commit to Type II by end of fiscal year (Series A timing) or push later?
- **Considerations:** ~$50-75K total cost; 6-month observation period; required for Delta close and Series A.
- **Recommendation:** Commit. Section 1.1 starts the clock.

### 3.3 — PHS BYOC at Year-1 vs Year-2
- **Decision:** Offer BYOC (T4) deployment in Year-1 contract or commit to Year-2?
- **Considerations:** PHS InfoSec may prefer BYOC immediately. Engineering cost to deliver clean Year-1 BYOC is ~6-8 weeks. Year-2 BYOC is cleaner.
- **Recommendation:** Year-1 dedicated tenant (T3) on AbarVa Azure; Year-2 BYOC option in contract for upgrade. Conditional on PHS not explicitly requiring BYOC Day 1.

### 3.4 — Customer-facing API priority
- **Decision:** Build customer-facing API (Packet 33 K02) before admin UI Phase 2 or after?
- **Considerations:** API enables embedded Sentinel use cases (high investor signal). Admin UI Phase 2 enables customer self-service (high customer signal).
- **Recommendation:** Admin UI Phase 2 first (closes T3 customer ask immediately); API in Q+1 after first 2 paying customers.

### 3.5 — Hire eng-1 internal vs extend Codex autonomy
- **Decision:** When does the first engineering hire happen?
- **Considerations:** Codex has demonstrated class D autonomy. Engineering velocity is high. But Codex can't be the named PHS pilot owner; can't field 2am incident pages; can't do customer demos.
- **Recommendation:** Hire after first paying customer signs (PHS or Delta), targeting Day 90-120. Profile: senior full-stack with multi-tenant SaaS experience, T3+ ops capability.

### 3.6 — Real customer data ASAP vs synthetic continued
- **Decision:** How quickly do we move PHS from synthetic to real data?
- **Considerations:** Synthetic enables Day-75 conversion case. Real data is harder, slower, and requires BAA. But real data dramatically increases customer perceived value.
- **Recommendation:** Per existing PHS SOW shape — synthetic Phase 0-2, real data classes added in Phase 3 once InfoSec clears. Don't compress.

### 3.7 — White-label / SI partner motion
- **Decision:** Do we offer AbarVa to SI partners (Slalom / Credera / boutique) for resale or co-delivery?
- **Considerations:** Channel motion adds revenue but dilutes brand. Better suited post-3 customers.
- **Recommendation:** Defer until Q+2 (post Series A). Document the deferral.

### 3.8 — Overlay pricing model
- **Decision:** Charge separately for industry overlays or bundle in platform fee?
- **Considerations:** Separate pricing exposes the "$2,760 patterns of vertical depth" investment as a real moat. Bundle simplifies sales.
- **Recommendation:** Bundle in pilot/Year-1 (simple sale). Introduce separate "AbarVa for [Industry]" SKU at Year-2 once 3+ overlays exist. Telegraph this in pricing page evolution.

### 3.9 — Embedded Sentinel-as-SDK
- **Decision:** Build embeddable Sentinel widget for customer apps (Packet 33 K09)?
- **Considerations:** Distribution play. High investor signal. Requires customer API (K02) first.
- **Recommendation:** Defer until Q+2. Mention in pitch deck as Year-2 roadmap.

### 3.10 — Healthcare provider vs medtech overlay sequencing
- **Decision:** After retail, which industry overlay next — healthcare-provider (PHS) or healthcare-medtech (Northstar)?
- **Considerations:** PHS is active pilot; Northstar is synthetic-only. Healthcare-provider is higher commercial priority.
- **Recommendation:** Healthcare-provider first (~2,500 patterns). Healthcare-medtech second (~2,000 patterns). Banking third (First Capital, ~2,300 patterns) only when banking prospect emerges.

### Acceptance for Section 3

- [ ] All 10 decisions made and documented in `docs/strategic-decisions/2026-Q2.md` (new file)
- [ ] Each decision references this backlog for traceability

---

## Section 4 — Founder-led commercial closure

### 4.1 — PHS commercial close
- **Owner:** Founder
- **Sequencing:** After SOW v3 (2.1) + BAA (2.2)
- **Outcome:** Signed contract, payment received, pilot in motion
- **Outcome value:** $300K pilot + Year-1 conversion path to $750K
- **Risk register:** PHS goes dormant; politics shift inside PHS; AI Governance Committee blocks; CDAO departs

### 4.2 — Delta commercial path
- **Owner:** Founder
- **Sequencing:** After Apex + SkyHarbor walkthroughs in hand (Codex backlog Section 9)
- **Outcome:** Either signed Year-1 contract (~$700-800K) OR clear pipeline stage with documented next steps
- **Risk register:** Delta procurement cycles; CTO budget constraints; competitive entry

### 4.3 — Customer #3 + #4 prospect identification
- **Owner:** Founder
- **Trigger:** Once PHS or Delta closes
- **Outcome:** 2 named prospects with industry overlay match (retail, airline, healthcare-provider) + warm intro path
- **Why:** Reference customer + 2 in pipeline = Series A defensible

---

## Section 5 — Hiring sequence

Per Packet 33 §16.2 — sequenced for revenue + complexity unlocks.

### 5.1 — Engineer 1 (Day 90-120)
- **Profile:** Senior full-stack, multi-tenant SaaS background, comfortable with Codex pairing
- **Focus:** Connector library (Packet 32 C5 P1+), customer admin Phase 2 (C4), incident response on-call
- **Comp:** $200-300K loaded; 0.5-1.5% equity depending on tier
- **Trigger:** First paying customer signs

### 5.2 — Customer success lead (Day 120-150)
- **Profile:** Mid-career enterprise SaaS customer success; healthcare or airline vertical bonus
- **Focus:** PHS + Delta + next 3 accounts; QBR cadence; renewal pipeline
- **Comp:** $150-200K loaded; 0.25-0.75% equity
- **Trigger:** 2+ paying customers OR PHS pilot kickoff complete

### 5.3 — Engineer 2 — AI/ML specialist (Day 150-180)
- **Profile:** ML engineer with RAG / agent / continuous-learning experience
- **Focus:** Packet 32 C7 Phase 2-5 (model versioning, agent observability, continuous learning loop, multi-agent)
- **Comp:** $250-350K loaded
- **Trigger:** Eng 1 onboarded + customer base supports investment

### 5.4 — Sales engineer (Day 180-210)
- **Profile:** Senior SE with enterprise AI / SaaS background
- **Focus:** Demo scaling, customer-shape templates, RFP responses, pre-sales technical
- **Comp:** $200-280K loaded
- **Trigger:** 3+ active sales cycles

### 5.5 — Product designer (Day 210-270)
- **Profile:** Senior product designer with enterprise SaaS experience
- **Focus:** Packet 32 C8 Phase 2-5 (design polish, mobile, accessibility, performance)
- **Comp:** $180-250K loaded
- **Trigger:** Series A close OR organic priority elevation

### Acceptance for Section 5

- [ ] Eng 1 onboarded (gates Packet 32 P1 capacity)
- [ ] CS lead onboarded (gates 3+ customer support)
- [ ] Eng 2, SE, designer onboarded per Series A funding

---

## Section 6 — Industry overlay strategic sequencing

Codex executes via Packet 35 methodology; founder sequences and reviews.

### 6.1 — Retail (in flight)
- **Owner:** Founder + Claude (authoring) + Codex (load/validate)
- **Status:** Codex backlog Sections 5-7
- **Outcome value:** Apex demo defensible; methodology proven; ~5,500 patterns reusable

### 6.2 — Healthcare-provider (PHS critical)
- **Owner:** Founder + Claude + healthcare advisor (from 1.5)
- **Trigger:** Retail validated (Codex backlog Section 6.6 closes)
- **Outcome:** ~2,500 patterns; PHS-readiness; Meridian tenant rich
- **Sequencing:** Foundation for PHS Phase 1-3 value
- **Note:** Uses retail authoring methodology — faster (4 weeks elapsed vs 6+ for first)

### 6.3 — Healthcare-medtech (Solventum-shape)
- **Owner:** Founder + Claude + advisor
- **Trigger:** When a healthcare-medtech prospect emerges OR Northstar becomes commercial
- **Outcome:** ~2,000 patterns; Northstar demo-defensible
- **Sequencing:** Lower priority unless commercial signal emerges

### 6.4 — Banking
- **Owner:** Founder + Claude + banking advisor
- **Trigger:** Active banking prospect or competitive opportunity
- **Outcome:** ~2,300 patterns; First Capital demo-defensible
- **Sequencing:** Deferred

### 6.5 — Future verticals (manufacturing / gov / education)
- **Trigger:** Commercial signal only
- **Note:** Methodology is now repeatable; each overlay ~30-50% time of predecessor

### Acceptance for Section 6

- [ ] Retail overlay validated and in production (Codex backlog Section 6.6)
- [ ] Healthcare-provider overlay authored and validated
- [ ] Sequencing for remaining overlays explicitly tied to commercial signals

---

## Section 7 — Investor readiness track

Per Packet 33 §10 (investor readiness audit). Operates in parallel with Sections 1-6.

### 7.1 — Investor narrative test (Days 30-90)
- **Owner:** Founder + Claude
- **Outcome:** 30-second, 5-minute, 30-minute versions of pitch. Tested with 5 friendly investors (from 1.6). Feedback iterated.
- **Trigger:** Now

### 7.2 — Comparable rounds research (Days 30-60)
- **Owner:** Founder + analyst help (Claude)
- **Outcome:** 5-10 most-apt Series A comparables in AI SaaS / vertical AI / decision-intelligence. Multiples, ACV, ARR at round, round size, valuation.
- **Trigger:** Now

### 7.3 — TAM / SAM / SOM build (Days 60-90)
- **Owner:** Founder + Claude
- **Outcome:** Defensible market sizing. SOM ≥$500M; TAM ≥$50B.
- **Trigger:** Once first 2-3 customer interviews complete (data informs sizing)

### 7.4 — Moat narrative articulation (Days 90-120)
- **Owner:** Founder + Claude
- **Outcome:** 3+ moats clearly articulated and demonstrable. Substrate moat (per-customer data depth), overlay moat (industry pattern library), data flywheel moat (continuous learning), switching cost moat (decision-spine becomes OS).
- **Trigger:** Once retail overlay validates (proof of methodology)

### 7.5 — Pitch deck draft (Days 120-180)
- **Owner:** Founder + Claude
- **Outcome:** Series A pitch deck v1 drafted and tested with 5 advisors + 10 friendly investors. Iterated to v2 based on feedback.
- **Trigger:** Reference customer + 2 customer interviews supportive

### 7.6 — Diligence room assembly (Days 180-270)
- **Owner:** Founder + legal + fractional CFO
- **Outcome:** Clean diligence package: cap table, corporate docs, customer contracts, financial statements, compliance attestations.
- **Trigger:** ≥$1M ARR or contracted equivalent + 2 paying customers
- **Spend:** $20-40K legal + $5-10K/mo fractional CFO

### 7.7 — Series A first meetings (Days 270-300)
- **Owner:** Founder
- **Outcome:** 15-25 first meetings with tier 1 / tier 1B funds. Track outcomes.
- **Trigger:** Pitch deck v2 + diligence room ready

### 7.8 — Term sheet → close (Days 300-365)
- **Owner:** Founder + legal
- **Outcome:** $15-30M Series A at $80-150M post
- **Trigger:** Term sheet received

### Acceptance for Section 7

- [ ] 30-second pitch tested with 5 friendlies
- [ ] Comparable rounds data
- [ ] Defensible TAM/SAM/SOM
- [ ] Moat narrative with demonstrable proof points
- [ ] Pitch deck v2
- [ ] Diligence room clean
- [ ] First meetings → term sheet → close

---

## Section 8 — Packet 32 P1+ items queued

Codex backlog Section 8 covers P0. Here's the post-P0 queue, sequenced.

### 8.1 — Connector library Phase 2 (P1)
- C5 P1: ServiceNow CMDB + Workday HCM connectors
- **Trigger:** After PHS Phase 0 reveals real data sources
- **Owner:** Codex (build) — sequenced post-eng-1

### 8.2 — Customer admin Phase 2 self-service (P1)
- C4 P1: Invite users, configure modules, export data
- **Trigger:** After PHS pilot kicks off (real customer asks)
- **Owner:** Codex

### 8.3 — Tenant lifecycle automation (P1)
- C3 P1: Promotion scripts T1→T2→T3→T4
- **Trigger:** When converting Demo tenant to Pilot (first time)
- **Owner:** Codex

### 8.4 — Observability Phase 2-4 (P1-P2)
- C6 Phase 2: per-tenant cost tracking
- C6 Phase 3: SLA reporting
- C6 Phase 4: incident management
- **Trigger:** After first paying customer
- **Owner:** Codex

### 8.5 — Engineering maturity Phase 2-5 (P2-P3)
- C7 Phase 2-5: model versioning, agent observability, continuous learning, multi-agent
- **Trigger:** Eng 2 (AI/ML) onboarded
- **Owner:** Eng 2 + Codex

### 8.6 — UI / UX completeness Phase 2-5 (P2)
- C8 Phase 2-5: design system polish, mobile, accessibility, performance
- **Trigger:** Designer onboarded
- **Owner:** Designer + Codex

### 8.7 — Documentation generation infrastructure (P2)
- C11: TypeDoc API reference, schema docs, ADR log browser, docs.abarva.ai
- **Trigger:** After eng-1 + eng-2 ramp; or earlier if PHS InfoSec demands
- **Owner:** Codex

### 8.8 — Customer success full scorecard + QBR automation (P2)
- C12 full: health scorecards, QBR auto-generation, renewal pipeline
- **Trigger:** 2+ paying customers
- **Owner:** CS lead + Codex

### 8.9 — DR per tier + bug bounty (P2-P3)
- C13 P2: DR drills per tier
- C13 P3: bug bounty program
- **Trigger:** Series A close
- **Owner:** Eng team + external

---

## Section 9 — Packet 33 capability roadmap (K01-K25)

Per Packet 33 §13. Codex backlog Section 9 implicitly covers K05/K10/K23 via Packet 34. The rest queued by impact + customer signal.

### 9.1 — Already partially built (validate + extend, per Packet 34 Amendment B)
- K05 — Document generation (mostly built)
- K10 — Audit-grade evidence chains (mostly built)
- K23 — Board-ready output formats (Master Move Dossier exists)

### 9.2 — P0 to extend (sequenced post-Packet-34 execution)
- Gap-filling specific to what Packet 34 Pre-Act 0 audit surfaces
- Likely: Intelligence-tier deliverable templates (executive briefing, strategic decision paper, quarterly memo)

### 9.3 — P1 capabilities (sequenced by customer signal)
- K03 — Workflow automation engine (trigger-based Moves) — high investor signal
- K06 — Continuous learning loop (data flywheel) — high investor signal
- K12 — Real-time data refresh (CDC) — high customer signal for production tier
- K13 — ROI tracking dashboard — high customer success retention signal
- K17 — Slack/Teams integration — daily-active driver
- K19 — Pre-built solution accelerators (M&A diligence, regulatory readiness, etc.) — sales velocity multiplier
- K25 — Quarterly executive memo automation — recurring value

### 9.4 — P2 capabilities (post Series A)
- K01 — Multi-agent (Atlas/Sentinel/Steward/Maestro fully distinct) — architectural sophistication signal
- K02 — Customer-facing API — distribution play
- K14 — Persona-aware UI

### 9.5 — P3 capabilities (long-term moat)
- K04 — Strategy simulation
- K07 — Pattern marketplace
- K08 — White-label
- K09 — Embeddable Sentinel
- K11 — Cross-customer insights
- K15 — Mobile
- K16 — Voice
- K18 — Custom ontology
- K21 — Benchmarking
- K22 — Risk dashboards
- K24 — AI Governance Committee tooling

---

## Section 10 — Packet 31 §5.3 hygiene additions (queued for Codex)

Eight files Packet 31 §5.3 specified but never created. Add to Codex backlog when downtime permits.

- `docs/architecture/adr/0001-template.md` — ADR template for future ADRs
- `docs/architecture/INVARIANTS.md` — quick reference of all invariants I1-I10
- `docs/architecture/DEPLOYMENT_TIERS.md` — for sales / procurement reference (T1-T4 explained for buyers)
- `docs/architecture/CUSTOMER_ENHANCEMENT_DECISION_TREE.md` — Packet 31 §3.1 extracted
- `docs/operations/INCIDENT_RESPONSE.md` — runbook per Packet 31 §4.8
- `docs/onboarding/TENANT_PROVISIONING_PLAYBOOK.md` — Packet 31 §2.5 / §5.5 extracted
- `eslint.config.mjs` updates — I1-I10 guards (some live already; others need explicit codification)
- `scripts/promotion/T1-to-T2.mjs`, `T2-to-T3.mjs`, `T3-to-T4.mjs` — promotion automation stubs

**Owner:** Codex (mechanical extraction from existing packets)
**Trigger:** Any time Codex has downtime between critical-path items

---

## Section 11 — Operational residuals to triage

### 11.1 — STRESS-P0-006 (task #17 still pending from early May)
- **Issue:** 3rd-generation tenant-bleed source — find via `ai_egress_audit` inspection
- **Owner:** Codex (with founder review of findings)
- **Question to answer:** Did Phase 0B + Phase 0D close this implicitly via I9 + tenant-resolution work? If yes, mark closed. If no, surface as P1 task.
- **Trigger:** Phase 0B + 0D closure summary

### 11.2 — 84 P1 backlog from post-deploy crawls
- **Issue:** Accumulated pre-existing P1s across multiple crawls
- **Owner:** Codex (triage) → founder (prioritize)
- **Outcome:** Categorize: must-fix-before-Delta-demo / nice-to-have / wontfix-deprecated
- **Trigger:** After Codex backlog Section 4 closes (Packet 30 fully done)

### 11.3 — Draft PR triage (#2393, #2360, #2280, #2256, #1903 disposition)
- **Owner:** Codex (one-line scope) → founder (decide)
- **Trigger:** Codex backlog Section 1.1
- **Outcome:** Each PR closed, merged, or queued with explicit reason

### 11.4 — Vercel CLI upgrade
- **Issue:** Vercel CLI 51.7.0 → 54.6.1 outdated (per session reminders)
- **Owner:** Founder solo (1 minute) — `npm i -g vercel@latest`
- **Trigger:** Next founder terminal session
- **Outcome:** Latest agentic features available

### 11.5 — Pre-existing typecheck blocker
- **Issue:** `@azure/*`, `pptxgenjs`, `@resvg/resvg-js` missing optional packages
- **Owner:** Codex (decide: install / deprecate code / pin in devDependencies)
- **Trigger:** Codex backlog Section 10.4
- **Outcome:** Full `tsc` passes OR documented suppression with rationale

---

## Section 12 — Sales engineering enablement (queued)

Per Packet 33 §11 (Sales Engineering Enablement audit). Builds as customer base grows.

### 12.1 — Demo persona library
- **Owner:** Founder + Claude → eventually SE
- **Trigger:** Apex + SkyHarbor walkthroughs complete (give us 2 verticals × multiple personas)
- **Outcome:** For each industry overlay (retail, airline, future) — 5-8 personas with canonical 15-min demo flows

### 12.2 — ROI calculator
- **Owner:** Founder + Claude (initially); Codex (productize)
- **Trigger:** Customer interview findings (Section 2.4) — what value claims resonate
- **Outcome:** Customer-facing tool that takes inputs (consulting spend, decision velocity, etc.) and produces AbarVa ROI projection

### 12.3 — Customer-shape templates per vertical
- **Owner:** Founder + Claude + industry advisor
- **Trigger:** Per industry, as overlay completes
- **Outcome:** "Public healthcare provider, $5B+ revenue" template + "Mid-market airline, single hub" + "Regional bank, $2B+ assets" — pre-populated substrate scaffolding, pricing, demo flow

### 12.4 — RFP response library
- **Owner:** SE (when hired)
- **Trigger:** First inbound RFP
- **Outcome:** Question bank with vetted answers covering security, architecture, compliance, capability

---

## Section 13 — Documentation infrastructure (queued)

Per Packet 32 C11. Build as engineering team grows.

### 13.1 — TypeScript API auto-reference (TypeDoc)
- **Owner:** Codex
- **Trigger:** Eng 1 onboarded
- **Outcome:** Auto-generated API docs published

### 13.2 — DB schema docs from migrations
- **Owner:** Codex
- **Trigger:** Post Packet 30 closure
- **Outcome:** Schema docs auto-generated, current

### 13.3 — ADR log browser
- **Owner:** Codex
- **Trigger:** ADR count reaches ~5+ (we're at 1 now, plus amendments)
- **Outcome:** Browseable ADR index

### 13.4 — Internal docs site (docs.abarva.ai or internal)
- **Owner:** Codex
- **Trigger:** When 3+ team members + customer success need self-service
- **Outcome:** Searchable internal documentation site

---

## Section 14 — Pricing / commercial structure decisions

### 14.1 — PHS final pricing structure
- **Status:** v2 + Year-1 pricing already exist (`PHS_PILOT_SOW_DRAFT_v2.md`, `PHS_YEAR_ONE_PRICING_v1.md`)
- **Owner:** Founder + Claude
- **Trigger:** PHS discovery completes → v3 finalizes

### 14.2 — Delta pricing structure
- **Owner:** Founder + Claude
- **Trigger:** Delta CTO meeting outcomes + Packet 34 walkthrough received

### 14.3 — Retainer / advisory rate card v2
- **Status:** Current rate card lives in Packet 31 §3.6 references
- **Owner:** Founder
- **Trigger:** Series A close — rate card increases by ~5% per Packet 31 annual review clause
- **Decision:** Whether to maintain "first customer reference discount" structure or evolve

### 14.4 — Overlay separate-SKU pricing
- **Decision per 3.8:** Year-2+ introduction of separate "AbarVa for [Industry]" SKU
- **Owner:** Founder + advisor
- **Trigger:** 3+ industry overlays live

---

## Section 15 — The line between Codex backlog and this backlog

### Codex executes (Codex Master Backlog)
- All software development, refactoring, deployment
- Migrations, schema changes, test execution
- Documentation generation (auto)
- Audit / verification / regression testing
- Trust ladder class A-D autonomous

### Founder executes (this backlog)
- All external relationships (vendors, advisors, customers, investors, counsel)
- All strategic decisions (industry sequencing, pricing, hiring, partnerships)
- All customer-facing commercial work
- All hiring
- Trust ladder class E/F/G approval

### Founder + Claude (collaborative)
- Strategic packet authoring (this kind of work)
- Pitch deck and investor materials
- Customer-shape templates
- Industry overlay authoring (founder voice + Claude drafting)
- ADR proposals (founder approves, Claude drafts)

### Founder + Codex (collaborative)
- Code reviews of class E/F/G PRs
- Strategic decisions on architecture
- ADR sign-offs
- Trust ladder progression decisions

**Use this as the routing rule:** if a task requires money, relationships, judgment about company strategy, or class E/F/G authority — it's here. If it's mechanical, well-spec'd, and within established invariants — it's Codex's.

---

## Section 16 — Founder time allocation guidance (the lever)

Per Packet 33 §6 Test 2 (founder time allocation).

### Recommended weekly allocation (rough)
- **30%** customer + sales pipeline (PHS, Delta, prospects)
- **20%** investor + strategic narrative
- **15%** industry overlay authoring (founder voice required)
- **15%** team building (hiring, advisor engagement, contracts)
- **10%** Codex review, ADR sign-off, escalations
- **10%** general operations (legal review, ops decisions, etc.)

### Anti-patterns to avoid
- Founder writing code Codex could write (wastes founder leverage)
- Founder coordinating Codex execution rhythm (Codex self-organizes per backlog)
- Founder context-switching every 30 min (deep work blocks > shallow availability)
- Founder reviewing every Codex commit (trust ladder exists for this reason)

### Watch for
- Customer + sales pipeline drops below 25% → revenue stalls
- Investor narrative drops below 15% → Series A slips
- Industry overlay drops below 10% during active authoring → quality suffers
- General operations rises above 20% → operational overhead is eating founder leverage; delegate or eliminate

---

## Section 17 — Definition of "this backlog is closed"

When all of these are true:

- [ ] Section 1 — All 6 external engagements onboarded
- [ ] Section 2 — PHS contracted (or dormant + documented); Delta contracted (or pipeline stage); 5 customer interviews done
- [ ] Section 3 — All 10 strategic decisions documented
- [ ] Section 4 — PHS + Delta closed; 2 prospects identified
- [ ] Section 5 — Hiring sequence executing per plan
- [ ] Section 6 — Retail + healthcare-provider overlays validated; others sequenced by signal
- [ ] Section 7 — Series A closed
- [ ] Sections 8-14 — sequenced and visible (continuous)
- [ ] Section 16 — Founder time allocation healthy

**Then AbarVa is:**
- 2+ paying enterprise customers
- $1.5-3M ARR
- Reference customer in hand
- $15-30M Series A closed
- Series B prep beginning

That is the destination this backlog points to. ~6-12 months elapsed.

---

## Document control

- **Version:** v1
- **Date:** 2026-05-29
- **Owner:** Anand (Founder)
- **Companion:** `CODEX_MASTER_BACKLOG_2026-05-29.md` (Codex execution scope)
- **Refresh:** Monthly review; full rewrite quarterly OR when a major milestone closes

---

*End of Founder Master Backlog. The strategic + commercial + organizational work that lets the engineering matter. Read alongside Codex backlog. Both compound.*
