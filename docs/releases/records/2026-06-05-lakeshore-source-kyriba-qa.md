# 2026-06-05-lakeshore-source-kyriba-qa - Lakeshore Source/Kyriba QA Evidence

## Release ID

`2026-06-05-lakeshore-source-kyriba-qa`

## Status

`candidate`

## Plain-English Summary

This evidence-only release captures Agent A's production QA for the Lakeshore Kyriba Source event. It proves that the Source portfolio, Kyriba event canvas, artifact render/export endpoints, and Value route are working for the Lakeshore demo persona without Apex or Meridian bleed.

## Layer Impact

- `public-demo`: Adds QA evidence for the production Lakeshore demo path.
- `client-data-lane`: Verifies Lakeshore-scoped Source artifact retrieval and tenant isolation, but does not change data, schema, RLS, ingestion, or runtime behavior.

## Client Applicability

- All clients: No runtime change.
- Specific clients: Lakeshore Holdings evidence only.
- Internal only: QA report and release record.
- Public/demo only: Confirms the Lakeshore Source/Kyriba demo path on `https://app.abarva.ai`.
- Feature flag: None.

## Changes Included

- Added Agent A Source/Kyriba QA packet under `reports/2026-06-05-agent-a-source-kyriba-qa/`.
- Added this release record.

## QA / Validation

- PASS: `LAKESHORE_DEMO_QA_BASE_URL=https://app.abarva.ai LAKESHORE_DEMO_QA_OUT=reports/2026-06-05-agent-a-source-kyriba-qa node scripts/lakeshore/app-demo-readiness-qa.mjs` returned 26 pass / 0 watch / 0 fail, including 14 Source checks.
- PASS: `LAKESHORE_VERIFY_BASE_URL=https://app.abarva.ai npx tsx scripts/lakeshore/verify-kyriba-source-live.ts` returned 200 for Selection, Transition, and Value with expected Kyriba artifact markers.
- PASS: Authenticated API/export sweep returned 7 pass / 0 fail for Source event API, CXO report HTML, PPTX fallback, Deal Pack HTML, two artifact HTML endpoints, and the Value page.
- PASS: No Apex Retail or Meridian Health markers appeared in checked Lakeshore Source routes/responses.

## Rollout Plan

No runtime rollout. Merge the evidence packet so the Lakeshore Source/Kyriba QA proof is available from main.

## Rollback Plan

Revert this evidence-only commit if the report is superseded or should be removed. No product rollback is required.

## Audit Evidence

- `reports/2026-06-05-agent-a-source-kyriba-qa/AGENT_A_SOURCE_KYRIBA_QA_SUMMARY.md`
- `reports/2026-06-05-agent-a-source-kyriba-qa/lakeshore-app-demo-readiness-2026-06-05T18-40-36-624Z-a879c5bc4/report.html`
- `reports/2026-06-05-agent-a-source-kyriba-qa/lakeshore-app-demo-readiness-2026-06-05T18-40-36-624Z-a879c5bc4/summary.json`
- `reports/2026-06-05-agent-a-source-kyriba-qa/source-kyriba-api-export-proof-2026-06-05T18-43-47-829Z-a879c5bc4/checks.json`

## Known Gaps

This release does not prove Azure private-plane cutover, corpus expansion, or new Source data loading. It only preserves production route/API/export proof for the already-loaded Lakeshore Source/Kyriba demo path.
