# 2026-08-16-active-tenant-declaration-sunset — Active Tenant Declaration Sunset

## Release ID

`2026-08-16-active-tenant-declaration-sunset`

## Status

`candidate`

## Plain-English Summary

This release narrows the active tenant declarations used by tenant-input and canonical-key code paths so they match the currently refreshed runtime layer scope. The change removes retired demo tenants from active allowlists instead of leaving them as active inputs while Layer 3 and Layer 4 proofs cover only the two current demo tenants.

## Layer Impact

- `client-data-lane`: Narrows the active tenant governance declarations that determine which tenant inputs and canonical keys are in current scope.
- Layer 1 Client Intake: `tenant-input-registry.json` now declares only the current active tenant input roots.
- Layer 3 Canonical Enterprise Model: `CANONICAL_TENANTS` now fails closed for removed tenant keys in code paths that require canonical tenants.
- Layer 4 Products: No projection shape changes. Product reads continue to consume existing refreshed Source projections.

## Client Applicability

- All clients: No.
- Specific clients: Current refreshed demo tenant scope only.
- Internal only: Yes, this is governance and validation surface cleanup.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/tenant-input-registry.json`
- `src/config/tenants/CANONICAL_TENANTS.ts`
- `scripts/verify-canonical-tenants.ts`
- Two historical dataset manifests are retained for audit continuity under `corpus_global` instead of active tenant scope.
- Focused tests for tenant compliance metadata and tenant-key aliases.
- Behavior fixtures for claim leakage, golden questions, and expert-domain matrix coverage now derive from the current active canonical tenants.

## QA / Validation

- `npm run db:verify:canonical-tenants` — passed static allowlist validation; local `DATABASE_URL` absent, so live drift check was skipped.
- `npx jest src/config/tenants/__tests__/tenant-compliance.test.ts src/__tests__/unit/tenant-keys.test.ts --runInBand` — passed, 19 tests.
- `npm run validate:context-corpus` — passed after historical retired-scope manifests were marked `corpus_global`.
- `npm run validate:context-corpus:manifests` — passed.
- `npm test -- --runTestsByPath src/lib/governance/__tests__/policy-exceptions.test.ts --runInBand` — passed, 9 tests.
- `npm test -- --runTestsByPath src/__tests__/behaviors/agent-claims.test.ts src/__tests__/behaviors/agent-golden.test.ts src/__tests__/behaviors/agent-domain-matrix.test.ts --runInBand` — passed, 36 tests.
- `npm run test:behaviors` — passed, 15 suites / 195 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge through pull request to main. The repo-owned Azure Container Apps main deploy workflow may rebuild the shared runtime because main deploys are push-triggered, but this change is a declaration/config cleanup and does not require a manual runtime route change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the deploy workflow after merge.
- ACA runtime invariant: Required if the deploy workflow runs.
- Worker image invariant: Required if worker images are rebuilt.
- Feature/env flag update path: None.
- Live signed-in proof required: No new signed-in product behavior is claimed by this release.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps main workflow if needed. No database, registry activation, tenant data deletion, or projection rollback is required.

## Audit Evidence

- Pull request URL and CI once opened.
- Local validation commands listed above.
- Post-merge deploy and runtime invariant proof if the repo-owned deploy workflow runs.

## Known Gaps

- This does not delete tenant data-plane rows or Azure resources.
- This does not perform the broader historical artifact purge from the draft sunset branch.
- Full live client drift verification requires an environment with `DATABASE_URL`.
