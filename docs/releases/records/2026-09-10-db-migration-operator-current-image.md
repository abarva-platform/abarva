# 2026-09-10-db-migration-operator-current-image — Migration Operator Current Image Restore

## Release ID

`2026-09-10-db-migration-operator-current-image`

## Status

`candidate`

## Plain-English Summary

The private operator wrapper now restores the operator job to the same digest-pinned image used for the execution unless a caller explicitly provides another idle image. The governed lab migration workflow also runs the exact Moves current-state schema verifier after applying migrations, so the run reports table-level readiness for the upload/review path instead of relying only on a broad database summary.

## Layer Impact

Release lane: `internal-admin`.

Operations layer: hardens the private operator job restore behavior used by governed migration and verification runs.

Layer 4 product proof: adds an exact post-migration readback for the Moves current-state tables required by the live upload/review path.

## Client Applicability

All clients indirectly benefit from safer shared lab migration proof. No client data is changed by this release candidate.

## Changes Included

- `.github/workflows/db-migration-lab.yml`
- `scripts/ops/submit-aca-operator-job.mjs`
- `scripts/ops/__tests__/submit-aca-operator-job.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath scripts/ops/__tests__/submit-aca-operator-job.test.ts`
- PASS: `node scripts/ops/submit-aca-operator-job.mjs --image acrabarvalab001.azurecr.io/abarva/web@sha256:0000000000000000000000000000000000000000000000000000000000000000 --script db:verify:moves-current-state-schema --container db-migrate --out-dir /tmp/abarva-operator-plan --plan-only`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR. No web runtime deployment is required for the workflow/script behavior to take effect in GitHub Actions, but future operator jobs should run against the digest-pinned image resolved from the live web app.

## Deployment Authority

- Repo-owned deploy workflow: not required for this workflow/script-only change.
- Shared runtime mutators: governed migration workflow uses the existing private operator wrapper.
- Approved image digest: resolved by the migration workflow from the live Container App.
- ACA runtime invariant: unchanged by this PR.
- Worker image invariant: operator restore now preserves the execution digest by default.
- Feature/env flag update path: none.
- Live signed-in proof required: no, but the targeted synthetic Moves smoke depends on this proof path.

## Rollback Plan

Revert the PR. Any interrupted operator job can be restored by rerunning the wrapper with the intended digest-pinned image and `/bin/true` idle command.

## Audit Evidence

- PR diff and CI result.
- Operator wrapper plan-only test output.
- Follow-up governed migration apply run output.

## Known Gaps

This candidate does not apply database migrations. It only hardens the workflow and operator wrapper used to apply and verify them.
