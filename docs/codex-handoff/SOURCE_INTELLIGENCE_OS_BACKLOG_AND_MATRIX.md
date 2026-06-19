# Source Intelligence OS — 7-Phase Backlog + d01–d33 Build-State Matrix

**Source:** spec Vol 4 (Ch16 roadmap) + Vol 3 (Ch15 deliverables) · **Verified:** 2026-06-19 (`SOURCE_INTELLIGENCE_OS_REVIEW_NOTE.md`)

> **Proof bar (Vol4 §16.1) — applies to every phase:** "done" = a live run on the ACA **private** database against a **real** sourcing event with real vendor data, the relevant Steward gate enforced, and a release record filed. Fixture/shape-conformance is never "done." The defining program risk is *"fixture-bound logic declared shipped."*

## Sequencing (forced by dependency, Vol4 §16.1)
Reasoning spine first (nowhere to put a recommendation until it exists) → evaluation before BAFO (can't negotiate what you haven't scored) → BAFO before selection (can't award what you haven't negotiated) → contract/transition operate on the award → market intelligence last (calibrates a system that must first be internally trustworthy). **Only two parallelization windows:** archetype activation can run alongside the P1 analysis/recommendation build; P5 (Contract) and P6 (Transition) both depend only on the award and may overlap. ROI is back-loaded to P3–P4 (savings first measurable at P3).

---

## Part 1 — The 7-Phase Backlog

### Phase 1 — Reasoning Spine `global-control-lane`
- **Objective:** Insert the missing reasoning layer; make the Reasoning Envelope the canonical output of every generation. *The spine the whole OS hangs on.*
- **Real seams:** `generate-from-claude/route.ts` (seam @181–185), `agent-generation/{context-binder,prompt-registry,types}.ts`; activates dormant `source-answer-engine.ts`, `classifier/category-classifier.ts`, `should-cost/should-cost-model.ts`, `delivery-model/delivery-model-gate.ts`, `proposal-normalization/proposal-normalization.ts`. New: `src/lib/source/reasoning/*`, migration `reasoning_envelopes`/`reasoning_traces`.
- **Depends on:** nothing (foundation).
- **Risks:** scope creep into the 30 unbuilt templates; grounded-refusal over-triggering; latency/cost from two new stages.
- **Success:** reasoning-trace coverage 0→100% for d01/d05/d09; archetype on 100% of new events; grounded refusal declines auditably on a real under-evidenced event; should-cost baseline carried/cited.
- **Detailed slices:** see `SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`.

### Phase 2 — Evaluation Engine `global-control-lane` (scoring) + `client-data-lane` (rater submissions)
- **Objective:** Defensible, evidence-anchored vendor scores/rankings. Replace **display-only** d16 (`scorecard.ts` is a display surface, not a scoring engine).
- **Real seams:** `scorecard.ts`, `content/source-templates/evaluation/` (d16/d17/d18 stubs), `exports/payloads/scorecard-payload.ts` (today wires neither rater submissions nor weight-change deltas). New entity `scorecard_submissions`. **Parser dependency:** `text-parser.ts` is first-mile text only — binary docx/pdf/xlsx parsing is **net-new for Source** or must reuse the Moves pipeline (`src/lib/programs/` doc-parser, `attachments/extract-text`).
- **Depends on:** P1 envelope + observability trace.
- **Risks:** scorer adoption (raters revert to spreadsheets); weight-governance disputes (sensitivity exposes fragile rankings); evidence-link gaps degrade anchoring → gate confidence on parse completeness.
- **Success:** d16/d17/d18 generate live; 100% of scores carry an evidence citation; a >N-pt deviation triggers a real re-rate; sensitivity surfaces a weight-fragile ranking; the evaluation envelope is consumed by a P4 dry run.

