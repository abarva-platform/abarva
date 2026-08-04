# 2026-08-03-source-v4-loader-reconcile-cast — Source v4 Loader Reconcile Cast

## Release ID

`2026-08-03-source-v4-loader-reconcile-cast`

## Status

`candidate`

## Plain-English Summary

Fixes the Source v4 lab canary loader reconciliation SQL by explicitly casting tenant, schema, and dataset parameters used inside dynamic PostgreSQL `format(...)` calls.

## Layer Impact

- Release lane: `client-data-lane`.
- Source adapters: fixes canary loader reconciliation after rows and views are created.
- Canonical model: no canonical model change.
- Products: no product UI or runtime read path change.

## Client Applicability

- All clients: no.
- Specific clients: synthetic demo tenant operator validation only.
- Internal only: yes.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- `scripts/source/load-skyharbor-v4-lab-canary.mjs`

## QA / Validation

- Pass: `node --check scripts/source/load-skyharbor-v4-lab-canary.mjs`
- Pass: `npm run source:v4:lab-canary:job -- --plan-only --out-dir /tmp/skyharbor-source-v4-lab-canary-reconcile-cast-plan-20260804T030350Z`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not-run: ACA operator apply. It requires this patch to be merged and deployed first.

## Rollout Plan

Merge to main and allow the repo-owned ACA main deploy workflow to publish the updated image. Retry the Source v4 lab canary operator apply using the digest-pinned image from that deploy.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Data-plane mutator: subsequent ACA operator job only.
- Live signed-in proof required: no product page consumes these canary views yet.

## Rollback Plan

Revert the patch to restore the prior reconciliation SQL. If a canary operator job has already run, rollback of the database canary schemas remains the same: drop `raw_source_v4` and `consumption_v4_canary` or remove rows for the synthetic demo dataset.

## Audit Evidence

- PR URL and merge commit.
- Local plan-only job.
- ACA main deploy run.
- Subsequent ACA operator proof bundle.

## Known Gaps

- This patch does not add Cube semantic promotion over the v4 canary views.
