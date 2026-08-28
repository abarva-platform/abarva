# 2026-08-28-foundation-healthcare-tower-moves-action-handoff - Tower to Moves Action Handoff

## Release ID

`2026-08-28-foundation-healthcare-tower-moves-action-handoff`

## Status

`deployed-live-proven`

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
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/meridian-phs-demo-readiness-status.json`

## QA / Validation

- PASS: focused Tower-to-Moves unit test.
- PASS: cross-module trace unit test.
- PASS: Moves browser proof contract validation.
- PASS: handoff proof writer.
- PASS: script syntax checks.
- PASS: post-deploy signed-in Chrome proof on the live Moves trace route confirmed the new Tower-to-Moves action handoff text and next gate text render on the deployed default path.
- PASS: demo-readiness status regeneration preserves the live trace proof and marks the old generated Moves narrative artifact as not consumed by live Strategic Moves routes.
- PASS: release check.

## Rollout Plan

Completed by pull request and repo-owned ACA deploy workflow. Signed-in Chrome proof was captured against the deployed default Moves trace route after the traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: required if route code is deployed.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: passed in repo-owned deploy workflow run `33154382972`.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Moves trace browser assertion.

## Rollback Plan

Revert the PR and redeploy the prior digest-pinned image. No schema rollback or data-plane cleanup is required.

## Audit Evidence

- Pull request and CI checks.
- Local focused test output.
- ACA deploy workflow run `33154382972`.
- Post-deploy signed-in Chrome proof on `https://app.abarva.ai/strategic-moves/7d86b833-ca27-5fec-b105-ed6f74aaf884/trace`.
- Screenshot: `/tmp/meridian-phs-moves-trace-live-after-2cd59c31-20260828.png`.
- Screenshot SHA-256: `e647cda295c1d4c8b67b9192765be0af9323aefacf2a7babe279280121a6460f`.
- Regenerated demo-readiness status JSON.

## Known Gaps

This release names an owner-bound Move work item from Tower evidence. It does not perform an autonomous database write from a Tower page render.
