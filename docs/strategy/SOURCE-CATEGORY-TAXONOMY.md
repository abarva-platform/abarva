# Source — IT Sourcing Category Taxonomy (Slice 0.1)

> Owner: founder + sourcing SME. Status: Wave 0, Slice 0.1 deliverable.
> Companion to `SOURCE-SOURCING-METHODOLOGY.md` (the lifecycle backbone) and
> `ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md` (the execution plan).

---

## 1. Why this document exists

The methodology spec (`SOURCE-SOURCING-METHODOLOGY.md`) encodes the *lifecycle*
an expert reasons across — Stage 0 demand challenge through Stage 7 vendor
management. This document encodes the *categories* an expert recognises. A
senior IT-sourcing partner does not run one generic playbook; they reach for a
different mental model the moment they hear "AMS renewal" versus "we need an AI
build partner" versus "the contact-centre BPO is up."

This taxonomy gives the Source surface (Sentinel-fronted) that category
recognition. For each of the 8 categories it records:

- **Decision questions** — the judgment questions the expert asks, mapped to
  the lifecycle stage they belong to.
- **Evidence inputs** — which grounded tenant context segments
  (`vendor_contracts`, `it_landscape`, `it_financials`, `program_inventory`,
  `operating_telemetry`, `industry_context`, `compliance`) the category needs.
- **Output artifacts** — what the category produces.
- **Anti-patterns** — the traps, and what the expert does instead.

**What this slice is NOT.** This is the encoded taxonomy only. The
*classifier* that maps a real sourcing event onto a category, buying motion,
and evidence gaps is **Slice 1.1** and deliberately out of scope here. This
slice ships docs + typed contracts + tests; no UI, no runtime behaviour
change.

**Typed contract.** The machine-readable form lives in
`src/lib/source/taxonomy/category-taxonomy.ts` as a discriminated union keyed
on `SourceCategoryId`. This document and that module must stay in sync.

**Consistency with the existing Source surface.** The category set is aligned
with the archetype language already used in `src/lib/source` (the
`sourcingArchetype` field, the `S0_intake … S7_activate` stage packs, and the
golden AMS demo events such as `apex-retail-ams-outsourcing-2026`). Evidence
inputs reference the same tenant context segment names used across the Source
methodology and queries.

---

## 2. The 8 categories at a glance

| # | Category | Core question it answers |
|---|---|---|
| 1 | AMS (application managed services) | Who runs and maintains the app estate, and is "run it" even the right ask? |
| 2 | Data / AI platform | Which data/AI platform, and do we already own coverage? |
| 3 | AI engineering partner | Who builds/operates our AI solutions — and are they real? |
| 4 | SaaS renewal | Renew, renegotiate, right-size, or rationalize? |
| 5 | Cloud / FinOps | What cloud commitment is justified after the waste is removed? |
| 6 | BPO / contact centre | Outsource the process, automate it, or redesign it? |
| 7 | Cyber / GRC | Which control gap does this close — or is it tool sprawl? |
| 8 | Staff aug vs. managed service | Are we buying capacity or an outcome? |

Every category runs through the §1 governance filter of the methodology spec:
expertise test, grounding test, challenge test.

---

## 3. Category detail

### 3.1 AMS — Application Managed Services

Outsourced run/maintain/enhance of an application estate to a managed-service
provider.

**Decision questions**
- (S0) Is the real need to keep the lights on, or to modernize the
  application? AMS sources the former and entrenches the latter.
- (S0) Which applications in scope are slated for retirement or replacement
  inside the AMS term?
- (S1) Single-tower or multi-tower? Does one provider get scale leverage we
  lose by splitting?
- (S4) What is the run-rate today (internal FTE + tooling) so the AMS quote is
  benchmarked, not accepted?
- (S5) Are XLAs (experience-level) defined, or only uptime SLAs that reward
  ticket volume?

**Evidence inputs**
- `it_landscape` *(required)* — application estate, criticality, modernization
  roadmap.
- `it_financials` *(required)* — current internal run-cost baseline.
- `vendor_contracts` *(required)* — incumbent support contracts and overlap.
- `program_inventory` — in-flight modernization that would hollow out scope.

**Output artifacts**
- AMS demand-challenge memo — AMS vs. modernization vs. insourcing.
- Run-cost baseline & should-cost range.
- Tower scope & SLA/XLA matrix.

**Anti-patterns**
- Sourcing AMS when the real need is product/application modernization →
  run the Stage 0 demand challenge; route modernization to a Move.
- Locking a multi-year term over apps scheduled for retirement → carve them
  into a shorter ramp-down tower.
- Uptime SLAs that pay per ticket resolved → require XLAs and
  ticket-reduction incentives.

### 3.2 Data / AI Platform

