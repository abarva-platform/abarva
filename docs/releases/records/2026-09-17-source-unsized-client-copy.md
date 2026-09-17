# 2026-09-17-source-unsized-client-copy - Keep unknown candidate value distinct from zero

## Release ID

`2026-09-17-source-unsized-client-copy`

## Status

`candidate`

## Plain-English Summary

Source command, Contract 360, and the contract-scoped aVa answer now describe unsized actions without presenting a zero-dollar candidate total. Counted actions remain visible, while amount and finance states remain separate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: unchanged.
- Layer 4: read-only presentation of existing action-candidate and opportunity rows. No view, loader, or schema change.

## Client Applicability

- All clients using the Source command and Contract 360 surfaces.
- No tenant-specific text, authorization, or data mutation changes.

## Changes Included

- All-unsized contract lever packets state that candidate value is not established.
- The deterministic aVa lever answer avoids zero-dollar candidate and realized-value claims when no sized lever exists.
- Source command separates open actions, unsized actions, and sized actions awaiting finance; its hidden remainder no longer reports unknown amounts as zero.

## QA / Validation

- PASS: 17 focused aVa and Contract 360 tests, plus the new command behavior test.
- PASS: scoped ESLint and TypeScript.
- NOT RUN: release gate and CI pending this record.
- BLOCKED: the complete existing command-browser suite has three stale label assertions that also fail on unchanged main; not caused by this release.
- NOT RUN: deployed digest invariant and signed-in proof require merge and deployment.

## Rollout Plan

Squash-merge after CI and deploy through `.github/workflows/aca-main-deploy.yml`. Verify digest alignment and rerun the signed-in Source command, contract Optimize, and aVa answer checks.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared traffic.

## Rollback Plan

Revert this presentation change by PR; canonical data and stored approval states remain untouched.

## Audit Evidence

Focused tests, the unchanged-main comparison for existing suite failures, CI, ACA runtime proof, and signed-in acceptance readback.

## Known Gaps

An unsized signal still needs an accepted, cited calculation or comparable before it can carry candidate value. This release does not provide that evidence.
