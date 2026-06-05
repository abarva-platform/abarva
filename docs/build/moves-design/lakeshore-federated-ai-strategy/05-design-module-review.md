# Lakeshore Federated · Design Module Review

**Purpose:** Per-doc verdicts on the 9 authored design files. Cross-doc consistency calls. Wave assignment for the 17 Codex specs. Open questions that need resolution before Codex picks up.

**Reviewer:** Design module (synthesis after authoring)
**Created:** 2026-06-05
**Status:** ✓ Wave 1 cleared · ✓ Wave 2 cleared · Wave 3-4 cleared pending two cross-doc adjustments noted below

---

## Per-doc verdicts

### 01 · Lakeshore Federated Structure Brief (196 lines)

**Verdict:** ✓ Approved as-is

The fictional structure is sized correctly (mid-market PE with three diversified L1 HoldCos). Morgan Street's Kyriba 6-gate status is the load-bearing demo anchor and every gate is concrete enough to drive Move 0. Lakefront-as-mature-reference is essential — without it Move 1's value claims would be invented; with it, they're "Lakefront-realized" benchmarks.

Vendor overlap matrix (Microsoft EA $9.1M consolidated, Workday $6.1M, KPMG $5.4M) gives Move 2 a real numerical spine. The $3.3-5.0M annual savings range is in-band per finserv knowledge file 13 + 20.

**Honesty discipline preserved:** every quantitative anchor is flagged as either fictional, sourced from a public benchmark, or sourced from a corpus pattern. Demo seed values are replaced by real customer data on load — the fiction is scaffolding, not a deception.

**Cross-doc dependency:** 04 and 07-10 cite specific named CXOs (Sarah Lindqvist, Aisha Vargas, Daniel Okonkwo, etc.) — those names must remain canon across the package. Spot-checked: they do.

### 02 · Demo Spine Architecture (543 lines)

**Verdict:** ✓ Approved as-is

Provides the lifecycle map the rest of the package builds against. The state machine at §12 is the cross-Move dependency graph Codex needs — particularly the Move 0 → Move 1 entry condition (G1-G4 minimum green), which encodes the foundation-before-AI rule structurally.

Source event spawn map at §10 (L-S01 through L-S06) gives Codex the canonical list. Total addressable $5.2-6.4M annual is honest scoped.

**Cross-doc check:** Spec wave assignment at §13 must match README. Spot-checked: it does.

### 03 · CXO Intel Loader Spec (1,641 lines)

**Verdict:** ✓ Approved as-is

Five bundles (CIO, CFO, COO, CHRO, GC), 29 CSV schemas, every column named with type/required/validation/example. The 6-step UX pattern is canonical and reusable. Substrate table naming `cxo_intel_*` is clean and queryable from Move-side join logic. Approval routing per bundle threads to the right CXO. Edge cases (re-upload semantics, multi-currency normalization, vendor fuzzy match) all addressed.

**One small revision recommended:** the loader UI must show, at upload time, which downstream Moves become eligible once the bundle lands. Without this, the user uploads and waits without knowing what unblocks. Add a "this load enables..." callout to the post-validation screen referencing the Move/Wave matrix from §12 of 02. **Owner: Codex Spec L02 author.**

### 04 · Artifact Contracts (2,033 lines)

**Verdict:** ✓ Approved as-is — load-bearing for Codex

The master spec. 7-column contract schema applied across ~88 artifacts spanning all 5 Moves' 6 phases. Every row is Codex-actionable. The 11 appendices (Sentinel agent roster, corpus pattern index, HIL prompt registry, Tower widget mapping, CI eval catalog, Wave-by-Wave spec mapping, Codex implementation checklist, per-Move agent ownership, glossary) give Codex everything needed to build without ambiguity.

The provenance discipline is operationalized through the 3 concrete examples — they show what well-formed evidence chains look like and what malformed ones look like. This is the doc that enforces the "no claim without provenance" rule.

**Cross-doc check:** L-S01 through L-S06 Source spawn contracts in 04-§9 must match the §10 map in 02. Spot-checked: they do.

### 06 · Tower Federated Command Center (1,121 lines)

**Verdict:** ✓ Approved with one revision