Selection of a data, ML, or AI platform (warehouse, lakehouse, feature/model
platform, vector store).

**Decision questions**
- (S0) Do we already own platform capability that covers this? Most
  enterprises run 2–3 overlapping data platforms.
- (S1) Is this a platform decision or a use-case decision dressed up as one?
- (S2) What is the exit cost — egress, re-platforming, retraining — in three
  years?
- (S4) How does consumption pricing behave at 3x and 10x current data volume?

**Evidence inputs**
- `it_landscape` *(required)* — existing data platforms and integration
  surface.
- `vendor_contracts` *(required)* — incumbent platform contracts and committed
  spend.
- `it_financials` *(required)* — current spend and consumption trajectory.
- `program_inventory` — AI/data programs defining real workload demand.

**Output artifacts**
- Platform overlap & coverage assessment.
- Consumption-cost & scaling model.
- Lock-in & exit-portability analysis.

**Anti-patterns**
- Buying a strategic platform for a single near-term use case → separate the
  use-case and platform decisions.
- Consumption pricing with no cap or scaling model → require a predictability
  ceiling.
- Ignoring 20–40% redundant spend across overlapping platforms → run the
  overlap assessment first.

### 3.3 AI Engineering Partner

Selection of a delivery partner to build/operate AI solutions (agents,
copilots, model ops).

**Decision questions**
- (S0) Is this a real engineering partner with platform IP, or a GPT-wrapper /
  staff-aug shop in partner clothing?
- (S1) Should this be one SI engagement, or split into platform build, model
  operations, and workflow redesign?
- (S3) What discriminating proof — not slides — separates real AI capability
  from vendor marketing?
- (S5) Who owns the model weights, prompts, evals, and fine-tunes when the
  engagement ends?

**Evidence inputs**
- `program_inventory` *(required)* — the AI initiatives and readiness gaps.
- `industry_context` *(required)* — vendor reality, viability, reference
  comparators.
- `it_landscape` *(required)* — internal engineering capacity and the
  platform built on.
- `vendor_contracts` — existing SI/partner agreements covering the scope.

**Output artifacts**
- Vendor reality assessment.
- Engagement decomposition (platform / model-ops / workflow lanes).
- AI IP & exit clause checklist.

**Anti-patterns**
- Treating a staff-aug shop or GPT wrapper as a strategic AI partner → demand
  discriminating proof and platform IP evidence.
- One over-scoped SI RFP for platform, model ops, and workflow at once →
  decompose and source the external lane with targeted controls.
- Letting the partner retain fine-tuned models built on tenant data → require
  output ownership and fine-tune portability clauses.

### 3.4 SaaS Renewal

Renewal, renegotiation, or rationalization of an existing SaaS subscription.

**Decision questions**
- (S0) Is the product still used at the licensed level, or are we renewing
  shelfware?
- (S0) Does another tool in the estate now cover this — making renewal a
  rationalization decision?
- (S5) When is auto-renewal notice due, and do we still have competitive
  tension before it locks?
- (S5) What is the true price walk including uplift, new modules, and
  price-protection erosion?

**Evidence inputs**
- `vendor_contracts` *(required)* — renewal date, auto-renewal terms, notice
  window, price protection.
- `operating_telemetry` *(required)* — actual usage vs. licensed seats.
- `it_landscape` *(required)* — overlapping tools that could absorb the
  function.
- `it_financials` — spend history and uplift trajectory.

**Output artifacts**
- Usage vs. license utilization report.
- Renewal-calendar & notice-window alert.
- Renegotiation posture.

**Anti-patterns**
- Renewing at the same seat count without checking utilization → pull
  telemetry; right-size first.
- Missing the auto-renewal notice window → track the renewal calendar and open
  renegotiation early.
- Renewing a tool another product already covers → run the overlap check.

### 3.5 Cloud / FinOps

Sourcing or renegotiation of cloud commitments and the FinOps discipline that
governs cloud spend.

**Decision questions**
- (S0) Is the problem a commercial-terms problem, or an architecture/waste
  problem a contract cannot fix?
- (S1) What commit level is justified by genuine forecast demand vs. optimistic
  growth assumptions?
- (S4) How much current spend is idle, oversized, or untagged?
- (S5) Do the discount terms survive a workload migration, or trap us on this
  provider?

**Evidence inputs**
- `it_financials` *(required)* — cloud spend, growth trend, waste baseline.
- `vendor_contracts` *(required)* — existing commitment terms and discount
  tiers.
- `it_landscape` *(required)* — workload footprint driving the spend.
- `operating_telemetry` — utilization signals for rightsizing.

**Output artifacts**
- Cloud waste & rightsizing baseline.
- Commitment model & should-commit range.
- Discount-portability analysis.

