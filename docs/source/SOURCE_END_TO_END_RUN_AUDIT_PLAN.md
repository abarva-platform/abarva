# Source End-to-End Run — Step-by-Step Audit Plan

**Purpose.** A real sourcing event is run through the Source spine **one step at a
time**. After each step we audit against the gate criteria below. We move to the
next step **only if every gate passes**. A failed gate is fixed (or the run
stops) before proceeding — no skipping, no "we'll fix it later," no collapsing
two states into one word.

**Governing rules (apply to every step).**
- **Governed, not raw.** Any context that reaches Claude passes through
  `buildValidatedAgentContextBundle` → `evaluateGovernedObject`. No raw context.
- **Grounded or named.** Every claim cites agent-ready evidence, or the gap is
  stated. No silent missing evidence. No fabricated numbers/benchmarks.
- **Tenant-fenced.** Only the event's tenant's evidence participates. Any
  cross-tenant candidate is fenced and reported.
- **Promotion-only.** `committed ≠ indexed ≠ retrievable ≠ agent_ready`. Only
  `agent_ready` evidence may ground an answer.
- **Confidence is derived, never asserted.** From agent-ready coverage. Zero
  coverage ⇒ the agent refuses with `insufficient_evidence`.
- **Truth-standard reporting.** Each state reported separately: created / parsed /
  committed / indexed / retrievable / cite-verified / promoted / answerable.

**Evidence captured per step.** Inputs used, the `GroundedSourceAnswerEnvelope`
(or step-specific equivalent), citations, missing-evidence list, confidence,
pass/fail per gate, and any flaw found + fix applied.

---

## Step 0 — Originate

**What runs.** A real `source_events` row is created for the chosen tenant
(recommended: SkyHarbor AMS) via the originate path — not seeded.

**Gates (all must pass).**
- G0.1 Row persisted with `client_key` = the tenant's canonical key, `event_type`
  set, `current_stage_key` = `strategy`, `lifecycle_state` valid.
- G0.2 Reads back through `getSourcingEvent(eventId)` with the same tenant scope
  (no cross-tenant read).
- G0.3 The originating actor has a real persons row + membership (no
  `clerk:` userId fallthrough on writes).

**Flaw watch.** Operator/demo persona missing persons row → uuid write failures.

---

## Step 1 — Classify → Archetype

**What runs.** `classifySourcingEvent` → `CategoryClassification.categoryId`;
then `resolveArchetypeForEvent({ categoryId, eventType })`.

**Gates.**
- G1.1 `categoryId` is one of the 8 live categories, with auditable
  `matchReasons` (not a black box).
- G1.2 `resolveArchetypeForEvent` returns `resolved: true` with the correct
  archetype, `source: 'classifier_category'`. If the category has no shipped
  archetype, the run **stops here** (refuse, do not substitute).
- G1.3 Resolved archetype id is recorded on the run sheet.

**Currently archetype-ready categories:** `ams`, `data_ai_platform`,
`saas_renewal`. Others refuse by design until shipped.

---

## Step 2 — Intake / Evidence Readiness

**What runs.** `buildSourceEvidenceReadiness(archetype, realEvidenceStateMap)`
where the state map is read from the live data plane (NOT hardcoded).

**Gates.**
- G2.1 Each archetype required family has a real ladder state from the data
  plane.
- G2.2 `missingRequired` and `committedNotPromoted` are shown explicitly.
- G2.3 No family is reported `agent_ready` unless it genuinely passed governed
  promotion (source_basis + confidence + provenance + index + cite-render).
- G2.4 Per-stage `stageGateClear` lists hard blockers with human reasons.

**Flaw watch.** A read-model gate hiding committed data ("not loaded" when it is)
— verify the readiness map against actual rows before concluding "missing."

---

## Step 3 — Current-State Baseline

**What runs.** Baseline assembled only from `agent_ready` families
(`agentUsableFamilies`).

**Gates.**
- G3.1 Every baseline figure carries a citation to an agent-ready family.
- G3.2 Families not agent-ready are listed as gaps, not silently filled.
- G3.3 No cross-tenant evidence present.

---

## Step 4 — Sourcing Strategy

**What runs.** The archetype's `sourcingStrategyQuestions` answered via
`buildGroundedSourceAnswer`.