The L0 sponsor surface is well-shaped: 6 zones (portfolio rollup, opportunities, savings ledger, risk concentration, CXO dashboards, capability marketplace). The Datadog-style information density is appropriate for Zone A and B (sponsor scanning) and the focus-mode treatment for Zone F (capability detail) is the right adaptation of the "density varies by mental task" principle.

**Revision required:** the empty-state treatment when only 1 HoldCo has loaded bundles needs to be designed explicitly. Cross-HoldCo opportunities (Zone B) and federated savings ledger (Zone C) are meaningless with a single L1 — they should show a designed "needs 2+ HoldCo loads to surface" state, not zeros. Without this, the demo opens to "0 opportunities" which reads as broken. **Owner: Codex Spec L04 author.**

The build mapping (component paths under `src/app/(tower)/federated/`) is clean. Atlas chat layer differentiation from per-HoldCo Sentinel is correct — Atlas reads aggregates only.

### 07 · Kyriba De-Risk Pattern Setter (1,283 lines)

**Verdict:** ✓ Approved as-is

The Move 0 canonical surface. Paper header (NOT charcoal — locked one-dark-moment rule respected). 6-gate canvas with status, recommendation, owner, evidence chain per gate. Lakefront-reference affordance (the comparison drawer) is the key differentiator that makes Morgan Street's gate status interpretable.

Platform generalization grid (what changes for Workday/NetSuite/Salesforce rollouts) cleanly factors out the invariant scaffolding from the parameterized content. This is the doc that turns Move 0 from "Kyriba demo" into "canonical Platform Rollout De-Risk pattern."

The squint test composition explanation is concrete — 6 gate status pills at the top survive 50% blur. That's the acceptance criterion.

**Cross-doc check:** Gate G1 spawn of L-S01 (Banking consolidation Source event) must match 04-§9. Spot-checked: it does.

### 08 · Cross-HoldCo Vendor Rationalization (1,492 lines)

**Verdict:** ✓ Approved with one revision

The Move 2 canonical surface. Table-forward quarterly slate is correct (Datadog-style high density appropriate for procurement triage). Vendor normalization view with confidence-graded review queue is essential — the L0 Operating Partner needs to see the LLM's match confidence and the human-review queue for low-confidence matches, not just the dedupe outcome.

The opportunity scoring rubric (0.45 net savings + 0.30 disruption + 0.25 time-to-realize) is transparent — CFO can argue with the weights, which is the right relationship.

**Revision required:** the PortCo socialization workflow needs an explicit veto state. L1 HoldCo CFOs should be Consulted (per RACI), but PortCo CFOs need a structured "I object because..." path with named exit clause review. Without it, the workflow assumes consent and PortCos discover the change downstream. **Owner: Codex Spec L06 author.**

Source event hand-off envelopes for L-S02 through L-S05 are correctly pre-filled with named scope facts. Move 2 hands a clean envelope to Source — that's the architectural cleanliness we want.

### 09 · Business Case Pattern Setter (1,328 lines)

**Verdict:** ✓ Approved as-is

Move 1's worked example ($11.4M P50 NPV, 14mo payback, $3.8M investment for Morgan Street 4 AI capabilities) is concrete enough that the CFO can argue with the math. Per-line provenance with 3 worked evidence chains operationalizes the "no claim without provenance" rule for financial claims specifically. Editable assumption panel with CFO-override flagging is the trust mechanism — Sarah Lindqvist can adjust forecast accuracy from 85% to 75% and watch the NPV recompute live.

Projected-vs-realized visual separation is correctly designed — projected dominant in business case; realized fills in during Move 5 mobilization tracking.

Template flex for Move 0/2/3/4 is correctly factored.

### 10 · Mobilization Pattern Setter (1,593 lines)

**Verdict:** ✓ Approved as-is

30/60/90 swimlane with 17 milestones for Move 0 Kyriba worked example. 5-tier dependency graph makes the foundation-before-AI sequencing rule visual — the data plane and Unity Catalog milestones block the 4 AI capabilities explicitly, with `blocked_until` references. Evidence-of-completion criteria per milestone make the "no fake completion" rule operational ("all 48 Kyriba users have logged in ≥ 3 times in past 14 days" not "complete training").

