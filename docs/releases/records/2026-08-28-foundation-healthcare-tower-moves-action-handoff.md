# 2026-08-28-foundation-healthcare-tower-moves-action-handoff - Tower to Moves Action Handoff

## Release ID

`2026-08-28-foundation-healthcare-tower-moves-action-handoff`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic Tower-to-Moves handoff contract for the foundation healthcare demo. When Tower has a gated value claim for a Move, the trace can now name the Move work item, owner role, next gate and evidence needed instead of only proving that Tower can read an outcome-ledger row.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: updates the Moves trace presentation and proof tooling. No database schema or source-room data is changed.

Canonical/projection layers: no change. The handoff uses existing Tower outcome-ledger rows and existing Move work-item semantics.

## Client Applicability

- All clients: no broad data-plane change.
- Specific clients: foundation healthcare demo path.
- Internal only: proof/status tooling.
- Public/demo only: yes.
- Feature flag: none.

## Changes Included

- `src/lib/programs/tower-trigger/tower-to-moves-action-handoff.ts`
- `src/lib/programs/tower-trigger/__tests__/tower-to-moves-action-handoff.test.ts`
- `src/lib/programs/cross-module-trace-view.ts`
- `src/lib/programs/__tests__/cross-module-trace-view.test.ts`
- `scripts/ecl/run_meridian_phs_moves_browser_smoke.mjs`
- `scripts/ecl/write_meridian_phs_handoff_proof.mjs`

## QA / Validation

- PASS: focused Tower-to-Moves unit test.
- PASS: cross-module trace unit test.
- PASS: Moves browser proof contract validation.
- PASS: handoff proof writer.
- PASS: script syntax checks.
- NOT-RUN: post-deploy signed-in Moves browser proof for the new trace text.
- PASS: release check.

## Rollout Plan

Merge by pull request only. The repo-owned ACA deploy workflow may deploy the updated trace route after merge. After deploy, rerun the signed-in Moves browser proof against the current digest and regenerate the demo-readiness status from the proof artifacts.

## Deployment Authority

- Repo-owned deploy workflow: required if route code is deployed.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required before claiming live proof.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Moves trace browser assertion.

## Rollback Plan

Revert the PR and redeploy the prior digest-pinned image. No schema rollback or data-plane cleanup is required.

## Audit Evidence

- Pull request and CI checks.
- Local focused test output.
- Post-deploy signed-in Moves browser proof summary.
- Regenerated demo-readiness status JSON.

## Known Gaps

This release names an owner-bound Move work item from Tower evidence. It does not perform an autonomous database write from a Tower page render.
