# 2026-07-30-home-knowledge-foundation-api-tenant - Foundation Knowledge API Tenant Pin

## Release ID

`2026-07-30-home-knowledge-foundation-api-tenant`

## Status

`candidate`

## Plain-English Summary

The Home Knowledge HTTP consumption APIs now resolve an approved Foundation proof
tenant before falling back to the generic active-client tenancy path. This keeps
the product shell and the server API bound to the same validated Foundation
tenant and continues to ignore browser-supplied tenant keys.

## Layer Impact

- Release lane: `global-control-lane` with a Foundation proof tenancy scope.
- CLIENT INTAKE: No intake templates or source data change.
- SOURCE ADAPTERS: No adapter behavior changes.
- CANONICAL MODEL: No schema, migration, canonical object, or publication
  change.
- PRODUCTS: Home Knowledge API tenancy resolution changes for Foundation proof
  sessions only.

## Client Applicability

- All clients: No broad client tenancy change.
- Specific clients: Foundation proof tenants using Home Knowledge.
- Internal only: No.
- Public/demo only: No public route exposure change.
- Feature flag: No new flag.

## Changes Included

- `src/app/api/knowledge/consumption/_shared.ts`
- `src/app/api/knowledge/consumption/__tests__/_shared.test.ts`

## QA / Validation

- PASS: `npx jest src/app/api/knowledge/consumption/__tests__/_shared.test.ts --runInBand`
- PASS: `npx jest src/app/api/knowledge/consumption/__tests__/_shared.test.ts src/lib/auth/__tests__/foundation-preview-session.test.ts src/components/knowledge/__tests__/knowledge-shell-smoke.test.tsx src/lib/knowledge/consumption-client/__tests__/activation-guard.test.ts --runInBand`
- PASS: `npx eslint src/app/api/knowledge/consumption/_shared.ts src/app/api/knowledge/consumption/__tests__/_shared.test.ts`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false --project tsconfig.json`
- PASS: `npm run release:check`

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy
workflow builds and deploys the digest-pinned web image. No database migration
or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home Knowledge route plus consumption API
  tenant proof.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data
rollback is required.

## Audit Evidence

- PR URL and CI run after publication.
- Focused Jest regression output.
- Live signed-in Home Knowledge proof bundle after deployment.

## Known Gaps

This release does not create new Knowledge projections, activate baselines, or
promote source data. It only fixes the Foundation proof tenant used by
consumption API reads.
