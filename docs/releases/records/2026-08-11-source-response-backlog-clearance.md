# 2026-08-11-source-response-backlog-clearance - Source Response Backlog Clearance

## Release ID

`2026-08-11-source-response-backlog-clearance`

## Status

`candidate`

## Plain-English Summary

Clears the ordered Source Responses backlog behind proposal parsing, scoring readiness, BAFO leverage, executive decision conditions, and value proof. The change adds a deterministic vendor-response parser contract that keeps documents tenant, event, vendor, and version scoped; produces citations, missing-input ledgers, file-role readiness, normalization rows, health status, and score readiness; then feeds those parsed reports into the Responses intelligence brief, forward gate, and a new decision proof panel.

## Layer Impact

- Release lane: `global-control-lane` for shared Source product UX and decision-support behavior.
- Product layer: Updates the Responses stage so parser-backed evidence can drive visible scoring readiness, BAFO leverage, CXO decision conditions, and value proof guardrails.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.
- Live data-plane: No change.

## Client Applicability

- All clients: Applies to Source Responses-stage rendering and proposal-intelligence decision support.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/lib/source/proposal-intelligence/parser.ts` adds the vendor-response parser contract and parser-report builder.
- `src/lib/source/proposal-intelligence/backlog-clearance.ts` adds first-pass scoring readiness, BAFO leverage optimization, executive decision pack, and value-realization proof plan builders.
- `src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx` uses parser reports when present for evidence-used and missing-input reporting.
- `src/components/source/canvas/responses/VendorResponseForwardGate.tsx` uses parser-report blockers and holdbacks before allowing Evaluation movement.
- `src/components/source/canvas/responses/VendorResponseDecisionProofPanel.tsx` surfaces scoring, BAFO, CXO decision, and value-proof outputs in the Responses workflow.
- `src/components/source/canvas/responses/ResponsesStageView.tsx`, `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`, and `src/app/(maestro)/source/events/[eventId]/page.tsx` pass parser reports into the live Responses canvas.
- Focused tests cover parser isolation, required vs optional file roles, missing inputs, first-pass scoring, BAFO honesty, executive decision conditions, value proof guardrails, and UI rendering.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseDecisionProofPanel.test.tsx --runInBand --silent`
- PASS: `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/lib/source/proposal-intelligence/parser.ts src/lib/source/proposal-intelligence/backlog-clearance.ts src/lib/source/proposal-intelligence/index.ts src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/VendorResponseDecisionProofPanel.tsx src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx src/components/source/canvas/responses/VendorResponseForwardGate.tsx src/components/source/canvas/responses/__tests__/VendorResponseDecisionProofPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`
- Pending: PR checks, ACA deploy workflow, runtime invariant, and signed-in live proof.

## Rollout Plan

Merge through the normal PR path. Runtime activation requires the repo-owned Azure Container Apps main deploy workflow after merge. No migration, data load, feature flag, environment change, or manual operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Pending main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required after deploy before claiming live-proven.

## Rollback Plan

Revert the PR to remove the parser/backlog decision-support builders, parser-report wiring, Responses decision proof panel, related UI changes, tests, and this release record, then allow the repo-owned ACA main deploy workflow to redeploy main. No schema rollback, tenant-data rollback, or data-plane rollback is required.

## Audit Evidence

- Local validation commands listed above.
- PR review and CI evidence after publication.
- ACA main deploy workflow evidence after merge.
- Signed-in browser proof for the live Responses stage after deploy.

## Known Gaps

This release does not persist parsed vendor-response facts to the data plane, run OCR or Azure Document Intelligence, or execute real-client uploads. It provides the product contract and visible workflow path so uploaded response packages can be connected to governed parsing in a later data-plane-gated slice.