### Phase 3 — BAFO Engine `global-control-lane` + `client-data-lane` (vendor pricing)
- **Objective:** Capture negotiation leverage as hard dollars — the largest economic lever. Promote the fixture-bound commercial layer to a computed engine over live normalized pricing.
- **Real seams:** `pricing-normalization.ts`, `pricing-submissions/dao.ts`, `bafo-negotiation-model.ts`, `commercial-signals.ts`, `commercial-mission-adapter.ts`; renderers already exist (`exports/renderers/{pricing-comparison,bafo-question-pack}.ts`) — work is **payload→live-data binding**. New entities `vendor_proposals` (normalized), `negotiation_rounds`. **d19a/d19b/d19c are proposed net-new sub-artifacts of d19 — NOT in the 33-code canon.**
- **Depends on:** P2 scored field; P1 envelope + should-cost baseline; pricing-submissions persistence. *Most data-layer-intensive phase.*
- **Risks:** vendor non-compliance with the pricing template (→ strict structure + parse-or-reject gate); walk-away discipline as soft suggestion (→ must be system-enforced hard line); EV overconfidence pre-market-calibration (→ conservative defaults + visible caveats).
- **Success:** the structured pricing template (proposed d19a) generates + goes to real vendors; real submissions parse into the matrix; computed leverage + EV for a real finalist field; sponsor-set walk-away enforced; d20/d22/d23 generate with reasoning; savings measured vs should-cost. **First measurable ROI.**

### Phase 4 — Selection Engine `global-control-lane`
- **Objective:** Board-grade, risk-adjusted award recommendation with calibrated confidence; close the governance loop — *gates stop being advisory.*
- **Real seams:** `award-decision-view.ts`, `vendor-selection-readiness.ts`, `executive-decision-summary.ts` (replace its 3-level confidence heuristic), `commercial-risk-detection.ts`, `source-governance-enforcement.ts` (`evaluateCriterionMetReadiness`, `evaluateStagePromotionReadiness`), gate mutation route `.../gate-criteria/[criterionId]/state/route.ts`, `gate-criteria.ts` (**38 gate ids**). New entities `waivers` + gate-variance tracking. **PDF:** `render-pdf/route.ts` already returns 200 for d05/d09/d24/d27; real work = **multi-artifact ZIP bundling** + extend coverage to d25/d26/d28 + signature blocks. **Naming:** d24 is literally "Atlas Decision Brief" but must present under **Sentinel** (one-front-agent).
- **Depends on:** P2 + P3.
- **Risks:** blocking gates as adoption friction (→ ship the waiver workflow simultaneously); PDF coverage under-budgeted; recommendation confidence miscalibration (highest-consequence error).
- **Success:** a live award from evaluation+BAFO; a hard gate blocks an under-prepared advance and a waiver resolves it with audit trail; d24–d27 assemble into a board packet exported as signed PDF; confidence calibrated vs a known-good real decision.

### Phase 5 — Contract Intelligence `global-control-lane` + `client-data-lane` (contract docs)
- **Objective:** Verify the signed contract matches what was negotiated/scored (canonical catch: "tier-1 SLA in the proposal, best-effort in the contract").
- **Real seams:** `artifact-registry/upload-contract.ts` (clause-level extraction is the upgrade; today a family/format classifier), `exports/renderers/ai-clause-gap.ts` (renderer shipped, reasoning absent), `commercial-risk-detection.ts`, d25, d28. Net-new: binary-extraction stage, `ContractClauseExtractor`, `CommitmentVerification`, Contract Center surface. **Privilege:** the shipped `disclosure-flag/` classifier must tag + propagate.
- **Depends on:** P4 award + negotiated BAFO outcome.
- **Risks:** parser accuracy on legal prose (→ review-required, no auto-commit per ingestion truth standard); legal-privilege handling; false-contradiction noise (→ tune for material contradictions).
- **Success:** a real contract parsed to clauses with citations; a real SLA-vs-proposal contradiction surfaced; d28 generated; Contract Center routes a finding to legal with reasoning trace; privilege flags propagate.

