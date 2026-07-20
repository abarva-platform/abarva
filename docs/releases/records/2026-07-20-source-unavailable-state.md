# 2026-07-20-source-unavailable-state — Source-Specific Unavailable State

## Release ID

`2026-07-20-source-unavailable-state`

## Status

`candidate`

## Plain-English Summary

Source routes now have their own unavailable state. When a signed-in user opens a Source event or artifact that is not available to the current account, the page keeps the 404 tenant-safety behavior but renders Source-specific guidance instead of the old generic workspace advisor page with Moves suggestions.

## Layer Impact

- `global-control-lane` Product UI: Adds a Source segment `not-found` boundary with Source-safe copy and exits.
- `global-control-lane` Tenant safety: Preserves 404/no-enumeration behavior. The page does not reveal whether another account's Source item exists.
- `global-control-lane` Test coverage: Adds a regression that the Source fallback contains Source-specific exits and does not include the retired Moves/workspace-advisor copy.

## Client Applicability

- All clients: Applies to Source routes under `/source/*`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/not-found.tsx`
- `src/app/(maestro)/source/__tests__/not-found-source.test.ts`

## QA / Validation

- PASS — `npm test -- --runTestsByPath src/app/(maestro)/source/__tests__/not-found-source.test.ts --runInBand`
- PASS — `npx eslint src/app/(maestro)/source/not-found.tsx src/app/(maestro)/source/__tests__/not-found-source.test.ts`
- PASS — `git diff --check`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS — `npm run release:check`

## Rollout Plan

Merge through PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image. No manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a cross-account Source event URL renders the Source unavailable state without old Moves/workspace-advisor copy.

## Rollback Plan

Revert this PR. Source routes would fall back to the generic Maestro not-found state again. No data, schema, or migration rollback is needed.

## Audit Evidence

- Candidate PR and checks.
- Focused regression test.
- Post-deploy ACA runtime invariant and signed-in browser proof.

## Known Gaps

This does not add account switching UX beyond the existing sign-in route. It only fixes the Source unavailable fallback page.
