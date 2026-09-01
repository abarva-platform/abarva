# 2026-09-01-home-ecl-deterministic-write-narrative - Home ECL Write Narrative Reproducibility

## Release ID

`2026-09-01-home-ecl-deterministic-write-narrative`

## Status

`candidate`

## Plain-English Summary

The Home ECL narrative operator now uses deterministic claim-backed chapter prose during approved writes. Plan runs can still exercise model-written prose for review, but a mutating write no longer makes a fresh chapter-synthesis call after the verified claim plan has already passed gates.

## Layer Impact

Products: Home narrative generation becomes reproducible for approved ECL projection writes.

Lane: `client-data-lane` because the operator path can write client-scoped Home projection rows after explicit approval.

Source adapters and canonical model: No change.

## Client Applicability

- All clients: Home ECL narrative operator behavior.
- Specific clients: None.
- Internal only: Operator script execution path.
- Public/demo only: None.
- Feature flag: Existing write approval environment variables still gate mutation.

## Changes Included

- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- Pass: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- Pending: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. Mutating Home ECL narrative jobs must still run through the governed ACA job path with explicit write approval variables.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by main deploy workflow after merge.
- ACA runtime invariant: Required after deployment before live proof.
- Worker image invariant: Required before operator execution.
- Feature/env flag update path: No runtime flag update.
- Live signed-in proof required: Yes, after any approved narrative write.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database migration is included in this release record.

## Audit Evidence

- PR URL after creation
- CI check output
- ACA deploy evidence after merge
- Operator plan/write logs for any approved data-plane execution

## Known Gaps

This does not add or reload product data. It only makes the approved write path deterministic after claims have passed verification.
