Date: 2026-04-26
Slice: Wave-14 Source Commercial Intelligence Reconciliation
Status: done

## Scope

- Reconcile merged Wave-14 artifacts against current Source roadmap and active implementation.
- Identify overlap/duplication with existing Source modules and active event-canvas workflow.
- Recommend the next safe build sequence without adding new runtime logic or UI.

## Inputs Reviewed

- PR #340: `feat(source): Wave-14 — Source Commercial Intelligence + Pricing Hardening`
- PR #342: `chore(build): mark wave-14 merged via PR #340`
- `src/lib/source/**` Wave-14 and pre-existing Source workflow modules
- `src/components/source/**` active stage workspace and Wave-14 UI components
- `docs/build/build-slices.json`
- `docs/build/build-waves.json`
- `docs/build/production-readiness.json`
- Source trackers and cycle state docs

## Wave-14 Delivered Files and Capabilities

### Models / Read Models

- `src/lib/source/bafo-negotiation-model.ts` (`SRC11`)
- `src/lib/source/pricing-normalization-model.ts` (`SRC12`)
- `src/lib/source/commercial-risk-detection.ts` (`SRC13`)
- `src/lib/source/control-tower-signals.ts` (`SRC16`)
- `src/lib/source/intelligence-patterns.ts` (`SRC17`)
- `src/lib/source/commercial-mission-queue.ts` (`SRC18`)

### UI Components

- `src/components/source/SourceCommercialSummaryPanel.tsx` (`SRC14`)
- `src/components/source/VendorPricingComparison.tsx` (`SRC15`)

### QA / Verification

- `src/__tests__/integration/source/bafo-negotiation-model.test.ts`
- `src/__tests__/integration/source/pricing-normalization-model.test.ts`
- `src/__tests__/integration/source/commercial-risk-detection.test.ts`
- `src/__tests__/integration/source/source-commercial-summary-panel.test.ts`
- `src/__tests__/integration/source/vendor-pricing-comparison.test.ts`
- `src/__tests__/integration/source/control-tower-signals.test.ts`
- `src/__tests__/integration/source/intelligence-patterns.test.ts`
- `src/__tests__/integration/source/commercial-mission-queue.test.ts`
- `src/__tests__/integration/source/source-commercial-workflow-verification.test.ts` (`QA21`)

### Build / CI

- `.github/workflows/hygiene-gate.yml`
- `scripts/integration/hygiene_gate.sh`
- `docs/build/HYGIENE_GATE_CI_CONTRACT.md` (`OPS14`)

## Roadmap Mapping (Wave-14 vs Source Plan)

| Roadmap Area | Current Mainline State | Wave-14 Contribution | Reconciliation Decision |
|---|---|---|---|
| Scope workspace | Implemented (`SourceScopeStageWorkspace`) | No direct change | No action in this pass |
| RFP readiness | Implemented (`rfp-readiness`, panel) | No direct change | No action in this pass |
| Vendor response completeness | Implemented (`vendor-response-completeness`, panel) | No direct change | No action in this pass |
| Pricing normalization | Existing `pricing-normalization.ts` with active workflow usage | Parallel `pricing-normalization-model.ts` | Converge to one canonical normalization path before deeper UI integration |
| BAFO / negotiation | Existing `bafo-negotiation.ts` with active workflow usage | Parallel `bafo-negotiation-model.ts` | Reuse useful typed structures but avoid dual live paths |
| Commercial risk | Existing trap/risk handling inside pricing + BAFO outputs | New `commercial-risk-detection.ts` exceptions model | Promote as shared risk signal source after convergence slice |
| Executive decision summary | Implemented (`executive-decision-summary.ts`, panel) | Adds upstream commercial signal primitives | Narrow next executive work to synthesis over existing + Wave-14 signals |
| Vendor selection readiness | Planned docs, not implemented runtime | No direct selection gate runtime | Keep as next planning/model boundary |
| Control Tower signals | Not integrated in Source event canvas runtime | New `control-tower-signals.ts` | Keep deterministic and stage as integration-ready source |
| Intelligence patterns | Not integrated in active Source stage rendering | New `intelligence-patterns.ts` | Keep deterministic and stage as integration-ready source |
| Agent missions | Existing `agent-missions.ts` framework | Parallel `commercial-mission-queue.ts` | Map queue output into mission model instead of running dual mission systems |

## Overlap / Duplication Findings

