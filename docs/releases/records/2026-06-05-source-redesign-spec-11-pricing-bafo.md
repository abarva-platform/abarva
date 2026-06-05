# 2026-06-05-source-redesign-spec-11-pricing-bafo — Source Pricing and BAFO Stage Views

## Release ID

`2026-06-05-source-redesign-spec-11-pricing-bafo`

## Status

`candidate`

## Plain-English Summary

This release turns Source stages 6 and 7 into usable Pricing and BAFO workspaces. Pricing now leads with normalized TCO, hidden-cost exposure, fixed sensitivity scenarios, and a commercial trap log. BAFO now leads with per-vendor negotiation envelopes, a concession ledger, and governed question-pack guidance. The document workspace remains visible beneath both stage views so the already verified upload/download paths stay reachable.

## Layer Impact

- `global-control-lane`: shared Source UI behavior for the universal event canvas.
- `client-data-lane`: reads existing tenant/event-bound Source pricing and BAFO view models; no schema or migration changes.

## Client Applicability

- All clients: Source event canvas users receive the new Pricing and BAFO stage views.
- Specific clients: Apex AMS walkthrough benefits immediately because it uses stages 6 and 7.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `src/components/source/canvas/pricing/PricingStageView.tsx`.
- Adds `src/components/source/canvas/pricing/TcoBridge.tsx`.
- Adds `src/components/source/canvas/pricing/TcoIcebergViz.tsx`.
- Adds `src/components/source/canvas/pricing/SensitivityRibbon.tsx`.
- Adds `src/components/source/canvas/pricing/TrapLog.tsx`.
- Adds `src/components/source/canvas/bafo/BafoStageView.tsx`.
- Adds `src/components/source/canvas/bafo/LeverEnvelopeTable.tsx`.
- Adds `src/components/source/canvas/bafo/ConcessionLedger.tsx`.
- Wires Pricing and BAFO stage-specific views into `src/components/source/canvas/UniversalCanvasShell.tsx`.
- Extends `src/__tests__/integration/source/source-event-canvas-render.test.tsx`.

## QA / Validation

- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx` — 32/32 tests passed.
- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts` — 5/5 tests passed, covering d19 pricing upload, list, comparison XLSX download, and fail-closed unsupported artifact behavior.
- Pass: focused ESLint over changed Source canvas files.
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.
- Not run yet: production deploy plus post-deploy crawl against `https://app.abarva.ai` waits for PR merge.

## Rollout Plan

Merge to `main`, deploy through Vercel production, and run the post-deploy crawler against the production alias.

## Rollback Plan

Revert the merge commit or redeploy the previous production deployment. No data migration is included.

## Audit Evidence

- PR URL: to be added when opened.
- Local QA output: to be added before PR.
- CI check rollup: to be added after PR.
- Production deployment and crawl output: to be added after merge.

## Known Gaps

- This release does not add new parser coverage for every Source artifact. The verified live upload/download proof remains the d19 pricing workbook route: upload vendor submission, list submissions, and download comparison XLSX bound to submitted rows.
- This release does not send BAFO or vendor communications. Procurement remains the external system of record unless a future configured channel is approved.
