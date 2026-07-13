# 2026-07-13-post-deploy-crawl-active-tenants — Post-Deploy Crawl Active Tenant Alignment

## Release ID

`2026-07-13-post-deploy-crawl-active-tenants`

## Status

`candidate`

## Plain-English Summary

The post-deploy signed-in crawl now audits only active proof tenants and compares tenant identity against the visible demo names rendered by the live app. This removes retired Northstar from the standard active crawl and prevents legal-name-versus-cover-name mismatches from appearing as product P1 findings.

## Layer Impact

- `global-control-lane`: Updates crawl harness persona selection and identity expectations only.
- `internal-admin`: Improves release proof readability for operators reviewing post-deploy crawl output.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: Active proof tenants only: Apex/Retail Demo, Meridian/Healthcare Demo, First Capital/Financial Services Demo, SkyHarbor/Airline Demo, and Lakeshore Holdings.
- Internal only: Post-deploy proof harness behavior.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/persona-switcher.ts`: excludes retired Northstar from default crawl personas and maps active crawl personas to the tenant names visible in the app.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`: asserts Northstar is not in the active crawl and visible tenant identities are used.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`: updates deterministic smoke expectations to the active five-tenant crawl set.

## QA / Validation

- `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand` — Pass.
- `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts` — Pass.
- `npm run audit:enterprise-naming` — pending.
- `npm run release:check` — pending.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — pending.
- `git diff --check` — pending.

## Rollout Plan

Merge through the standard PR path. After merge, deploy through the repo-owned Azure Container Apps main workflow so the next post-deploy crawl uses the corrected active-tenant proof set.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow reports worker image checks.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, standard post-deploy crawl.

## Rollback Plan

Revert this release commit to restore the previous crawl persona set and identity expectations. No tenant data, production data, or runtime module state is mutated by this change.

## Audit Evidence

- Previous post-deploy crawl for Enterprise Profile Foundation: run `29277135995`, which completed successfully but reported P1 tenant-identity mismatches and included retired Northstar.
- Focused local validation commands listed above.

## Known Gaps

This does not remove Northstar compatibility code, historical data, tests, or archived demo references. It only removes Northstar from the standard active post-deploy crawl path.
