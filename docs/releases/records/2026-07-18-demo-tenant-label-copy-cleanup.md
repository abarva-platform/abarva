# 2026-07-18-demo-tenant-label-copy-cleanup — Demo Tenant Label Copy Cleanup

## Release ID

`2026-07-18-demo-tenant-label-copy-cleanup`

## Status

`candidate`

## Plain-English Summary

This change standardizes user-facing demo tenant labels so financial-services demo surfaces say `FS Demo` and airline demo surfaces say `Airline Demo`. It does not change tenant keys, aliases, data loading, candidate promotion, or the default runtime context reader.

## Layer Impact

`global-control-lane`: updates display copy in public, admin, Learn, Source, and program-origination surfaces.

`internal-admin`: updates seeded demo Clerk `clientName` metadata from the old financial-services display name to `FS Demo`.

`public-demo`: updates hardcoded canonical-answer copy so generated responses use `FS Demo` when the financial-services demo answer key applies.

## Client Applicability

- All clients: No.
- Specific clients: FS Demo and Airline Demo display surfaces only.
- Internal only: Admin proof and quality pages receive the same label cleanup.
- Public/demo only: Investor/platform demo copy is affected.
- Feature flag: None.

## Changes Included

- `src/app/investors/page.tsx`
- `src/app/(maestro)/platform/page.tsx`
- `src/app/(maestro)/platform/admin/approvals/page.tsx`
- `src/app/(maestro)/platform/admin/data-governance/page.tsx`
- `src/app/(maestro)/platform/admin/quality/page.tsx`
- `src/app/(maestro)/admin/data-layer-explorer/page.tsx`
- `src/app/api/admin/seed-clerk-metadata/route.ts`
- `src/app/api/chat/agent/route.ts`
- `src/components/home/learn/WelcomeSection.tsx`
- `src/components/programs/origination/StewardChat.tsx`
- `src/components/source/SourceOriginatePage.tsx`
- `src/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel.tsx`

## QA / Validation

- PASS: targeted source scan confirmed remaining `First Capital` and `SkyHarbor` hits in `src/app` and `src/components` are comments or code identifiers, not page display copy.
- PASS: `git diff --check`.
- PASS: `npm run audit:enterprise-naming`.
- PASS: `npm run release:check`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`.

## Rollout Plan

Merge through a normal GitHub PR. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting `main` image. No database migration, no data-plane load, and no tenant context promotion are included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved main deploy workflow.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Standard main deploy workflow invariant.
- Feature/env flag update path: None.
- Live signed-in proof required: Helpful for protected surfaces if a valid Clerk session is available; public health/revision proof is required either way.

## Rollback Plan

Revert this PR and let the main deploy workflow publish the previous label copy. Because no schema, data-plane, or tenant promotion changes are included, rollback is code-only.

## Audit Evidence

Use the PR diff, validation command output, ACA deploy run, deployment evidence artifact, and post-deploy health/browser checks.

## Known Gaps

Historical comments, code identifiers, route names, aliases, and tests may still contain `First Capital` or `SkyHarbor` where those terms are operationally meaningful rather than page display labels.
