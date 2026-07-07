# 2026-06-04-source-redesign-spec-09-scope-rfp — Source Scope and RFP Stage Views

## Release ID

`2026-06-04-source-redesign-spec-09-scope-rfp`

## Status

`candidate`

## Plain-English Summary

The Source event canvas now gives Scope and RFP their own decision-oriented stage views. Scope shows an explicit CMDB inventory pull state, a readable application inventory, a dependency list, and retained-organization assumptions before the governed document workspace. RFP shows the evaluation rubric, vendor shortlist, Q&A protocol, and a disabled release state that makes clear vendor communications are not sent from AbarVa without sponsor sign-off and an external channel. The canonical artifact operations catalog now also carries a gold-standard contract for every Source artifact: purpose, outcome, table of contents, evidence inputs, best-in-class expectations, approval owner, supported upload/download formats, and data-binding checks.

## Layer Impact

- `global-control-lane`: updates shared Source canvas UI behavior for all Source-enabled clients. No schema, data-plane write, ingestion, or model-provider behavior changes.

## Client Applicability

- All clients: Source event canvases that render Scope or RFP stages receive the new stage views.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/components/source/canvas/scope/ScopeStageView.tsx`.
- Adds `src/components/source/canvas/scope/ApplicationInventoryTable.tsx`.
- Adds `src/components/source/canvas/rfp/RfpStageView.tsx`.
- Adds `src/components/source/canvas/rfp/EvalRubricTable.tsx`.
- Adds `src/components/source/canvas/rfp/VendorShortlistPanel.tsx`.
- Updates `src/components/source/canvas/UniversalCanvasShell.tsx` to route Scope and RFP document tabs through the new stage views.
- Extends `src/lib/source/artifact-operations.ts` so all 33 canonical artifacts expose a gold-standard "what good looks like" contract and explicit upload/download/data-binding expectations.
- Extends SSR integration coverage for the universal canvas and the rubric soft-warning behavior.
- Extends artifact operations tests so every canonical artifact must have a gold-standard contract, and the vendor response pack must remain honest about procurement-system-of-record and partial workflow state.
- Corrects the vendor response pack panel binding so uploads log against `d13_vendor_responses`, not the response-checklist artifact.

## QA / Validation

- PASS — focused Jest: `npm test -- --runInBand src/lib/source/__tests__/artifact-operations.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/__tests__/integration/source/source-rfp-rubric-warning.test.tsx` (36/36).
- PASS — vendor response static wiring: `npm test -- --runInBand src/__tests__/integration/source/source-vendor-response-pack-flow-static.test.ts`.
- PASS — focused ESLint: `npx eslint src/components/source/canvas/scope/ApplicationInventoryTable.tsx src/components/source/canvas/scope/ScopeStageView.tsx src/components/source/canvas/rfp/EvalRubricTable.tsx src/components/source/canvas/rfp/VendorShortlistPanel.tsx src/components/source/canvas/rfp/RfpStageView.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/artifact-operations.ts src/lib/source/__tests__/artifact-operations.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/__tests__/integration/source/source-rfp-rubric-warning.test.tsx --max-warnings 0`.
- PASS — TypeScript: `npx tsc --noEmit --skipLibCheck --pretty false`.
- PASS — release check: `npm run release:check -- --base origin/main --head HEAD`.
- PASS — diff check: `git diff --check`.
- NOT-RUN — PR CI after PR creation.
- NOT-RUN — production deploy and Source post-deploy crawl after merge.
- BLOCKED — live upload/download E2E for Scope/RFP is deferred to the dedicated artifact workflow slice because this PR does not add a new upload route or export renderer. The contract now states which formats are accepted and which downloads are supported or governed-unavailable, and follow-up E2E must prove those routes against production before claiming those workflows are ready.

## Rollout Plan

Merge the PR to `main`, then deploy the exact merged SHA to Vercel production. Verify `https://app.abarva.ai` aliases to that deployment and run the Source post-deploy crawl against the production alias.

## Rollback Plan

Revert the PR and redeploy the previous known-good `main` SHA. This change has no migration or persistent data side effects.

## Audit Evidence

- PR URL: to be added after PR creation.
- Production deployment: to be added after merge/deploy.
- Post-deploy crawl artifacts: to be added after production verification.

## Known Gaps

- The CMDB pull and RFP release controls are intentionally unavailable in this slice until setup connectors, sponsor sign-off persistence, and external communication channels are configured. This prevents silent imports or external vendor sends.
- Vendor response pack intake remains partial by design in this slice: AbarVa stores evaluation snapshots and cannot replace the client procurement portal. The next workflow slice must build vendor picker, bulk upload, response versioning, parser status, RFP section mapping, and completeness rollup, with production upload/download proof.
