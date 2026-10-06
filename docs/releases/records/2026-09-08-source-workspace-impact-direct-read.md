# 2026-09-08-source-workspace-impact-direct-read — Source Workspace Impact View Direct Reads

## Release ID

`2026-09-08-source-workspace-impact-direct-read`

## Status

`candidate`

## Plain-English Summary

The Source workspace full-impact refresh now reads the prebuilt impact views through the same alias-aware access path used by the governed Source readers. This avoids an unnecessary canonical-only initial query before reading already-loaded impact rows.

## Layer Impact

- Layer 4 PRODUCTS, lane `global-control-lane`: changes the Source workspace server read path for impact panels and aVa grounding payloads. It does not change schemas, records, calculations, or client-owned records.

## Client Applicability

- All clients: Source workspace impact reads use the alias-aware query path.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing Source workspace provider selection remains unchanged.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`: Source impact view readers now use direct alias-aware queries.
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`: adds/updates coverage for the direct impact read path.

## QA / Validation

- PASS: `npm test -- portfolioAdapter.ecl.test.ts --runInBand`
- PASS: `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- PASS: `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- PASS: `npm test -- page-tenant-routing.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/data-model/read-adapter.ts src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## Rollout Plan

Merge through pull request, then activate through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required before live-proof claim
- Worker image invariant: required before live-proof claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, Source workspace load timing and content integrity

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request URL and CI checks.
- ACA deployment artifact with image digest, revision, traffic, health, and runtime invariant.
- Signed-in Source workspace network proof comparing the full-impact request time with the previous baseline.

## Known Gaps

The deferred payload size remains a separate optimization opportunity. This release only removes the extra initial query path for full impact views.
