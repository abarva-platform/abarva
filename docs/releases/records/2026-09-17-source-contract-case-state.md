# 2026-09-17-source-contract-case-state - Expose persisted case position

## Release ID

`2026-09-17-source-contract-case-state`

## Status

`candidate`

## Plain-English Summary

Contract detail shows the persisted optimization case state, accountable owner, and next action in a compact status line. When no case exists, it says so instead of inferring one from opportunity rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: unchanged. No schema, loader, or tenant-data mutation.
- Layer 4: existing case read projected into the Source contract page.

## Client Applicability

All clients using governed Source contract optimization reads. No tenant-specific exception.

## Changes Included

- Map the persisted case record into the Source view model.
- Show a concise case status and next action across Contract 360 tabs with an Optimize navigation action only when relevant.
- Keep absence of a case explicit; do not promote a candidate opportunity into an approval or opened case.

## QA / Validation

- PASS: focused rendered behavior tests for present and absent case states.
- PASS: TypeScript, scoped ESLint, and diff whitespace check.
- Pending: CI, ACA digest invariant, and signed-in acceptance.

## Rollout Plan

Squash-merge after CI; deploy through the repository-owned ACA main workflow. Verify the case line on a case-backed contract and its absence state while signed in.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may change shared traffic.

## Rollback Plan

Revert this read/presentation change by PR and deploy through the same workflow. Case records remain unchanged.

## Audit Evidence

Focused test output, PR checks, ACA runtime-invariant artifact, and signed-in acceptance notes.

## Known Gaps

The signed-in case-thread acceptance check and governed correction of source timing prose remain separate gates.
