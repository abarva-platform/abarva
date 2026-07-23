# 2026-07-23-home-executive-cockpit-v1 — Home Executive Cockpit Replacement

## Release ID

`2026-07-23-home-executive-cockpit-v1`

## Status

`candidate`

## Plain-English Summary

Replaces the legacy Home knowledge page with a new executive cockpit built from the governed Home knowledge pack. The new surface is designed as a CXO context cockpit: compact navigation, executive brief, operating-model story, relationship graph, technology lens, change thesis, evidence boundary, and per-dimension drilldowns.

## Layer Impact

- `global-control-lane`: changes the shared Home route and client-visible Home UX for approved knowledge packs.
- Home read model: continues to read approved Home packs from the existing Postgres-first loader with JSON fallback, then renders the approved pack through the new cockpit component.
- Client-visible rendering: removes the old approved-pack surface from the Home route and uses business-readable labels instead of source mechanics.

## Client Applicability

- All clients: active tenants with an approved Home knowledge pack.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeExecutiveCockpit.tsx`

## QA / Validation

- `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeExecutiveCockpit.tsx` — passed locally.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed locally.
- `npm run release:check` — passed locally.
- `NODE_OPTIONS=--max-old-space-size=8192 npm run build` — passed locally with existing broad dynamic file-pattern warnings.
- `npx jest 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/__tests__/integration/home/home-v2-all-client-binding.test.ts' --runInBand` — passed locally with existing duplicate mock warnings.
- Signed-in browser proof on deployed ACA for Meridian and FS Demo — pending after merge and deploy.

## Rollout Plan

Open a PR against `main`, merge through the repository lane, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then run signed-in browser proof for Meridian and FS Demo.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior known-good ACA image through the repo-owned deploy workflow. No schema migration is included.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision and image digest: pending.
- Signed-in screenshots and DOM proof: pending.

## Known Gaps

- Browser proof must confirm the new cockpit is visible for Meridian and FS Demo, relationship graph renders as a graph, and old duplicate tab/page mechanics are gone.
