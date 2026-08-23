# 2026-08-23-source-ecl-query-provider-qa — Source ECL Query Provider QA Gate

## Release ID

`2026-08-23-source-ecl-query-provider-qa`

## Status

`candidate`

## Plain-English Summary

Adds a guarded Source workspace query override for browser QA. When the server environment explicitly allows it, an operator can load the Source workspace from ECL projection tables for one request without switching the whole shared Source workspace to that provider.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 / Canonical Enterprise Model: no schema, migration, or data mutation. The route reads existing ECL projection rows only when the guarded override is used.
- Layer 4 / Products: Source workspace gets a controlled proof path for ECL-backed browser QA. Default product behavior is unchanged unless the existing provider environment flag is also changed.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: none.
- Internal only: Source ECL route/browser QA.
- Public/demo only: none.
- Feature flag: `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE=true`.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- pass — `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand`
- pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- pass — `npm run release:check`

## Rollout Plan

Merge through pull request. The guarded query override remains inactive until the runtime explicitly sets `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE=true`. Browser QA can then request `sourceProvider=ecl_projection_db` for a single signed-in Source workspace proof without globally replacing the default provider.

## Deployment Authority

- Repo-owned deploy workflow: required for standard main deployment.
- Shared runtime mutators: required only to enable `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE=true`.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deployment and after any environment flag update.
- Worker image invariant: not affected.
- Feature/env flag update path: use a controlled ACA update with the current digest-pinned image.
- Live signed-in proof required: required before claiming Source is browser-proven on ECL projection data.

## Rollback Plan

Unset `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE` or revert this release. Because the override is off by default and request-scoped when enabled, rollback does not require data rollback.

## Audit Evidence

- Focused tests must show DB projection loading can be selected by explicit override.
- Route test must show the query override is ignored unless the explicit environment flag is enabled.
- ACA runtime invariant must be captured before any live browser proof claim.

## Known Gaps

This release does not perform live browser QA, mutate Azure data, deploy routes by itself, or claim signed-in proof.
