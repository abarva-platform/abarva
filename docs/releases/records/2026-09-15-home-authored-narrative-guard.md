# 2026-09-15-home-authored-narrative-guard — Home Authored Narrative Guard

## Release ID

`2026-09-15-home-authored-narrative-guard`

## Status

`candidate`

## Plain-English Summary

Home now keeps the reviewed executive narrative when the served evidence projection is fresh but has not published chapter-level narrative claims. The served record can refresh evidence rows, tables, provenance, and the record browser; it cannot replace reviewed executive prose with a deferred or empty narrative shell unless a published chapter-claim narrative is present.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Home presentation and bundle assembly behavior change for the governed Home route. Layer 3 records are not created, mutated, or reinterpreted.

## Client Applicability

- All clients: Yes, for tenants served through the governed Home ECL projection path.
- Specific clients: None named in this public record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL route behavior; no new flag.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`: sparse ECL bundles preserve the reviewed chapters, published generation, and story-plan state instead of manufacturing deferred narrative content.
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`: adds a guard proving sparse ECL rows preserve the reviewed executive narrative while still refreshing served evidence rows.
- `src/components/home/v4/__tests__/served-record-surface.test.tsx`: updates the served-path surface test to assert the authored executive copy is present rather than asserting a renderer fallback.

## QA / Validation

- `pass` — `NODE_PATH=$PWD/node_modules ./node_modules/.bin/jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/served-record-surface.test.tsx --runInBand` (23 tests).
- `pass` — `NODE_PATH=$PWD/node_modules ./node_modules/.bin/jest src/components/home/v4/__tests__ src/components/home/preview/__tests__ src/app/'(maestro)'/home/__tests__ --runInBand` (369 tests).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 NODE_PATH=$PWD/node_modules ./node_modules/.bin/tsc --noEmit --pretty false`.
- `pass` — `NODE_PATH=$PWD/node_modules ./node_modules/.bin/eslint src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/served-record-surface.test.tsx`.
- `pass` — Mutation check: temporarily breaking sparse ECL chapter preservation makes the new bundle guard fail.
- `blocked` — Signed-in browser proof is pending merge, deploy, ACA invariant proof, and authenticated route access.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/home?tenant=<tenant>#executive_brief` after deployment.

## Rollback Plan

Revert the merge commit and allow the repo-owned Azure Container Apps main deploy workflow to redeploy the prior Home bundle assembly behavior.

## Audit Evidence

- PR, CI run, ACA deploy workflow summary, runtime invariant proof, and signed-in Home route proof after deployment.

## Known Gaps

This fixes the narrative-layer substitution. It does not redesign the Home page formatting or C-suite visual treatment.