**Anti-patterns**
- Negotiating a bigger commit to fix architectural waste → run FinOps
  rightsizing first.
- Committing to an aggressive tier on optimistic growth → size to forecast
  demand with a confidence range.
- Deep discounts that silently lock workloads in → model exit cost and require
  portability-safe structuring.

### 3.6 BPO / Contact Centre

Outsourcing of a business process or contact-centre operation to a BPO
provider.

**Decision questions**
- (S0) Should this process be outsourced, automated, or redesigned?
  Outsourcing a broken process exports the dysfunction.
- (S1) How much of this volume will AI/automation remove inside the contract
  term?
- (S4) Is pricing per-seat/per-FTE (rewards headcount) or per-outcome (rewards
  deflection)?
- (S5) What are the CX, attrition, and brand-risk consequences if service
  quality drops?

**Evidence inputs**
- `operating_telemetry` *(required)* — process volume, contact mix,
  automatable share.
- `it_financials` *(required)* — current cost-to-serve baseline.
- `program_inventory` *(required)* — automation/AI programs reshaping volume.
- `vendor_contracts` — incumbent BPO terms and exit provisions.

**Output artifacts**
- Outsource / automate / redesign decision memo.
- Volume-decay & deflection model.
- Outcome-based pricing & CX-risk matrix.

**Anti-patterns**
- Outsourcing a broken process instead of fixing it first → run the Stage 0
  triage.
- Per-FTE pricing while planning AI deflection → use outcome/deflection-based
  commercials and a volume-decay schedule.
- Optimizing only for cost and ignoring CX/attrition/brand risk → set
  experience-level targets and brand-risk guardrails.

### 3.7 Cyber / GRC

Sourcing of security, governance, risk, or compliance tooling and managed
security services.

**Decision questions**
- (S0) Which specific control gap or compliance obligation does this close —
  or is it tool sprawl?
- (S0) Do existing security tools already cover this capability under a
  different label?
- (S2) Does the vendor itself meet the security/compliance bar we are buying
  the tool to enforce?
- (S6) What fourth-party / sub-processor exposure does this vendor introduce?

**Evidence inputs**
- `compliance` *(required)* — control gaps, audit findings, regulatory
  obligations.
- `it_landscape` *(required)* — existing security tooling and capability map.
- `vendor_contracts` — incumbent security/GRC contracts.
- `industry_context` — vendor viability and threat-landscape comparators.

**Output artifacts**
- Control-gap mapping.
- Tooling-overlap assessment.
- Vendor-security & fourth-party risk review.

**Anti-patterns**
- Buying another security tool without mapping it to a control gap → anchor
  every purchase to an obligation or audit finding.
- Adding to security-tool sprawl when an owned tool covers it → consolidate
  before sourcing.
- Ignoring the vendor's own security posture and sub-processor chain → require
  vendor-security evidence and fourth-party disclosure.

### 3.8 Staff Augmentation vs. Managed Service

The delivery-model decision between buying labour (staff aug) and buying an
outcome (managed service).

**Decision questions**
- (S0) Are we buying capacity (staff aug) or an outcome (managed service)?
  They are priced and governed differently.
- (S1) Who carries delivery risk and accountability — us, or the provider?
- (S1) Is the demand a temporary spike (favours staff aug) or steady-state run
  (favours managed service)?
- (S5) Does a "managed service" priced per head and directed by us simply
  re-label staff aug at a markup?

**Evidence inputs**
- `program_inventory` *(required)* — the work to deliver; spike vs.
  steady-state.
- `it_landscape` *(required)* — internal capability and capacity gap.
- `it_financials` *(required)* — cost baseline for labour-rate vs. outcome
  pricing.
- `vendor_contracts` — existing labour / managed-service agreements.

**Output artifacts**
- Delivery-model decision memo.
- Risk & accountability allocation.
- Pricing-model comparison.

**Anti-patterns**
- Buying staff aug for steady-state run work → match steady-state demand to a
  managed service with outcome accountability.
- Buying a managed service for a short-lived spike → use staff aug for
  temporary demand.
- A "managed service" that is per-head, client-directed staff aug at a markup
  → require genuine outcome SLAs and provider-owned delivery risk.

---

## 4. How this feeds Wave 1

Slice 1.1 (the category strategy classifier) consumes
`SOURCE_CATEGORY_TAXONOMY` to map a sourcing event to a category, buying
motion, risk profile, and evidence gaps. The classifier reads this registry;
it does not redefine it. Subsequent Wave 1 slices (build/buy/partner gate,
should-cost model, proposal normalization, negotiation posture) attach to the
category each event resolves to. Keeping the taxonomy as a stable, typed,
test-covered contract is what prevents each downstream slice from inventing
its own category model.
