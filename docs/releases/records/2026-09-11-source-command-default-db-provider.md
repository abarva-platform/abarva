# 2026-09-11-source-command-default-db-provider — Source Default Governed Provider

## Release ID

`2026-09-11-source-command-default-db-provider`

## Status

`candidate`

## Plain-English Summary

The canonical Source command center now asks for the governed database projection by default. Users no longer need a diagnostic provider query parameter to land on the dense governed Source read path. Diagnostic legacy and local-provider overrides remain guarded by the existing environment flag.

## Layer Impact

Layer 4 — Products: Source route and API provider selection are updated so the product path requests the governed database projection by default. No canonical table, migration, source adapter, seed, or data-plane write is included.

## Client Applicability

- All clients: Yes, for the Source command center route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Legacy and local diagnostic overrides remain guarded by `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE`.

## Changes Included

- Source workspace route now passes `ecl_projection_db` as the default provider.
- Source workspace portfolio, contract-detail, and optimization APIs always accept the governed database provider request.
- Legacy and local CSV provider overrides remain behind the existing diagnostic override flag.
- Route/provider regression coverage for the new canonical default.

## QA / Validation

- Pass — `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand`
- Pass — `npm test -- --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' --runInBand`
- Pending — ESLint, TypeScript, release check, ACA deployment, runtime invariant, and signed-in Source proof after merge.

## Rollout Plan

Merge through pull request, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved main image. No migration, private data refresh, or feature flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source command center on the canonical route without provider query parameters.

## Rollback Plan

Revert the product-surface commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

Pull request, CI output, release-check output, ACA deployment summary, runtime invariant output, and signed-in Source command-center smoke evidence.

## Known Gaps

This release does not reload, parse, or enrich contract data. It only ensures the canonical Source route uses the already-governed database read path by default.
