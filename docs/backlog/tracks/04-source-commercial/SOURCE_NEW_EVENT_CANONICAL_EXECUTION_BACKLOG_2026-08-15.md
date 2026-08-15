# Source New Event Canonical Execution Backlog

## Status

`active-control`

## Purpose

This is the current execution backlog for bringing New Event to the intended
best-in-class sourcing product. It replaces scattered handoff notes as the
working order for the next implementation slices.

The operating question for every slice is simple:

- What does the user need to do now?
- Where are they in the 11-stage process?
- What evidence or insight did AbarVa create that improves the sourcing
  decision or strengthens vendor leverage?

## Current Proof Register

### Closed

1. Dormant panel cleanup
   - PR: `#6349`
   - Merge commit: `11300c4a9d95b01577547e264ea545667a9e1cd0`
   - Scope: unreachable Source presentation panel only.
   - Latest deployed main containing this change: `fd8380a304d6bf3e8885328d4934e01352a933cc`.
   - ACA deploy proof: `31892068923`.
   - Post-deploy crawl proof: `31892493437`.
   - Product caveat: this cleanup did not change a reachable Source workflow
     surface, so the crawl is runtime coverage, not a stage UX proof.

2. Proof lane default smoke scope
   - PRs: `#6363`, `#6366`.
   - Deployed proof SHA: `58a697259c5b28756ce51cbba3ee1c7ee7766973`.
   - ACA deploy proof: `31891161508`.
   - Post-deploy crawl proof: `31891515211`.
   - Atlas gauntlet proof: `31891539660`.
   - Result: `12/12` default-scope turns passed, `0` fallback turns, `0` tenant
     leak turns, `2/2` default-scope tenant sessions passed.
   - Caveat: this proves the provisioned default smoke scope only. The excluded
     active-client membership repair is still open and must not be implied as
     passed.

### Open

1. `SRC57` New Event journey smoke expansion
   - Status: in progress.
   - Scope: testing-only expansion of the active Source canvas proof surface
     across all 11 canonical New Event stages.
   - Acceptance: local smoke, Source layout CI, release check, PR, and separate
     deploy/runtime evidence before any live product claim.

2. Excluded active-client proof repair
   - Backlog ID: `SRC-PROOF-002`.
   - Status: open hard-gated follow-up.
   - Required action: classify, preview, apply, and independently read back any
     auth or membership repair before running the opt-in gauntlet path.
   - Hard gate: do not mutate production auth/data membership without explicit
     operator classification, command preview, and readback proof.

3. Backlog consolidation
   - Backlog ID: `SRC-BACKLOG-001`.
   - Status: closed by `#6368`.
   - Acceptance: one ranked backlog with dependencies, owner lane, proof bar,
     demo impact, and explicit exclusions.

## Execution Principles

- Build in demo-impact order after proof control.
- Keep one writer per surface or contract.
- Prefer small PRs with one proof claim each.
- Do not mix UI simplification, parser substrate, persistence, and live
  membership repair in one slice.
- PR checks, deploy, runtime invariant, crawl, and signed-in product proof are
  separate evidence states.
- Any production upload/parser ingestion, workflow persistence, approval
  automation, vendor dispatch, schema migration, or auth/member mutation remains
  a hard human gate.

## Ranked Execution Backlog

