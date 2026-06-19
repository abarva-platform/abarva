# 2026-06-19-prod-lab-enterprise-advisory-command-center - Production-Lab Surface Correction

## Release ID

`2026-06-19-prod-lab-enterprise-advisory-command-center`

## Status

`candidate`

## Plain-English Summary

This release corrects the signed-in production-lab app surfaces so `/home`, `/intelligence`, and `/tower` serve the current committed Enterprise Landscape, Advisory Board, and Portfolio Command Center experiences instead of the older decision-card, Context/Corpus Explorer, and old AI Tower lens pages. `/admin` remains the Setup/Admin control plane.

The release also retires legacy `/intelligence/*` deep links by redirecting them to canonical `/intelligence`, preventing users from bypassing the new Advisory Board and landing on old context/corpus pages.

## Layer Impact

- `global-control-lane`: changes shared signed-in route behavior for Home, Intelligence, Tower, and legacy Intelligence deep links.
- `client-data-lane`: no data mutation. The surfaces read existing tenant-aware view models and committed Tower read models.
- `internal-admin`: `/admin` remains unchanged and continues to render Setup/Admin.

## Client Applicability

- All clients: receive the corrected signed-in route behavior and canonical Intelligence redirect behavior.
- Specific clients: no client-specific code path in this release.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/proxy.ts`: redirects `/intelligence/*` legacy deep links to canonical `/intelligence`, preserving query parameters.
- `docs/build/ai-control-tower-template/ai-control-tower-synthetic-canonical-v1.json`: restores the canonical AI Control Tower template artifact required by the existing load-plan and persistence tests.
- Test fixtures under `src/lib/intelligence-v3/__tests__/` and `src/lib/pilot-dashboard/__tests__/` are aligned with the current Enterprise Context read-model shape.
- Current committed route source already maps:
  - `/home` to `EnterpriseLandscapeHome`
  - `/intelligence` to `AdvisoryIntelligencePage`
  - `/tower` to `AiControlTowerPage`
  - `/admin` to Setup/Admin

## QA / Validation

- Pass: `npx eslint src/proxy.ts src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts src/lib/pilot-dashboard/__tests__/aggregates.test.ts src/lib/ai-control-tower/__tests__/load-plan.test.ts src/lib/ai-control-tower/__tests__/persistence.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run build`
- Pass: `npm run release:check`
- Initial signed-in Chrome crawl before this release showed the production-lab app still serving old content:
  - `/home`: `Good morning, User` decision-card page.
  - `/intelligence`: `Intelligence · Context & Corpus Explorer | AbarVa` with `What your context is telling us`, `DIMENSIONS LOADED`, `GRAPH EDGES`, `Ask about loaded context`, and `The strongest cross-context reads`.
  - `/tower`: old `Is AI producing measurable, governed value?` hero and `VALUE · L2` / `TRUST · L0` style labels.
  - `/admin`: `Setup · AbarVa`, correctly preserved as Setup/Admin.
- Pending: ACR build image tag/digest.
- Pending: ACA revision health and 100% traffic.
- Pending: signed-in Chrome crawl after deploy for `/home`, `/intelligence`, `/tower`, and `/admin`.

## Rollout Plan

Build a clean image from committed HEAD, push to ACR, update the Azure Container Apps lab web app, confirm the new healthy revision receives 100% traffic, then run a cache-busted signed-in browser crawl.

## Rollback Plan

Shift Azure Container Apps traffic back to the previous healthy web revision. No database migration, schema rollback, or data-plane rollback is required.

## Audit Evidence

- Initial signed-in Chrome crawl: `reports/live-route-crawl-2026-06-19-chrome-initial/raw.txt`
- Pending: validation command outputs.
- Pending: image tag, digest, ACA revision, traffic proof.
- Pending: post-deploy signed-in Chrome crawl summary.

## Context Ingestion Evidence

Not applicable. This release does not load, parse, stage, commit, embed, or refresh client context/corpus data.

## Known Gaps

- This release corrects route/runtime surfaces. It does not improve the underlying richness of tenant datasets or retrieval quality.
- The signed-in crawl currently uses the existing Chrome session, because saved Playwright auth state is stale and redirects to sign-in.
