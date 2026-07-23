# 2026-07-23-home-executive-cockpit-v1 — Home Executive Cockpit Replacement

## Release ID

`2026-07-23-home-executive-cockpit-v1`

## Status

`candidate — follow-up CXO polish pending merge/deploy`

## Plain-English Summary

Replaces the legacy Home knowledge page with a new executive cockpit built from the governed Home knowledge pack. The new surface is designed as a CXO context cockpit: compact navigation, executive brief, operating-model story, relationship graph, technology lens, change thesis, evidence boundary, and per-dimension drilldowns.

Follow-up correction: tightens the surface toward the supplied offline Home Enterprise Brief reference by using numbered page headers, a more compact main canvas, graph legend plus instruction callout, business-readable relationship labels, and no raw relationship IDs in the CXO graph.

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
- Follow-up polish in `src/components/home/HomeExecutiveCockpit.tsx`: section header model, relationship graph label governance, graph legend/callout, and cockpit typography sizing.

## QA / Validation

- `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeExecutiveCockpit.tsx` — passed locally.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed locally.
- `npm run release:check` — passed locally.
- `NODE_OPTIONS=--max-old-space-size=8192 npm run build` — passed locally with existing broad dynamic file-pattern warnings.
- `npx jest 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/__tests__/integration/home/home-v2-all-client-binding.test.ts' --runInBand` — passed locally with existing duplicate mock warnings.
- First deploy proof on PR #5429: Meridian and FS Demo signed-in checks passed for new cockpit presence, old tab absence, relationship graph presence, evidence rows, and Recharts cards. Visual review found raw relationship IDs still visible, so this follow-up correction is required before final acceptance.
- Follow-up local validation: eslint and full TypeScript passed; focused Home Jest passed with existing duplicate mock warnings.
- Follow-up signed-in browser proof on deployed ACA for Meridian and FS Demo — pending after merge and deploy.

## Rollout Plan

Open a follow-up PR against `main`, merge through the repository lane, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then run signed-in browser proof for Meridian and FS Demo.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Prior deployed image digest from PR #5429: `sha256:314f58a1e1ac40a7075439a0df15c2b7b5b6c71396eec16ca519760e1bacc514`.
- Prior ACA revision from PR #5429: `ca-abarva-web-lab-eastus--m5c1b1775`.
- Approved image digest: pending follow-up ACA deploy.
- ACA runtime invariant: pending follow-up ACA deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior known-good ACA image through the repo-owned deploy workflow. No schema migration is included.

## Audit Evidence

- First PR URL: https://github.com/abarva-platform/abarva/pull/5429
- First ACA revision and image digest: `ca-abarva-web-lab-eastus--m5c1b1775`, `sha256:314f58a1e1ac40a7075439a0df15c2b7b5b6c71396eec16ca519760e1bacc514`.
- First signed-in proof bundle: `/tmp/home-executive-cockpit-v1-proof/results.json`.
- Follow-up PR URL: pending.
- Follow-up CI run: pending.
- Follow-up ACA revision and image digest: pending.
- Follow-up signed-in screenshots and DOM proof: pending.

## Known Gaps

- Follow-up browser proof must confirm the new cockpit is visible for Meridian and FS Demo, relationship graph renders as a graph, old duplicate tab/page mechanics are gone, and no raw internal relationship IDs such as source keys appear in the graph.
