# 2026-07-14-home-qa-fix-legacy-language — Home Legacy Version-Language Cleanup

## Release ID

`2026-07-14-home-qa-fix-legacy-language`

## Status

`candidate`

## Plain-English Summary

Home smoke/content QA found a non-blocking P2 cleanup class: old version-language such as V4, V6, or V7 appeared inside served Home records. This release normalizes the module-context presentation payload so Home and aVa receive business-readable records while raw source lineage, fingerprints, source paths, and audit evidence stay in the dedicated evidence and lineage structures.

## Layer Impact

- `global-control-lane`: this changes the shared module-context serving presentation contract for all clients that consume Home context.
- Module context serving contract: presentation fields in `ModuleContextRecord` are filtered and normalized before being served to modules.
- Home/aVa read path: Home and Home aVa no longer receive legacy migration labels in primary record titles, summaries, or fields.
- Evidence and lineage: unchanged. Evidence references, lineage paths, fingerprints, source snapshots, candidate IDs, and active access metadata remain available for diagnostics and audit.

## Client Applicability

- All clients: Yes. Applies to all registry-active tenants that read Home context through the module context serving contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/enterprise-data/module-context-serving/__tests__/module-context-serving.test.ts`

## QA / Validation

- `npm run audit:home:content-quality` — Pass; 6 tenants, 42 dimensions, 210 tabs, 0 P0 / 0 P1 / 0 P2.
- `npm run smoke:home:full` — Pass; 6 tenants, 42 dimensions, 210 tabs, 10 aVa prompts, 0 P0 / 0 P1 / 0 P2.
- `npm run qa:home:ava-quality` — Pass; 6 tenants, 42 dimensions, 210 tabs, 10 aVa prompts, 0 P0 / 0 P1 / 0 P2.
- `npm run audit:module-context-serving` — Pass; 22 tests passed.
- `npm run audit:active-candidate-separation` — Pass.
- `npm run audit:enterprise-naming` — Pass.
- `npm run audit:architecture-rules` — Pass.
- `npx tsc --noEmit --pretty false --incremental false --project tsconfig.json` — Pass.
- `git diff --check` — Pass.
- `npm run release:check` — Pass.

## Rollout Plan

Merge to `main` through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image after merge. No manual data build, promotion, or tenant data mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: resolved by ACA main deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: required by ACA main deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Home smoke/content QA and available signed-in Home/aVa browser proof

## Rollback Plan

Revert the PR. Rollback restores the prior module-context presentation behavior. Because this release does not mutate tenant data, write production records, promote candidates, or change Active Tenant Access, rollback is code-only.

## Audit Evidence

- Pull request: pending
- Home smoke/content QA report: `reports/home-smoke-quality/latest/`
- Home smoke/content QA proof zip: pending
- ACA deploy evidence: pending after merge

## Known Gaps

Browser proof remains limited to tenants with available signed-in automation personas. Server/module-context proof remains the all-tenant coverage mechanism until every active tenant has a dedicated browser persona.
