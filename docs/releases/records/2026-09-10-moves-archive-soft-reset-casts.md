# 2026-09-10-moves-archive-soft-reset-casts — Harden Move Archive Metadata Update

## Release ID

`2026-09-10-moves-archive-soft-reset-casts`

## Status

`candidate`

## Plain-English Summary

The operator archive script now casts metadata values explicitly when retiring Move artifacts during a soft archive. This prevents PostgreSQL from rejecting the update because string parameters inside `jsonb_build_object` have no inferred type.

## Layer Impact

- `internal-admin`: The change affects the operator-only Move archive/reset utility used for controlled workspace resets.
- `client-data-lane`: The script can update tenant-scoped Move archive state when explicitly executed through the governed operator path.

## Client Applicability

- All clients: The script behavior is shared when an approved operator archive run is executed.
- Specific clients: None.
- Internal only: Yes, this is operator tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ops/archive-existing-moves.ts`: casts soft-archive artifact metadata parameters to concrete PostgreSQL types.

## QA / Validation

- Pass: `npx tsx scripts/ops/archive-existing-moves.ts --self-test --out-dir /tmp/archive-existing-moves-self-test-20260910T165441Z`.
- Pass: `npx eslint scripts/ops/archive-existing-moves.ts`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Not run yet: operator archive run after merge/deploy.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the updated image, then run the approved operator archive job using the digest-pinned image. No migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none from this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: verify the web revision and operator job use the deployed digest before live proof.
- Worker image invariant: the private operator job should restore to the same digest-pinned image used for the execution.
- Feature/env flag update path: none.
- Live signed-in proof required: no, but the downstream smoke run is live and signed in.

## Rollback Plan

Revert this script-only change and redeploy. Any archive run that already committed remains an auditable data-plane update and should not be reversed without a separate governed decision.

## Audit Evidence

- PR URL: pending.
- Local validation: pending.
- Deploy run: pending.
- Operator run: pending.

## Known Gaps

This does not change archive policy, retention policy, or any purge behavior.