**Gates.**
- G4.1 Envelope: `tenantResolved` correct, `archetypeResolved` correct,
  `unsupportedClaims = []`.
- G4.2 `confidence` derived from coverage (not hardcoded). If insufficient ⇒
  refuse + name missing families.
- G4.3 Strategy is event-specific (mentions this tenant's towers/spend/etc.),
  not generic.

---

## Step 5 — RFx / RFP Design

**What runs.** `buildArchetypeRfp(archetype, readiness)` → event-specific RFP.

**Gates.**
- G5.1 RFP structure matches the archetype (e.g. AMS has service towers +
  resource-units; it is NOT the generic template).
- G5.2 Sections whose evidence is not agent-ready are marked
  `evidence_blocked` ("do NOT fabricate"), not filled in.
- G5.3 `blockedSections` reported; `complete` reflects reality.

---

## Step 6 — Vendor Engagement / Q&A Guide

**What runs.** The archetype's `vendorDiscussionGuide`.

**Gates.**
- G6.1 Questions are archetype-specific and reference real scope.
- G6.2 `doNotRevealYet` (information asymmetry) is surfaced to the operator.
- G6.3 No tenant-confidential figure is placed in a vendor-facing artifact
  unless explicitly cleared.

---

## Step 7 — Proposal Intake / Normalization

**What runs.** Received proposals modeled as governed, tenant-scoped evidence;
`normalizeProposals(archetype, proposals)`.

**Gates.**
- G7.1 Each proposal line carries a citation.
- G7.2 Excluded scope is added back at peer median and the exclusion is named
  (no hidden apples-to-oranges).
- G7.3 `bestVendor` is the normalized low bidder, with the math shown.

---

## Step 8 — Evaluation / Scoring

**What runs.** The archetype's `evaluationModel` (criteria + weights +
disqualifiers) applied to proposals.

**Gates.**
- G8.1 Weights sum to ~1; criteria match the archetype.
- G8.2 Each score cites its basis or is marked missing.
- G8.3 Disqualifiers auto-fail where triggered.

---

## Step 9 — Commercial / Pricing Analysis

**What runs.** `shouldCostModel` (if archetype expects it) + TCO comparison.

**Gates.**
- G9.1 Should-cost built bottom-up from agent-ready run-cost evidence; cited.
- G9.2 No savings % asserted without committed run-cost + should-cost.
- G9.3 Pricing traps for the archetype surfaced.

---

## Step 10 — Negotiation Strategy

**What runs.** `negotiationPlan(archetype)` + `switchingLeverage` (renewal).

**Gates.**
- G10.1 Levers sequenced by timing (pre_rfp → rfp → bafo → final).
- G10.2 Walk-away / BATNA grounded in switching-cost evidence (or marked
  unknown).
- G10.3 Asks are vendor-specific where proposals exist.

---

## Step 11 — Executive Recommendation

**What runs.** Final `buildGroundedSourceAnswer` producing the board-grade
recommendation; `evaluateDeliverableQuality` against the archetype's gate
deliverable.

**Gates.**
- G11.1 Envelope clean: specific, `unsupportedClaims = []`, citations present,
  derived confidence, no cross-tenant.
- G11.2 Deliverable clears its `qualityBar` (min sections, citations, rubric).
- G11.3 Missing evidence and confidence stated to the decision-maker — the
  recommendation is honest about what it does and does not know.

---

## Post-run

- **Contracting handoff** and **value tracking** steps follow the same gate
  discipline once 0–11 pass.
- **Truth-standard close-out:** report which states were actually reached
  end-to-end (committed → indexed → retrievable → cited → promoted → answered),
  separately — never collapsed into "done."

## Runtime wiring status (must be true before the run can be governed end-to-end)

| Wiring | Status | Needed for |
|---|---|---|
| Event → archetype resolver | **DONE** (`event-archetype-resolver.ts`, 9 tests) | Step 1 |
| Readiness bound to real `EvidenceStateMap` | TODO | Step 2 |
| `source-answer-engine` confidence → derived/governed | TODO (3 hardcoded `'high'` sites) | Steps 4, 11 |
| `buildGroundedSourceAnswer` on the live ask route | TODO | Steps 4, 11 |
| Artifact gen → `evaluateDeliverableQuality` | TODO | Steps 5, 11 |

These TODOs are done and verified **as their step is reached** during the run —
one at a time, audited, then forward. That is the plan.
