# 2026-07-23-home-enterprise-brief-replica — Home Enterprise Brief Replica

## Release ID

`2026-07-23-home-enterprise-brief-replica`

## Status

`candidate`

## Plain-English Summary

Replaces the old Home Enterprise Brief presentation with a brand-new executive cockpit modeled on the approved offline reference. The experience now reads like a compact CXO briefing surface: a Mac-style explorer rail, tenant-first executive header, section tabs, human-readable metrics, a strategy tension view, proof lanes, and a leadership sequence instead of raw row/node/edge counts.

## Layer Impact

- `global-control-lane`: Home UI rendering changes for the shared enterprise brief component.
- `data/read-model`: No schema, migration, or data mutation. The page continues to read the existing governed Home knowledge pack and derived relationship data.
- `client-visible UX`: All tenants using the Home Enterprise Brief component receive the new layout.

## Client Applicability

- All clients: Yes, for tenants rendered through the Home Enterprise Brief component.
- Specific clients: Not tenant-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this PR.

## Changes Included

- `src/components/home/HomeEnterpriseBriefApp.tsx`: new reference-style cockpit layout, simplified explorer rail, executive-read tabs, narrative snapshot blocks, and polished responsive styling.
- Follow-up scale polish: tighter dashboard density, smaller executive typography, non-clipping wrapped section tabs, and narrower explorer rail after signed-in visual inspection.

## QA / Validation

- Pass: `npx prettier --check src/components/home/HomeEnterpriseBriefApp.tsx docs/releases/records/2026-07-23-home-enterprise-brief-replica.md`
- Pass: `npx eslint src/components/home/HomeEnterpriseBriefApp.tsx`
- Pass: `git diff --check`
- Pass: `npx jest 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/lib/home/__tests__/read-derived-relationship-graph.test.ts' --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`
- Blocked locally: signed-in browser proof against `localhost:3001/home`; production Clerk storage states redirect to `/sign-in` on localhost. Live signed-in proof remains required after ACA deploy before calling this live-proven.
- Pass after first deploy: signed-in production screenshots for Meridian and FS Demo/First Capital confirmed `/home`, tenant header, explorer rail, section tabs, and no raw row/node/edge/fact-count language.

## Rollout Plan

Merge through PR, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA, then verify the live Home page with signed-in browser proof for Meridian and FS Demo/First Capital first.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before live acceptance.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR to restore the previous Home Enterprise Brief component presentation. No data rollback is required because this PR does not mutate packs, tables, or Azure data layers.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5471
- CI: To be added after PR validation.
- ACA revision/digest/traffic: To be added after deploy.
- Browser screenshots: To be captured for Meridian and FS Demo/First Capital.

## Known Gaps

This PR does not regenerate Claude-authored Home packs, alter Postgres schemas, or populate missing tenant data. It only changes how the existing governed Home pack is presented.
