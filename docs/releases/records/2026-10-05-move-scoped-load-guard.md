# 2026-10-05 — Preserve tenant-pinned load approval

## Release ID

`2026-10-05-move-scoped-load-guard`

## Status

`candidate`

## Plain-English Summary

Adds a regression test proving that a Move-registry manifest cannot use the generic dataset load-approval path. That path continues to require a manifest pinned to the tenant being loaded. No new authorization or data-loading capability is introduced.

## Layer Impact

- **Layer 3 — Canonical Enterprise Model:** no records or schemas change.
- **Release lane:** `global-control-lane` — the test protects the shared dataset-governance boundary against accidental removal.
- **Layer 4 — Products:** no product behavior changes.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: CI regression protection.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a focused test for the `move_registry` manifest case in `resolveLoadApproval`.
- Adds this release record.
- No route, loader, migration, manifest, or data change.

## QA / Validation

- `npx jest src/lib/governance/__tests__/dataset-manifest.test.ts --runInBand` — 61 tests passed.
- Mutation check: temporarily removing the tenant-equality guard made the new test fail; restoring the guard returned the suite to green.
- `npx eslint src/lib/governance/__tests__/dataset-manifest.test.ts` — no errors; one pre-existing unused-variable warning remains in the file.
- `npm run release:check -- --base origin/main --head HEAD` — all 11 gates passed.

## Rollout Plan

No runtime rollout. The regression test runs in CI with the governance unit suite.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; no runtime code changed.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; this change does not alter user-visible behavior.

## Rollback Plan

Revert the test and this record together. No database or runtime rollback is required.

## Audit Evidence

- Focused test output and mutation result are recorded in the PR discussion.
- [PR #9061](https://github.com/abarva-platform/abarva/pull/9061); CI checks are in progress.

## Known Gaps

This guard does not implement Move-scoped load authorization. A separate, persisted authorization bound to tenant, program, dataset, source hash, count, method, audience, expiry, and idempotency remains required before any Move-scoped evidence load.
