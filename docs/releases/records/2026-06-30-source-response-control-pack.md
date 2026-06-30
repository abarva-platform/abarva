# 2026-06-30-source-response-control-pack — Source Vendor Response Control Pack

## Release ID

`2026-06-30-source-response-control-pack`

## Status

`candidate`

## Plain-English Summary

Source now treats the RFP stage as an upstream control point. The RFP package mandates structured vendor submissions, and the existing RFP-stage response artifact is upgraded into a Vendor Response Control Pack with claim, pricing, staffing, SLA, assumptions, transition, and commercial-exception tables. The purpose is to make vendor proposals comparable, evidence-backed, and negotiation-ready before responses arrive.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact generation prompts, artifact metadata, stage copy, and gate criteria for all Source clients.
- `public-demo`: Improves the Source demo path by making RFP response structure explicit without claiming perfect downstream proposal parsing.

## Client Applicability

- All clients: Applies to Source sourcing events that use the shared artifact registry and RFP stage.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Upgraded `d09_rfp_pack` prompt to include structured vendor response compliance language.
- Added `d11_response_checklist` generation support as the Vendor Response Control Pack.
- Updated D09 parallel map-reduce §8 instructions so the response mandate survives faster generation mode.
- Updated Source canonical artifact labels, documentation profile, operations catalog, RFP gate criteria, and RFP stage copy.
- Added tests for the response-control artifact, required sections, event-context binding, and existing generation-code stability.

## QA / Validation

- PASS: `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` — 7 tests passed.
- PASS: `npx jest src/lib/source/__tests__/agent-generation-prompt-registry.test.ts --runInBand` — 2 tests passed.
- PASS: `npx jest src/lib/source/__tests__/canonical-specs.test.ts src/lib/source/__tests__/artifact-operations.test.ts src/lib/source/documentation-standards/__tests__/source-documentation-standards.test.ts --runInBand` — 120 tests passed.
- PASS: scoped ESLint on touched Source files.
- PASS: `npm run release:check`.
- BLOCKED: full `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` still fails only on unrelated baseline dependency/type gaps for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; slice-owned TypeScript issues were remediated.
- NOT RUN YET: signed-in Source browser proof after deploy.

## Rollout Plan

Merge the PR to `main`, build and deploy through the approved Azure Container Apps main lane, pin 100% traffic to the healthy revision, then run signed-in Source browser proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / approved Azure Container Apps lane.
- Shared runtime mutators: Source prompt registry, Source stage/canvas metadata, artifact/gate metadata.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the merged git SHA on `ca-abarva-web-lab-eastus`.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by deploying the prior known-good ACA image/revision. No schema migration or destructive data-plane change is included.

## Audit Evidence

- PR URL: Pending.
- CI / local gates: Pending.
- Deployment revision / image digest: Pending.
- Browser proof folder: Pending.

## Known Gaps

- This slice does not implement broad vendor proposal parsing, the full Commercial Leverage Map, or vendor-response ingestion automation.
- XLSX export support exists for the artifact family, but this slice focuses on the generation contract and UI/gate metadata.
