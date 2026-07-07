# 2026-06-21-scb-workforce-economics-engine — Workforce economics compute engine (first slice)

## Release ID

`2026-06-21-scb-workforce-economics-engine`

## Status

`candidate`

## Plain-English Summary

Builds the first real slice of the in-product Workforce Economics compute engine — the "estimate-twice" capacity model (TRADITIONAL delivery vs AI-NATIVE delivery) from `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md`. Previously only an external workbook existed; this puts the WE-2 formula in code as a pure, deterministic, unit-tested function with a typed contract. It is a CAPACITY model (FTE/effort/cost), not effort-compression hand-waving: AI-native is cheaper because agents are subscription-priced parallel capacity and humans are billed only for time worked. Honesty discipline mirrors the existing estimate model — planning-grade confidence, agent capacity as a planning RANGE with a conservative haircut, named drivers, explicit "not a quote" caveats. **Additive + dormant: a new pure module, not yet wired into the Move generate path.**

## Layer Impact

- **global-control-lane (additive, dormant):** a new `src/lib/workforce-economics/` module (contract + pure compute function) + tests + a design note. No existing file changed; nothing consumes it yet.

## Client Applicability

- All clients: No runtime change — new pure module, uncalled.
- Specific clients: None.
- Internal only: Yes — build-time engine code.
- Public/demo only: No.
- Feature flag: None yet (the brief reserves `moves_workforce_economics`, default OFF, for the wiring slice).

## Changes Included

- `src/lib/workforce-economics/workforce-economics.ts` — typed contract (`WorkforceEstimateInput` / `WorkforceEstimateTwice` / `WorkforceScenario` / `WorkforceDelta` / `WorkforceAssumptions`) + pure `computeWorkforceEstimate(input)` (deterministic; throws on structurally-invalid scope rather than emitting a fabricated number).
- `src/lib/workforce-economics/__tests__/workforce-economics.test.ts` — 13 tests pinned to the workbook's worked example.
- `src/lib/workforce-economics/DESIGN_NOTE.md` — Moves binding + the remaining WE-1..WE-5 work.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean. Tests 13/13: asserts the workbook traditional anchor ($1.71M) and blended rate ($131.31/hr) exactly, AI-native strictly cheaper and not slower, agent cost < human cost, productivity ≈3.0×, delta consistency, populated honesty block, determinism, and the input guards. Honest discrepancy documented: the brief's narrative AI-native point (~$0.72M/2.4×) differs from the formula's deterministic output on the literal workbook inputs (~$0.58M/3.0×); the formula is the contract, so tests assert the formula + directional guarantees, flagged for reconciliation during WE-1.

## Rollout Plan

Merge to `main` (dormant). Follow-on (per the design note): WE-1 substrate port (diffable constants), WE-3 wire `move-business-case.ts` to consume the estimator (ROI/payback/NPV), WE-4 roadmap durations, WE-5 register WE deliverables behind `moves_workforce_economics` + live ACA proof on a real Move at P1.

## Deployment Authority

Not applicable to this merge — additive pure module, uncalled.

- Repo-owned deploy workflow: `aca-main-deploy` ships the code; nothing calls it.
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow.
- ACA runtime invariant: module present but inert.
- Worker image invariant: n/a.
- Feature/env flag update path: `moves_workforce_economics` (later wiring slice).
- Live signed-in proof required: Yes — at the Move-binding + flag step, not this merge.

## Rollback Plan

Revert the PR — deletes the uncalled module. No data/migration.

## Known Gaps

- First slice only: not wired into Moves; rates are hand-fed in tests (real rate-card substrate port is WE-1); no UI yet.
- AI-native worked-example point needs reconciliation with the brief narrative (documented).

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-workforce-engine` → `main`.
- CI: `npm run release:check`, tsc clean, engine tests 13/13 (workbook anchor matched).
