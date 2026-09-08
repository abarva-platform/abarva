# 2026-09-08-source360-contract-drilldown-test-contract — Source 360 Contract Drilldown Test Contract

## Release ID

`2026-09-08-source360-contract-drilldown-test-contract`

## Status

`candidate`

## Plain-English Summary

Source 360 now has a regression check that locks the Contract 360 drilldown tab set to the approved workspace design contract. The check ensures opened contract rows expose Story, Scope, Economics, Performance, Relationship, Evidence, and Optimize, while excluding unrelated mockup tabs that are not part of the implemented contract detail surface. The release also repairs a TypeScript-only browser timer type mismatch in the staged Source workspace hydration path.

## Layer Impact

Release lane: `global-control-lane`

Layer 4/product surface and test coverage only. The runtime Source workspace behavior is unchanged; the timer update aligns TypeScript with the browser timer handle used by the staged hydration path. No tenant data, schema, adapters, canonical objects, read models, assistant grounding, or data-build jobs are changed.

## Client Applicability

- All clients: Yes, for the shared Source 360 workspace implementation.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `npm run release:check` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through PR, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Required after deploy before claiming live.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Route smoke only; no tenant data behavior changes.

## Rollback Plan

Rollback the web runtime to the prior ACA image digest if the Source workspace route fails to load after deployment. Revert the test update if it proves inconsistent with the approved Source 360 design contract.

## Audit Evidence

- PR URL and checks.
- Focused Source 360 browser-surface Jest output.
- Post-deploy ACA runtime invariant.

## Known Gaps

Signed-in product proof for the intended demo tenant still requires that tenant's authenticated browser session.
