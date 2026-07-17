# 2026-07-17-meridian-home-source-row-counts — Meridian Home Source Row Counts

## Release ID

`2026-07-17-meridian-home-source-row-counts`

## Status

`candidate`

## Plain-English Summary

Home was showing refreshed Meridian source-template areas as thin because the local context browser capped source rows at 12 and excluded candidate/planning rows from default inspection. This release lets Home inspect the full refreshed source-template row set while keeping the compact first-screen display preview small.

## Layer Impact

- Release lane: `global-control-lane` for Home read/display behavior; validated with Meridian source-template content.
- Application UI: Home Context Explorer counts and Data tab rows now use the richer source-template preview when available.
- Local runtime read model: `getLocalCxoRuntimeBrowser` now keeps full source rows for inspection and only caps the small display preview.
- Governance boundary: this does not write to Postgres, promote candidates, update Active Tenant Access, or make Tower/Intelligence consume candidate facts.

## Client Applicability

- All clients: Home runtime behavior applies generally where local source-template previews are packaged.
- Specific clients: Fix is verified against Meridian / Healthcare Demo refreshed source-template counts.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/home/local-cxo-runtime.ts`
- `src/components/home/HomeSurface.tsx`
- `src/lib/home/__tests__/local-cxo-runtime.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/__tests__/local-cxo-runtime.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand` — passed.
- `npm run audit:module-context-serving` — passed.
- `npm run report:meridian-page-fact-lineage` — passed.
- Runtime sanity check confirmed Meridian Home local context rows: Applications 241, Data 242, Infrastructure 15, Budget 298, Programs 256, AI 251.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy lane. After deploy, run signed-in Healthcare Demo Home browser proof for Data tabs and counts.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared app runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home / Knowledge for Healthcare Demo.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior healthy revision. This change has no migration, write-path, or data-plane side effect.

## Audit Evidence

- Focused Jest test for Meridian source-template row counts.
- Module-context serving audit.
- Meridian page fact lineage report command output.
- Post-deploy signed-in proof to be captured before marking live-proven.

## Known Gaps

- Physical Azure/Postgres data-plane sync remains out of scope and unproven here.
- Azure AI Search retrieval/index proof remains out of scope.
- Tower and Intelligence runtime consumption of refreshed Meridian facts remains separate work.
