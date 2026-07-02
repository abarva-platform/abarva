# 2026-07-02-intelligence-fast-insight-canvas — Intelligence Fast Insight Canvas

## Release ID

`2026-07-02-intelligence-fast-insight-canvas`

## Status

`candidate`

## Plain-English Summary

Intelligence now shows a Source-style executive insight canvas immediately for the SkyHarbor airline and Industrial/Morgan Street back-office demo questions. The right side no longer has to wait for the full Claude response before showing a useful decision exhibit; aVa still replaces or refines the canvas with the final model-owned tabs when the streamed answer arrives.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence v2 client surface so long first answers can still present a decision canvas during the model round trip.
- No data-plane schema, ingestion, migration, tenant data, or retrieval contract changes.

## Client Applicability

- All clients: The preservation behavior for existing tabs during streaming is generic.
- Specific clients: Fast pre-answer insight packets are currently scoped to SkyHarbor/Airline and Lakeshore/Industrial/Morgan Street question patterns.
- Internal only: No.
- Public/demo only: Demo-focused first packet content; final answer still comes from the normal Intelligence runtime.
- Feature flag: None.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
  - Adds fast SkyHarbor airline and Industrial back-office insight canvas packets.
  - Preserves the temporary insight tabs until the model stream supplies real parsed tabs.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`
  - Adds pending-stream tests proving the right-side canvas appears before the model response completes.

## QA / Validation

- PASS: `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` — 14 tests passed, including the new pending-stream fast-canvas checks. Jest emitted existing duplicate manual mock warnings that did not fail the suite.
- PASS: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`.
- PASS: `git diff --check`.
- NOT RUN: Browser/signed-in ACA proof. Required after merge/deploy before claiming production-visible latency improvement.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to `main`, build the exact SHA through the approved Azure Container Apps image build, update `ca-abarva-web-lab-eastus`, move 100% traffic only after the new revision is healthy, and browser-prove SkyHarbor plus Industrial Intelligence.

## Deployment Authority

- Repo-owned deploy workflow: Approved ACA main deploy lane.
- Shared runtime mutators: Azure Container Apps web revision only.
- Approved image digest: To be captured after image build.
- ACA runtime invariant: `app.abarva.ai` must run the corrected ACA revision at 100% traffic before production proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the release commit or move ACA traffic back to the previous healthy web revision. No database rollback is required.

## Audit Evidence

- Unit tests for fast pending-stream canvas behavior.
- Post-deploy proof should capture screenshots showing the canvas visible while the answer is still forming, then final answer/canvas after settle.
- ACA revision, image digest, and live JS bundle should be recorded after deploy.

## Known Gaps

- This candidate improves perceived latency and first-canvas usefulness; it does not yet replace the sequential retrieval path or heavy model-generation contract.
- The fast insight packets are intentionally demo-domain scoped. A durable read-model packet table remains the follow-on architecture.
