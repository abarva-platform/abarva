# 2026-08-30-home-architecture-system-passports — Home Architecture System Passports

## Release ID

`2026-08-30-home-architecture-system-passports`

## Status

`candidate`

## Plain-English Summary

Adds a selectable system-passport panel beneath the Home architecture run map. The architecture view now starts with conceptual business blocks, then exposes the named systems, vendors, hosting signals, costs, tiering, data movements, and evidence gaps behind each block.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Home presentation only. The change reads the existing Home architecture records and does not change intake files, source adapters, canonical tables, projections, serving views, or Azure data.

## Client Applicability

- All clients: yes, for tenants served by the Home architecture experience.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home route behavior only.

## Changes Included

- `src/components/home/v4/ArchitecturePage.tsx` adds the system-passport drilldown under the Enterprise Run Map.
- `src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx` asserts the passport and its named denominators render.

## QA / Validation

- Pass — `npx jest src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand`
- Pass — `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- Pass — `git diff --check`
- Pass — `npm run release:check -- --base origin/main --head HEAD`
- Not run — live signed-in browser proof; this requires the repo-owned deploy workflow to publish the merged change first.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow will make the presentation change live with the next approved web deployment.

## Deployment Authority

- Repo-owned deploy workflow: required for live web rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by deploy workflow.
- ACA runtime invariant: required before claiming live proof.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming live product proof.

## Rollback Plan

Revert the presentation commit or redeploy the prior approved web image. No data rollback is required.

## Audit Evidence

Inspect the PR diff, the focused Home architecture test, TypeScript validation, release check output, and any post-deploy signed-in Home screenshot captured by the deployment lane.

## Known Gaps

This slice does not regenerate Home narrative, alter admission gates, add new source data, or perform live browser proof.
