# 2026-07-15-home-tenant-story-quality — Home Tenant Story Quality Follow-Up

## Release ID

`2026-07-15-home-tenant-story-quality`

## Status

`candidate`

## Plain-English Summary

Adds stored Meridian Knowledge dimension narratives and a cross-dimension Home insight artifact so Home tells a client story instead of elevating arbitrary row samples. The Home landing now renders an executive Agent Assist brief, cross-dimension insights, a context map, readiness/evidence views, top gaps, and module readiness. Dimension Summary tabs use stored executive narratives while Data, Relationships, Gaps, and Evidence remain deterministic.

## Layer Impact

- `global-control-lane`: Updates shared Home rendering logic and registers Knowledge narrative proof commands.
- `module UI`: Home renders stored narrative/insight artifacts where available.
- `enterprise knowledge`: Adds a stored, validated Meridian narrative artifact. No data loading, canonical build, candidate promotion, Active Tenant Access update, or module runtime consumption change is included.

## Client Applicability

- All clients: Yes, all tenants using the Home Knowledge surface receive safer fallback story wording.
- Specific clients: Meridian Health receives stored dimension narratives and cross-dimension Home insights for the Agent Assist proof story.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/__tests__/HomeSurface.test.tsx`
- `src/app/(maestro)/home/page.tsx`
- `src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts`
- `scripts/knowledge/generate-knowledge-dimension-narratives.ts`
- `scripts/knowledge/audit-knowledge-dimension-narratives.ts`
- `scripts/knowledge/generate-knowledge-home-insights.ts`
- `scripts/knowledge/audit-knowledge-home-insights.ts`
- `reports/knowledge-dimension-narratives/*`
- `reports/knowledge-home-insights/*`
- `package.json`
- PR: pending.

## QA / Validation

- Pass: `npm run generate:knowledge-dimension-narratives`.
- Pass: `npm run audit:knowledge-dimension-narratives`.
- Pass: `npm run generate:knowledge-home-insights`.
- Pass: `npm run audit:knowledge-home-insights`.
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`.
- Pass: `npx jest --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`.
- Pass: `npm run audit:no-legacy-tenant-inputs`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through the protected PR path, deploy through the repo-owned Azure Container Apps main deploy workflow, verify the ACA runtime invariant and production health, then run the signed-in post-deploy crawl.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: GitHub ACA main deploy workflow only.
- Approved image digest: Not run; to be captured after deploy.
- ACA runtime invariant: Not run; required after deploy.
- Worker image invariant: Not run; required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No database, candidate version, or Active Tenant Access rollback is required because this is render-only.

## Audit Evidence

- PR URL: Not run; pending.
- ACA deploy run: Not run; pending after merge.
- Signed-in crawl: Not run; pending after deploy.
- Focused Home screenshot proof: Not run; pending after deploy.

## Known Gaps

This PR does not create deeper relationships, improve source data quality, call Claude locally, regenerate tenant data, promote candidates, or make unsupported facts true. It adds stored approved narrative artifacts and UI consumption. The existing audited Claude render path remains available for active Home summary rendering when configured, but the local proof commands did not call Claude because local Anthropic credentials are not configured.