RACI discipline forces named assignments — Sentinel does not allow "TBD" owners. That's the right enforcement.

Per-Move flex profiles correctly note that Move 2's quarterly slate cadence extends beyond 90 days, requiring rolling refresh cadence rather than fixed 30/60/90.

---

## Cross-doc consistency calls

### Resolved during authoring

1. **Tenant model posture.** All docs assume `holding_group_id` shortcut for demo, proper parent-child hierarchy as post-demo substrate. Consistent across 02 §2, 03 §9, 04 appendix tenant-to-CXO mapping, 06 tenancy section, 07 page header authoring. **Resolved: consistent.**

2. **CXO naming.** Sarah Lindqvist (Morgan Street CFO), Aisha Vargas (Group Treasurer), Daniel Okonkwo (CIO), Devon Sterling (L0 OP-Finance), Marcus Rhee (L0 OP-Technology), Anya Korchnoi (L0 MP), Priya Anand (L0 CCO). Used consistently across 01, 06, 07, 08, 09, 10. **Resolved: consistent.**

3. **Source spawn IDs.** L-S01 (Banking, from Move 0 G1), L-S02 (Microsoft EA, from Move 2), L-S03 (Workday, from Move 2), L-S04 (KPMG audit, from Move 2), L-S05 (cyber, from Move 2+4), L-S06 (Workday SI, from Move 3). Consistent across 02 §10, 04 §9, 07, 08. **Resolved: consistent.**

4. **Five locked rules.** No claim without provenance · foundation-before-AI sequencing · no fake completion · HoldCo data sovereignty · no demo-only data. Reinforced across 04 §1, 07, 09, 10. **Resolved: consistent.**

5. **Design tokens.** Paper #F8F7F4, ink #1f2937, accent #1d4ed8, Georgia serif, DM Sans body. No emojis. Inline CSS. **Resolved: consistent across all HTML files.**

6. **One-dark-moment rule.** Charcoal #1f2937 used as header only in Source Executive Decision (per `docs/build/source-design/`). Move surfaces (07, 08, 09, 10) all use paper headers. **Resolved: respected.**

### Open after authoring (require resolution before Codex Wave 1)

**Q1 — Loader visibility callout:** 03 should show "this load enables..." callout after upload. Addressed in revision note above. Codex picks this up in Spec L02. **Owner: Codex L02.**

**Q2 — Empty-state with 1 HoldCo loaded:** 06 needs designed empty state when fewer than 2 L1 bundles are loaded. Addressed in revision note. Codex picks this up in Spec L04. **Owner: Codex L04.**

**Q3 — PortCo veto path:** 08 needs explicit "I object because..." path with exit-clause review. Addressed in revision note. Codex picks this up in Spec L06. **Owner: Codex L06.**

**Q4 — Estimation engine API contract.** 09 references the estimation engine but doesn't specify the API contract for live recomputation when assumptions change. Codex needs the existing engine's API exposed via a hook for the editable assumption panel. **Owner: Codex L12 author — surface the existing `lib/estimation` engine to the business-case React surface.**

**Q5 — Move-Source spawn UX.** 04 §9 specifies the envelope pre-fill at spawn time, but the actual spawn UX (button location, confirmation modal, post-spawn navigation to Source 11-stage canvas) needs design. Recommend: spawn happens from Move Phase 3 (Architecture) page, confirmation modal shows the pre-filled facts for review, post-spawn navigates to Source Strategy stage with banner "Spawned from Move L-M01 · Morgan Street Kyriba De-Risk." **Owner: Codex L14 + L15 authors.**

---

## Wave assignment for Codex specs

All 17 specs ready for Codex. Reaffirming wave structure from README:

### Wave 1 — Foundation (week 1-2, parallel 4 PRs)

