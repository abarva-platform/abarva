# 2026-07-17-moves-current-state-structured-ingest-errors — Moves Structured Evidence Commit Feedback

## Release ID

`2026-07-17-moves-current-state-structured-ingest-errors`

## Status

`candidate`

## Plain-English Summary

Moves current-state structured CSV ingest now reports the real row-level commit blocker when parsed rows cannot be written to the canonical backing table. This prevents the P1 readiness path from returning a silent `422` with `errors: []` when systems or org-structure evidence parses successfully but fails to commit.

## Layer Impact

- `global-control-lane`: Shared Moves current-state ingest behavior for all tenants.
- `data/control boundary`: No new data source is introduced. The change keeps the existing canonical `tower_*` backing-table contract and makes failed writes observable to the operator/API caller.

## Client Applicability

- All clients: Yes, for Moves current-state structured CSV upload families.
- Specific clients: The live proof target is the disposable Meridian healthcare Agent Assist Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/current-state-ingest.ts`
  - structured commit functions now return commit errors alongside commit counts;
  - CMDB lifecycle/criticality inputs are normalized to the table check constraints before upsert;
  - evidence-ledger insert failures are included in the returned error list.
- `src/lib/programs/__tests__/current-state-ingest.test.ts`
  - regression coverage for row-level commit errors;
  - regression coverage for CMDB enum normalization.

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/current-state-ingest.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/current-state-ingest.ts src/lib/programs/__tests__/current-state-ingest.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in Meridian P1 structured evidence retry after deploy.

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image. After deploy, rerun the signed-in Meridian P1 structured evidence upload and confirm systems/org evidence either commits or returns an explicit actionable commit error.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Pending main deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous main image through the repo-owned ACA deploy workflow. No migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Focused regression output: local Jest pass, 16 tests.
- Live proof bundle: `/Users/anand/Downloads/moves-p0-p5-proof-2026-07-17/`

## Known Gaps

This release does not apply database migrations or change the canonical backing-table contract. If the live retry exposes missing table/permission/schema drift, that must be handled as a separate data-plane operations fix.
