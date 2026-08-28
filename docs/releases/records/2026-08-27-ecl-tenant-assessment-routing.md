# 2026-08-27-ecl-tenant-assessment-routing — ECL Tenant Assessment Routing

## Release ID

`2026-08-27-ecl-tenant-assessment-routing`

## Status

`candidate`

## Plain-English Summary

ECL product readers now resolve the dense assessment id from the selected tenant before querying serving views. This lets secondary proof tenants read their own loaded ECL assessment instead of looking for the primary proof tenant's assessment rows.

The product browser smoke also treats the healthcare demo-finding assertions as scoped to the healthcare fixture. Secondary proof tenants are still checked for ECL-backed routes and named serving surfaces, but they are not failed for not rendering healthcare-specific findings.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 products: Home preview, Tower preview diagnostics, Intelligence preview diagnostics, and the ECL product browser proof harness.
- Data layers: no schema, loader, source-room, projection, serving-view, or Azure data mutation.
- Runtime access: no product access grant changes and no tenant-isolation weakening.

## Client Applicability

- All clients: no.
- Specific clients: active ECL proof tenants with dense ECL assessments loaded.
- Internal only: no.
- Public/demo only: no.
- Feature flag: uses the existing ECL product provider and default route behavior.

## Changes Included

- `src/lib/ecl/denseAssessment.ts`
- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/intelligence/eclContextPackPreview.ts`
- `src/lib/tower/eclProjectionPreview.ts`
- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- Reader and proof-harness regression tests.

## QA / Validation

Pass:

- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/lib/intelligence/__tests__/eclContextPackPreview.test.ts src/lib/tower/__tests__/ecl-projection-preview-degrades.test.ts --runInBand`

Post-merge proof required:

- Repo-owned ACA main deploy.
- Tenant-scoped ECL product live proof for the secondary proof tenant.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow publishes the updated readers and proof harness. After deployment, run the tenant-scoped ECL product live proof against the default routes.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: unchanged.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: yes, after deployment for the affected proof tenant.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy lane. Loaded data remains unchanged by rollback.

## Audit Evidence

Inspect the PR, release gate output, the ACA deploy run, and the tenant-scoped ECL product live proof run after deployment.

## Known Gaps

Healthcare demo-finding assertions remain scoped to the healthcare fixture until a separate finding specification exists for secondary proof tenants.
