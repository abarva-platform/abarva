# 2026-07-17-moves-p5-terminal-db-contract — Moves P5 Terminal DB Contract

## Release ID

`2026-07-17-moves-p5-terminal-db-contract`

## Status

`candidate`

## Plain-English Summary

Moves P5 terminal approval now respects the production database contract. P5 handoff returns `newPhase: 6` to route the UI to Tower, but it no longer writes `engagements.current_phase = 6`, which violates the `0..5` phase constraint. The Move remains at P5 with `lifecycle_state = completed`, an approved P5 snapshot, audit log, signed gate deliverables, and Tower handoff visibility.

## Layer Impact

- `global-control-lane`: Shared Moves phase-gate approval behavior and Tower handoff read-model behavior.

## Client Applicability

- All clients: Yes. This affects any Move that completes P5.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a terminal P5 handoff write path that inserts an approved P5 `phase_snapshots` row.
- Marks the Move `lifecycle_state = completed` while keeping `current_phase = 5`.
- Records terminal handoff in `module_state_log`.
- Keeps the API response contract as `newPhase: 6` and `terminalHandoff: true` so the UI can still route to Tower.
- Updates Tower handoff reads to use completed P5 rows instead of impossible `current_phase = 6` rows.
- Adds regression tests for the terminal handoff DB contract and Tower handoff query.

## QA / Validation

- Pass: `npx jest src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/lib/data-plane/read-adapters/__tests__/tower-page-read-adapter.test.ts --runInBand`
- Pass: `npx eslint 'src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts' src/lib/data-plane/read-adapters/towerPageReadAdapter.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/lib/data-plane/read-adapters/__tests__/tower-page-read-adapter.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pending: `npm run release:check` after this release-record update.
- Pending: signed-in Meridian P4/P5 resume smoke through Tower after deploy.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then rerun the signed-in disposable Meridian Move smoke from P5 approval to Tower.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Existing P5 snapshots and completed lifecycle rows remain audit evidence; the rollback only restores the prior P5 approval behavior.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Live proof bundle: Pending.

## Known Gaps

This does not claim realized Tower value. It only fixes the terminal handoff contract so P5 can complete and Tower can see completed handoff Moves.
