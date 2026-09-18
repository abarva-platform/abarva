# 2026-09-18-source-stage09-workspace-value-authority — Workspace Annual-Value Authority

## Release ID

`2026-09-18-source-stage09-workspace-value-authority`

## Status

`candidate`

## Plain-English Summary

Source workspace Story and contract-book displays now use the stated Contract 360 annual value before any resolved extraction value. When those values disagree, the workspace no longer silently substitutes the resolved value into annual-value ledes, focused contract rows, vendor rollups, or Story copy. This is an incremental Stage 09 read-path guard only; it does not correct source data or declare a reconciled baseline.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source workspace presentation now shares one contract-book annual-value helper for Story and workspace shell display paths.

Layer 3 Canonical Enterprise Model: no schema, data, migration, or canonical record change.

## Client Applicability

- All clients: applies to Source workspace display logic wherever the shared workspace shell is used.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/contractPopulations.ts`
- `src/app/(maestro)/source/preview/workspace/contract360Ledes.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- Focused tests for the shared annual-value helper and Story lede.

## QA / Validation

- Red-first verification: the Story lede test failed on current code with `annual_value = 43.5M` and `resolved_annual_value = 44.0M`, rendering `$44.0M` instead of the stated Contract 360 value.
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/contract360Ledes.test.ts' --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/contractPopulations.test.ts' --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.evidence.test.tsx' --runInBand`
- Mutation proof: temporarily restoring resolved-first helper order failed both focused annual-value guards.

## Rollout Plan

Merge by PR to `main`, then use the repo-owned Azure Container Apps main deploy workflow. No migration, data-build job, tenant-data write, feature flag, or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none.
- Approved image digest: pending repo-owned deploy.
- ACA runtime invariant: pending repo-owned deploy readback.
- Worker image invariant: pending repo-owned deploy readback.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for Story/workspace annual-value display acceptance.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required because no data was changed.

## Audit Evidence

- PR URL: pending.
- Merged SHA: pending.
- ACA digest/runtime invariant: pending.
- Focused local test and mutation outputs from this candidate branch.

## Known Gaps

This does not reconcile source records, apply migrations, run a data-build job, prove Azure row parity, or complete signed-in Story/Economics/Optimize/aVa/export acceptance. It only prevents this workspace display path from selecting a resolved extraction amount ahead of the stated Contract 360 annual value.
