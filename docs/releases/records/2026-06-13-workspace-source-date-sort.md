# 2026-06-13-workspace-source-date-sort — Source Workspace Explorer timestamp safety

## Release ID

`2026-06-13-workspace-source-date-sort`

## Status

`candidate`

## Plain-English Summary

Fixes a production-only Source Workspace Explorer crash seen in the SkyHarbor proof run. The Source workspace read model now sorts audit timestamps safely whether the data-plane adapter returns ISO strings or JavaScript `Date` objects. The fix does not change any Source generate, approve, advance, upload, or download route contract.

## Layer Impact

- `global-control-lane`: Hardens the flag-gated Source Workspace Explorer surfacing adapter.
- `global-control-lane`: Keeps the Workspace Explorer read model tolerant of Azure/Postgres timestamp shapes without changing stored data or API payloads.

## Client Applicability

- All clients: no behavior change while `workspace_explorer_source` remains default off.
- Specific clients: tenants allowlisted for `workspace_explorer_source`, including SkyHarbor lab proof tenants, receive the safer workspace render path.
- Internal only: not applicable.
- Public/demo only: not applicable.
- Feature flag: `workspace_explorer_source`.

## Changes Included

- Adds timestamp normalization before sorting Source workspace items.
- Adds a mapper regression test for `Date` timestamps returned from the live data-plane adapter.

## QA / Validation

- PASS: `npx jest src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts --runInBand`.
- PASS: `npx eslint src/lib/workspace-explorer/source-adapter-mapping.ts src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run audit:architecture-rules` reported 0 violations.
- PENDING: `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED until deploy: live SkyHarbor Source workspace proof. Current production revision `m36afb9bf` still carries the timestamp crash; proof resumes after this fix is merged and deployed.

## Rollout Plan

Merge through PR and standard CI, then build and deploy the new Azure Container Apps image. No database migration or feature-flag change is required.

## Rollback Plan

Revert the PR. Tenants can also be removed from `ABARVA_FEATURE_WORKSPACE_EXPLORER_SOURCE_TENANTS` to hide the Source workspace route immediately while preserving the rest of the release.

## Audit Evidence

- ACA log excerpt from revision `m36afb9bf` showed `TypeError: (b.audit.updatedAt ?? b.audit.createdAt ?? "").localeCompare is not a function` in `source-adapter-mapping`.
- Regression test covers a registry artifact with a `Date` `updatedAt` value.

## Known Gaps

This release only fixes Source workspace timestamp sorting. It does not add SkyHarbor airline Function Pack coverage, does not fabricate Moves board artifacts, and does not complete the converged Moves proof.