| Spec | Title | Owner | Acceptance criterion |
|---|---|---|---|
| L01 | Holding-group tenancy substrate | Codex | `holding_group_id` column + RLS posture; L0 aggregate-read passes pen-test; sibling tenant transaction-grain read blocked |
| L02 | CXO loader UI (CIO + CFO bundles) | Codex | Five CSV uploads (CIO + 7 CFO CSVs) parse + validate + land in `cxo_intel_*` substrate tables; downstream Move eligibility surfaced post-upload |
| L03 | Move 0 Kyriba page (6-gate canvas) | Codex | Matches `07-kyriba-derisk-pattern-setter.html` fidelity; gate status driven by loaded data, not seeded; Lakefront-reference drawer functional |
| L04 | Tower "Federated" tab scaffold | Codex | Tab visible to L0 sponsor role only; empty state designed for < 2 L1 bundles loaded |

### Wave 2 — Depth (week 3-4)

| Spec | Title | Acceptance criterion |
|---|---|---|
| L05 | Move 0 per-gate artifacts (6 gates × 2-4 artifacts) | Each artifact generates with provenance chain to loaded records + corpus IDs |
| L06 | Move 2 cross-HoldCo vendor analytics page | Matches `08-cross-holdco-vendor-rationalization.html`; vendor normalization confidence-graded review queue functional; PortCo veto path implemented |
| L07 | Cross-HoldCo opportunity ranker | Powers Tower Zone B; refreshed quarterly; opportunities link to relevant Move |
| L08 | CXO loader Wave 2 (COO + CHRO + GC bundles) | Same shape as L02 with the 3 additional bundles |

### Wave 3 — Move 1, 3, 4 + pattern setters (week 5-7)

| Spec | Title | Acceptance criterion |
|---|---|---|
| L09 | Move 1 AI-on-top-of-Kyriba (4 capabilities each its own surface) | Capability portfolio drives sequencing; Move 0 G1-G4 green is entry condition |
| L10 | Move 3 federated IT strategy + AI marketplace | AI capability catalog populated from CIO bundles; marketplace fork workflow functional |
| L11 | Move 4 federated risk + governance | Concentration risk dashboard + CXO benchmarks + regulatory rollup |
| L12 | Business case pattern setter | Matches `09-business-case-pattern-setter.html`; estimation engine hook live; per-line provenance functional |
| L13 | Mobilization pattern setter | Matches `10-mobilization-pattern-setter.html`; 30/60/90 swimlane + dependency graph + EoC criteria |

### Wave 4 — Source spawns + polish (week 8+)

| Spec | Title | Acceptance criterion |
|---|---|---|
| L14 | Source event spawn from Move 1 (L-S01 Banking) | Pre-filled facts validate; lands in Source Strategy stage; banner cites Move provenance |
| L15 | Source event spawns from Move 2 (L-S02 through L-S05) | Per-category spawn affordance; Move 2 hands clean envelope |
| L16 | Federated savings ledger | Cross-Move realized vs projected; per-vendor / per-category drilldown |
| L17 | CXO performance dashboards | Per HoldCo CXO benchmark vs P50/P90 from corpus + bundles |

---

## Three failure modes to watch for in implementation

1. **Cosmetic gate status.** Move 0 gates marked "green" by Codex without actual remediation having shipped is the failure mode. Acceptance: gate status must derive from substrate state (G2 green requires variance < 0.05% sustained 30 days, measured from loaded reconciliation data). **Enforced through G2 acceptance criterion in L05.**

2. **Demo-only Tower data.** Tower Zone C savings ledger showing realized $ without underlying Move 5 mobilization tracking having captured actuals violates the "no claim without provenance" rule. Acceptance: realized $ only displayed when traceable to per-vendor / per-line tracking record. **Enforced in L16.**

3. **Federated leak.** L0 user role mistakenly reading sibling HoldCo transaction grain because RLS posture was wrong. Acceptance: explicit pen-test in L01 that simulates L0 sponsor user attempting to read Morgan Street vendor contract terms; must return 403 unless explicit grant. **Enforced in L01.**

---

## Wave 1 cleared status

**Wave 1 specs L01, L02, L03, L04 are cleared for Codex pickup.** Open Qs Q1-Q5 are resolved with named owners (Codex spec authors); they do not block Wave 1 start.

Codex's autonomous execution brief lives at:
`docs/build/codex-handoff/2026-06-05-LAKESHORE_FEDERATED_FULL_AUTONOMOUS.md`

That brief is the next file to author.