### 1) BAFO duplication

- Existing active: `src/lib/source/bafo-negotiation.ts`
- Wave-14 parallel: `src/lib/source/bafo-negotiation-model.ts`
- Finding: both are deterministic BAFO builders with overlapping intent; active stage workspace currently uses `bafo-negotiation.ts`.

### 2) Pricing duplication

- Existing active: `src/lib/source/pricing-normalization.ts`
- Wave-14 parallel: `src/lib/source/pricing-normalization-model.ts`
- Finding: both normalize pricing and expose vendor comparison semantics; active workflow uses `pricing-normalization.ts`.

### 3) Mission-system duplication risk

- Existing active: `src/lib/source/agent-missions.ts`
- Wave-14 parallel: `src/lib/source/commercial-mission-queue.ts`
- Finding: both represent prioritized work queues; they should not diverge into two runtime mission authorities.

### 4) UI component non-integration

- `SourceCommercialSummaryPanel.tsx` and `VendorPricingComparison.tsx` are present and tested, but not referenced from `SourceActiveStageWorkspace` / `NexusEngagementCanvas`.
- Finding: delivered as reusable shells, not yet on active Source stage path.

## Executive Decision Summary Direction

Decision: **narrow to executive synthesis layer and reuse Wave-14 signals**.

Rationale:

- Executive decision model/panel already exists and is merged (`PR #339/#341/#343`).
- Wave-14 adds deterministic commercial signal feeds (risk exceptions, control-tower signals, patterns, mission queue) that are better treated as synthesis inputs rather than a second decision stack.
- Safest path is to preserve current executive panel behavior, then add a convergence slice that maps Wave-14 outputs into the existing executive summary contract.

Recommended posture:

- Do **not** re-open executive decision UI redesign.
- Do **not** add a second executive decision model.
- Do add explicit input adapters from Wave-14 modules into existing executive summary once convergence is approved.

## Production Readiness / Tracker Accuracy

- `docs/build/build-slices.json`: accurately records `SRC11..SRC18`, `QA21`, `OPS14` as `code_complete`.
- `docs/build/build-waves.json`: Wave-14 marked merged with expected slice set.
- `docs/build/production-readiness.json`: includes deterministic capability entries for `SRC11..SRC18`, `QA21`, `OPS14`; no overclaim to pilot/production-ready.
- Source trackers (`SOURCE_LAYERED_PROGRESS_TRACKER.md`, `SOURCE_PRODUCTION_READINESS_TRACKER.md`) and `CYCLE_STATE.md` were missing explicit Wave-14 reconciliation context; updated in this pass.

## Hygiene Gate (OPS14) Risk Review

Observed risk profile:

- Positive:
  - deterministic and non-destructive script contract
  - catches JSON parse errors, duplicate slice IDs, TypeScript errors, whitespace issues
  - clear PASS/FAIL contract in CI
- Risks:
  - build step uses `npm run build` (non-webpack), which can be sensitive in symlinked worktree environments and may fail for environment reasons unrelated to slice scope
  - conflict-marker grep carve-out for `.md` can permit marker-like strings in markdown examples; acceptable by contract, but requires reviewer discipline
  - script assumes repo is clean (`git status --short`), which can block stacked PR workflows if run locally in dirty worktrees

Recommendation:

- Keep `OPS14` as required CI gate.
- In future agent-run local validation, continue using `npm run build -- --webpack` when worktree/symlink environment is known to be brittle, while CI remains authoritative.

## Next 3 Recommended Build Slices (Order)

1. **Source Commercial Convergence Contract**
   - map `bafo-negotiation-model` + `pricing-normalization-model` + `commercial-risk-detection` outputs into the existing `executive-decision-summary` input contract
   - no new UI, no new model calls

2. **Mission Unification Adapter (Commercial Queue -> Agent Missions)**
   - deterministic adapter that projects `commercial-mission-queue` into `agent-missions` semantics
   - preserves single mission authority for Source runtime

3. **Executive Synthesis Integration Slice (No New Panels)**
   - wire converged commercial signals into existing `SourceExecutiveDecisionSummaryPanel` data path
   - keep current UI component set; no new visual surfaces

## Out of Scope Confirmation

- No new runtime models introduced in this pass
- No Source UI behavior changes
- No model/API/upload/parsing work
- No `/programs`, `/preview`, `/demo`, ProgramSurface, or `src/lib/programs/mock.ts` changes
