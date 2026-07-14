# 2026-07-14-meridian-active-module-context - Meridian Active Module Context Closure

## Release ID

`2026-07-14-meridian-active-module-context`

## Status

`candidate`

## Plain-English Summary

This release brings Meridian Health through the same active module-context serving path that SkyHarbor already proved. Meridian's governed enterprise profile input now contains source-backed synthetic planning facts for profile fields Home/aVa need, with explicit caveats that the values are synthetic planning-grade and not audited production facts. The canonical builder now rejects `not_provided` / `not_available` placeholders and can read array-valued profile fields. A reusable active module-context promotion proof command writes a selected tenant Active Tenant Access metadata pointer and proves Home, Intelligence, Moves, Source, and Tower can read active context without consuming candidate data by default.

## Layer Impact

- `client-data-lane`: Meridian canonical tenant input now includes governed enterprise profile fields for revenue estimate, employee estimate, operating regions, leadership roles, mission, vision, segments, and caveats.
- `global-control-lane`: The canonical build parser now handles placeholder and list-field rules consistently for all tenants.
- `global-control-lane`: The module context serving contract recognizes Meridian's Active Tenant Access record and includes a tenant-parameterized active module-context promotion/read-proof command.

## Client Applicability

- All clients: canonical placeholder and list-field parsing behavior.
- Specific clients: Meridian Health active module-context metadata proof and enriched synthetic profile input.
- Internal only: generated report artifacts under `reports/`.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `datasets/tenant-inputs/active/meridian-health/current/current-state-pack/v7/V7_01_enterprise_profile.csv`
- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts`
- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/enterprise-data/module-context-serving/__tests__/module-context-serving.test.ts`
- `src/lib/enterprise-data/active-module-context-promotion/active-module-context-promotion.ts`
- `scripts/data-build/promote-active-module-context.ts`
- `package.json`
- Regenerated canonical, candidate, and Meridian Active Tenant Access proof artifacts.

## QA / Validation

- `npm run build:canonical-tenant-data` - Pass.
- `npm run build:candidate-version` - Pass.
- `npm run audit:active-module-context-promotion -- --tenant meridian-health --slug meridian --generated-at 2026-07-14T12:00:00.000Z` - Pass.
- `npm run audit:module-context-serving` - Pass.
- `npm run audit:canonical-data-build` - Pass.
- `npm run audit:candidate-version` - Pass.
- `npm run audit:enterprise-naming` - Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` - Pass.
- `npm run release:check` - Pass.
- `git diff --check` - Pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA to Azure Container Apps. After deployment, run runtime invariant, health, and signed-in crawl proof for Home/aVa over SkyHarbor and Meridian.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR; use ACA main deploy workflow only.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required post-deploy.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home/aVa SkyHarbor + Meridian and post-deploy crawl.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA main revision. The Meridian Active Tenant Access metadata record is file-based in repo artifacts; rollback removes the Meridian slug mapping and active record from the deployed image. No production tenant data, physical tables, or module runtime behavior are mutated by this release.

## Audit Evidence

- `reports/canonical-data-build/latest/enterprise-profile-build.json`
- `reports/candidate-version-build/latest/meridian-candidate-preview.json`
- `reports/active-tenant-access/meridian/active-tenant-access-record.json`
- `reports/active-tenant-access/meridian/active-module-context-promotion.json`
- `reports/active-tenant-access/meridian/module-context-read-proof.json`

## Known Gaps

Meridian is active module-context metadata proven after this release, but live signed-in browser proof still has to run after ACA deployment. Final low-clutter Home UI polish remains separate from this data-layer closure.
