# 2026-06-25-tower-agent-dock-retire-static-frame — Tower AgentDock Runtime

## Release ID

`2026-06-25-tower-agent-dock-retire-static-frame`

## Status

`candidate`

## Plain-English Summary

Tower no longer serves the old standalone iframe page. The signed-in `/tower`
route now renders the React Tower workspace with the shared aVa/Atlas
`AgentDock`, so the agent is pinned in the same left-side chat shell pattern as
Intelligence, Home, Source, and Moves. The old static Tower frame routes and
assets are removed so production cannot flip back to the retired page.

## Layer Impact

- `global-control-lane`: changes the shared Tower route and removes retired
  runtime fallback files for all tenants.
- `client-data-lane`: no schema or data migration. Tower still reads the active
  tenant through the existing active-client and Tower read-model adapters.

## Client Applicability

- All clients: yes, every signed-in tenant using `/tower`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no route flag. The existing `scb_shared_engine_tower` flag still
  controls expert grounding inside the Tower answer endpoint.

## Changes Included

- Replaced `/tower` iframe rendering with `TowerIndexPage`.
- Passed active tenant Tower state into the React Tower workspace:
  initiatives, vendors, band metrics, pressure cards, Atlas observations, and
  substrate counts.
- Deleted retired static runtime paths:
  `/api/tower/v2-frame`, `/api/tower/v2-data`, `public/tower-v2`,
  `src/lib/tower-v2`, and `TowerIframeContainer`.
- Updated Tower route invariant tests to fail if iframe/static fallback returns.
- Updated Tower feature/comment references so repo checks no longer describe
  browser-side Tower as acceptable.

## QA / Validation

- PASS: `npx eslint src/app/(maestro)/tower/page.tsx src/components/tower/TowerIndexPage.tsx src/components/atlas/AtlasChatPanel.tsx src/__tests__/integration/tower/tower-invariants.test.ts src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts scripts/audit/control-plane-tenant-purity.mjs src/lib/features/registry.ts src/app/api/tower/ask/route.ts`
- PASS: `npx jest src/__tests__/integration/tower/tower-invariants.test.ts src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts --runInBand` — 2 suites, 9 tests.
- BLOCKED: `npx tsc --noEmit --pretty false` reached pre-existing dependency/type-resolution failures outside this Tower change: missing `js-yaml` declarations, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 node ./node_modules/next/dist/bin/next build` — production build compiled, type-checked, collected page data, and generated all static pages.
- PASS: `npm run release:check`
- PENDING after deploy: signed-in browser proof that `/tower` renders shared
  AgentDock, no iframe, no `/tower-v2` assets, and an ask response appears in
  the dock thread.

## Rollout Plan

Merge to `main`, build the exact main SHA image through Azure Container Apps
release path, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the
healthy main revision, then run signed-in Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy path.
- Shared runtime mutators: no local/branch/manual mutation approved.
- Approved image digest: populated at deployment.
- ACA runtime invariant: 100% traffic must point to the approved main image.
- Worker image invariant: no worker change.
- Feature/env flag update path: no flag flip required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release and redeploy the previous approved main image. No database
rollback is required.

## Audit Evidence

Pending PR, CI, ACA revision proof, and signed-in screenshots.

## Known Gaps

The richer Tower answer-quality work remains in the Tower/Atlas backend lane.
This release removes the old page and aligns the Tower agent shell; it does not
claim that every Tower advisory answer is final-quality.