### Phase 6 — Transition Intelligence `global-control-lane` + `client-data-lane`
- **Objective:** Replace fixture-derived transition readiness with a real quantitative readiness model; track KT to the point contracted value is realizable. **Closes the intake→value loop.**
- **Real seams:** `transition-readiness-view.ts` (assembles a view, doesn't compute a scored model), `commercial-mission-queue.ts`, `value-ledger.ts` (skeleton; needs indexing).
- **Depends on:** P4 award + P5 contract; may run partly parallel to P5.
- **Risks:** readiness-model gameable if KT maturity self-reported (→ anchor to evidence); post-go-live value data may be absent (→ graceful degradation); monitoring fatigue (→ tune escalation).
- **Success:** a real transition scored quantitatively; d29–d31 generate; a checkpoint slip triggers a real escalation; d32 connects ≥1 commitment to a measured outcome; lifecycle loop demonstrably closed on one real event.

### Phase 7 — Full Platform `global-control-lane` + `experimental` (market data)
- **Objective:** External market brain + portfolio-level reasoning; automate the renewal window.
- **Real seams:** `intelligence/pattern-manifest.ts`, `sentinel/orchestrator.ts` (replace string handoffs with a state machine; specialist registry replaces hardcoded-in-orchestrator builders; upgrade the 7 runtime specialists from deterministic-prose-only to model-backed/persisted), `commercial-risk-detection.ts`. New entities `vendor_profiles`, `benchmarks` + embedding infra.
- **Depends on:** all prior phases.
- **Risks:** market-data acquisition ("the one genuinely absent category" — a procurement/partnership problem); bad market data worse than none (→ gate on data-quality thresholds); coordination complexity (→ phase last).
- **Success:** a vendor profile sharpens a real leverage analysis; semantic retrieval beats keyword on a held-out set; a real renewal window detected ahead of expiry; the coordination state machine catches a real cross-agent contradiction; all 7 specialists run model-backed in production.

### Program metrics (Vol4 §16.9, all from live runs)
Reasoning-trace coverage · deliverable quality-gate pass rate (0 unsupported / 0 leaks / evidence-cited) · cycle time (intake→award) · savings captured vs should-cost (primary ROI, first at P3) · decision confidence (calibrated band from P4).

---

## Part 2 — d01–d33 Build-State Matrix (Vol 3 Ch15)

**Baseline:** 3 of 33 generate live (d01/d05/d09). The other 30 are lightweight markdown stubs under `src/content/source-templates/<cat>/dNN_*.md`. PDF route binds 4 codes (d05/d09/d24/d27); others 404.
**Modes:** A = prose-led · B = structured-payload (engine computes, renderer emits, prose narrates) · C = deterministic computation (no model) · D = hybrid.

| Code | Name | Role | Mode | State | Phase | Load-bearing |
|---|---|---|:--:|---|:--:|:--:|
| d01 | strategy memo | frame why-now/what/value/archetype/rigor | A | **LIVE** | P1 | |
| d02 | value target | quantify savings envelope to defend | A→B | stub (target: `buildShouldCostEstimate` → `{low,base,high,confidence,assumptions[]}`) | P1 | **#3** |
| d03 | archetype decision | record archetype×estate + rigor consequences | D | stub (forces `classifySourcingEvent()` live) | P1 | |
| d04 | app inventory | in-scope apps + disposition | C | stub (renderer `app-inventory-payload.ts` exists) | P2 | |
| d05 | scope memo | in/out boundary, exclusions, dependencies | A | **LIVE** | P1 | |
| d06 | exclusion log | deliberate out-of-scope + rationale | C | stub | P2 | |
| d07 | ticket synthesis | L2/L3 ticket history → demand signal | B/D | stub | P2 | |
| d08 | premortem | anticipate failure modes pre-market | D | stub (red-team/challenge model) | P1/P2 | |
| d09 | RFP pack | requirements + eval criteria + commercial template | A | **LIVE** | P1 | |
| d10 | RFI summary | market RFI → shortlist hypothesis | B | stub | P2 | |
| d11 | response checklist | completeness rubric vendors satisfy | C | stub | P2 | |
| d12 | vendor shortlist | qualified set + rationale | D | stub | P2 | |
| d13 | vendor responses | registered, parsed vendor submissions | C | stub (**net-new binary extraction**) | P2 | **#5** |
| d14 | Q&A log | vendor clarification trail | C | stub | P2 | |
| d15 | response completeness | per-vendor gap vs d11 | B | stub (renderer exists; payload fixture-bound) | P2 | **#5** |
| d16 | scorecard | consensus weighted scores + ranking | B | **display-only** (`scorecard.ts`, no scoring engine) | P2 | **#4** |
| d17 | weight log | governed criterion weights + changes | C | stub | P2 | |
| d18 | disqualification log | evidence-anchored rationale per DQ | D | stub (empty table) | P2 | |
| d19 | **pricing workbook** (`d19_pricing_workbook`) | the canonical single pricing code | B | stub | P3 | |
| *d19a* | pricing template | structured workbook vendors price into | C | **net-new sub-artifact** | P3 | **#1 (most load-bearing)** |
| *d19b* | vendor submissions | parsed, normalized vendor pricing | C | net-new sub-artifact | P3 | |
| *d19c* | pricing comparison | 8-dim apples-to-apples normalized | B | net-new sub-artifact | P3 | |
| d20 | trap log | computed pricing traps (ramps, escalators) | B/D | stub | P3 | |
| d21 | assumption set | normalization assumptions | C | stub | P3 | |
| d22 | BAFO question pack | per-finalist asks + concession ladder + walk-away | B | stub (levers seeded, not computed) | P3 | |
| d23 | BAFO round log | concession tracker: gives/gets/residual | C | stub | P3 | |
| d24 | decision brief (repo: "Atlas Decision Brief") | board-grade award rec + options | A | stub; **PDF-wired** | P4 | |
| d25 | risk attestation | named/owned/mitigated risk register | D | stub (needs PDF binder) | P4 | **#6** |
| d26 | Steward sign-off | governance attestation gates met/waived | C | stub (needs PDF binder) | P4 | **#6** |
| d27 | selection memo | defensible rationale for awarded vendor | A | stub; **PDF-wired** | P4 | |
| d28 | contract record | anchor linking award → signed contract | C | stub (anchor of Ch9 verification) | P5 | |
| d29 | transition plan | KT, parallel-run, cutover, rollback | A→B | stub | P6 | |
| d30 | checkpoint log | transition milestone tracker | C | stub | P6 | |
| d31 | KT evidence | what moved, verified by whom, gaps | C | stub | P6 | |
| d32 | value ledger | contracted commitments vs measured realization | C | stub (`value-ledger.ts` skeleton; *closes the loop*) | P6 | |
| d33 | governance review | periodic review of running engagement | D | stub | P6/P7 | |

### Load-bearing missing artifacts (ranked by leverage, Vol3 §15.8)
1. **d19a pricing template** (Mode C) — unblocks d19b/d19c/d20/d22 + the entire BAFO engine.
2. **Reasoning-envelope binding** (cross-cutting) — every output + gate reads from it. *(Phase 1.)*
3. **d02 value target** (Mode B should-cost) — unblocks d01 quality, d19c gaps, d32 variance.
4. **d16 scoring engine** (Mode B) — unblocks d18/d24/d27, the whole decision chain.
5. **d13/d15 parse-to-evidence chain** — net-new binary extraction for Source (or reuse Moves pipeline).
6. **d25/d26 PDF binders** — extend the existing 200-OK render route.

> "These six, built in order, convert roughly nine-tenths of the deliverable surface from 'stub' to 'reachable'." Note d19a–d19c are **proposed sub-artifacts of d19**, not new canon codes — the canon stays 33.