| Rank | ID | Slice | Demo impact | Owner lane | Dependencies | Proof bar |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `SRC57` | Expand the 11-stage signed-in smoke harness | Very high | QA/deploy | Current Source shell | Local smoke, deploy, runtime invariant, signed-in screenshots/DOM proof for affected stages |
| 2 | `SRC58` + `SRC59` | Implement the clean stage operating model and evidence requirement registry | Very high | UX workflow + Evidence | `SRC48`, `SRC57` | Stage rail, local substeps, required/optional evidence rows, done checks, disabled/enabled forward action |
| 3 | `SRC60` + `SRC49` | Build vendor response package readiness and parser substrate | Highest | Evidence + Response intelligence | Evidence registry, governed context policy | Long proposal package contract, vendor isolation tests, parser/readiness states, no raw unvalidated context to models |
| 4 | `SRC50` | Evidence-bound first-pass evaluation scoring | Highest | Response intelligence | `SRC49`, rubric contract | Score eligibility, citations, holds, evaluator override, no uncited score claims |
| 5 | `SRC51` | Pricing normalization and commercial trap engine | Highest | Commercial leverage | `SRC49`, accepted scope baseline | Comparable TCO, assumptions ledger, trap log, workbook citation where available |
| 6 | `SRC52` | Clarification and BAFO squeeze workflow | Very high | Commercial leverage | `SRC50`, `SRC51` | Vendor-specific asks, concession ledger, human dispatch gate, value states separated |
| 7 | `SRC53` | Durable approval gate and evidence acceptance | High | Governance | `SRC48`, `SRC49` | Persisted acceptance, approver, rationale, exceptions, downstream reopen behavior; migration/RLS proof if schema changes |
| 8 | `SRC54` + `SRC55` | Guidebook operating system and client-ready artifacts | High | Guidebook/artifacts | `SRC48`, `SRC49`, `SRC53` | Guidebook coverage, accepted-evidence artifact generation, DOCX/PDF visual QA where exports are produced |
| 9 | `SRC56` | Transition-to-Value realization proof | High | Governance + Value | `SRC52`, `SRC53`, `SRC55` | Committed vs realized value ledger, finance/evidence status, no booked savings without accepted proof |
| 10 | `SRC47` | Operator-safe event archive and stale fact cleanup | Medium | Governance hygiene | Operator scope approval | Pre/post fact counts, stale flags, blob archive proof, no canonical vendor/contract mutation |

## Next 8-Step Execution Lane

The next continuous job should execute these eight steps incrementally:

1. **Smoke spine first:** expand `SRC57` so every later UI or workflow slice has
   before/after evidence.
2. **Scope reference implementation:** use Scope as the first production-quality
   stage for `SRC58` + `SRC59`: left rail position, local substeps, evidence
   rows, done checks, and one forward action.
3. **Generalize to all 11 stages:** apply the Scope pattern stage-by-stage only
   after the smoke spine can catch layout and navigation regressions.
4. **Responses readiness:** finish the vendor response package contract so users
   know exactly how many proposal/pricing files are required per vendor and
   which attachments are conditional.
5. **Proposal intelligence:** parse response packages into cited completeness,
   exceptions, assumptions, and clarification needs.
6. **Evaluation and pricing intelligence:** ship evidence-bound scoring and
   comparable pricing/trap detection.
7. **BAFO and approval governance:** convert gaps into asks, track concessions,
   and persist approval/evidence acceptance behind the proper hard gates.
8. **Artifacts and Value handoff:** generate client-ready packs and preserve the
   trail from negotiated commitment to realized value proof.

## Explicit Exclusions For The Next Slice

The next slice should not do any of the following unless it is separately
approved in that slice:

- schema migrations,
- workflow persistence changes,
- live upload/parser ingestion,
- production auth/member mutation,
- vendor message dispatch,
- automated approval decisions,
- data-plane writes,
- deletion or irreversible cleanup.

## Agent Lane Map

| Lane | Primary responsibility | First safe task |
| --- | --- | --- |
| A - UX workflow | Stage rail, local substeps, active canvas, continue gate | `SRC57` screenshot targets and `SRC58` Scope reference |
| B - Evidence | Requirement registry, file states, accepted/done status | `SRC59` stage evidence contract |
| C - Response intelligence | Proposal packages, completeness, citations, score eligibility | `SRC60` parser-readiness contract |
| D - Commercial leverage | Pricing normalization, traps, BAFO asks | `SRC51` trap-to-ask model after response evidence is available |
| E - Governance | Approvals, exceptions, persistence, hard gates | `SRC53` design and migration plan only until approved |
| F - Guidebook/artifacts | Stage facilitation and client-ready outputs | `SRC54` guidebook coverage matrix |
| G - QA/deploy | Tests, PR checks, deploy, runtime/crawl/product proof | `SRC57` proof pack and status reporting |

## Done Definition

This backlog item is done when:

- this file is linked from the Source Commercial track backlog,
- the execution tracker points to this file as the canonical current backlog,
- the proof register names what is closed and what remains excluded/open,
- validation confirms docs/release control consistency, and
- a PR records the consolidation without claiming new runtime behavior.
