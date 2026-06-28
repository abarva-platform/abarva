# 2026-06-28-tower-cxo-story-lineage — Tower CXO Story And Budget Rollup Lineage

## Release ID

`2026-06-28-tower-cxo-story-lineage`

## Status

`candidate`

## Plain-English Summary

Tower now leads with a CIO/CFO story instead of a cluttered strip of disconnected dashboard labels. The overview tells five governed stories: value realization, spend defensibility, vendor leverage, AI spend reality, and the trust/gap frame. The Tower server grounding path also preserves real budget-rollup fields when materialized initiative rows exist, so loaded YTD, run/change, and OpEx/CapEx values are not erased by initiative-derived fallback rollups.

## Layer Impact

- `global-control-lane`: Updates the shared Tower UI and dashboard route behavior for every tenant that uses the Tower surface.
- `client-data-lane`: Updates the Tower grounding assembly so client-specific budget rollups remain available alongside materialized Tower initiatives.

## Client Applicability

- All clients: Yes, for the shared Tower surface and Tower grounding path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/lib/atlas/tower-grounding.ts`: merges loaded budget rollups with initiative-derived rollups instead of replacing loaded budget-rollup fields when materialized initiatives exist.
- `src/components/tower/TowerIndexPage.tsx`: replaces the Tower overview KPI-strip/daily-read block with a story-first CIO/CFO board and fixes dashboard view URLs to always use `dashboard=...`.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: updates coverage for the story board, aVa branding, raw-ID suppression, loaded rollup evidence, and dashboard routing.

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` — passed, 5 tests. Jest reported pre-existing duplicate manual mock warnings for markdown mocks, but the suite passed.

## Rollout Plan

Merge to `main`, build the approved Azure Container Apps image from the merge SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the new revision, then run signed-in Tower browser proof for the pilot tenants.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: No manual or branch image should mutate shared ACA traffic.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Active revision, template image, and 100% traffic image must match the approved main digest.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower page and dashboard views for at least Lakeshore and SkyHarbor, plus any tenant where budget-rollup data is expected.

## Rollback Plan

Revert the Tower UI and grounding changes, rebuild the previous approved main image, and shift ACA traffic back to the previous healthy revision. No database migration is included.

## Audit Evidence

- Pull request: pending.
- CI: pending.
- Deploy evidence: pending.
- Browser proof: pending.

## Known Gaps

- This does not create new Tower data. If a tenant lacks budget, YTD, run/change, OpEx/CapEx, vendor value, or measured outcome rows, Tower will still show a trust/gap frame rather than inventing the metric.
- This does not yet replace the deeper Tower data mart or L3 dossier refresh policy; it makes the current Tower dashboard more truthful and CXO-readable while preserving loaded rollup fields.
