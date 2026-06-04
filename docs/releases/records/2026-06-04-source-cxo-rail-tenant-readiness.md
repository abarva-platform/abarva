# 2026-06-04-source-cxo-rail-tenant-readiness — Source CXO Rail And Tenant Identity Closure

## Release ID

`2026-06-04-source-cxo-rail-tenant-readiness`

## Status

`candidate`

## Plain-English Summary

This release closes the first Source CXO-readiness retest gap: the late-stage event rail now has a full-size clickable target for the stage number, dot, and label, and Apex Retail resolves consistently to the canonical customer name "Apex Retail Group" when Source pages derive tenant identity from active-client data.

## Layer Impact

- `global-control-lane`: Updates shared Source canvas navigation and shared client display-name normalization used across authenticated surfaces.
- `client-data-lane`: No schema, seed, ingestion, retrieval, or private data-plane changes.

## Client Applicability

- All clients: receive the wider Source stage-rail click target.
- Specific clients: Apex Retail display names now canonicalize from "Apex Retail" to "Apex Retail Group" when that short alias appears in active-client data.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/EventStepRail.tsx`: expands each lifecycle stage link from a 32px dot-only hit area to a centered 104px link covering number, node, and label.
- `src/lib/client-config.ts`: canonicalizes Apex aliases to "Apex Retail Group."
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: adds coverage for late-stage rail hit area.
- `src/lib/__tests__/client-config-canonical.test.ts`: adds Apex alias canonicalization coverage.

## QA / Validation

- `npm test -- --runInBand src/lib/__tests__/client-config-canonical.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx` — passed, 25 tests.

## Rollout Plan

Merge to `main`; Vercel production deploy makes the UI and display-name changes active immediately.

## Rollback Plan

Revert this release commit or PR. No migrations or data changes are involved.

## Audit Evidence

- Focused Jest output in PR checks.
- Post-merge production crawl should verify late-stage rail clickability and tenant identity on `https://app.abarva.ai`.

## Known Gaps

- Sentinel chat LLM activation and cited-answer validation are out of scope for this first slice.
- Vendor response intake, evidence request workflow, communication drafts, and broader artifact approval workflows remain follow-on Source CXO-readiness slices.
