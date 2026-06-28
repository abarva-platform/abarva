# 2026-06-28-moves-cio-demo-unblocker — Strategic Moves Demo Readiness Unblocker

## Release ID

`2026-06-28-moves-cio-demo-unblocker`

## Status

`candidate`

## Plain-English Summary

This release hardens Strategic Moves so incomplete Moves render as safe, tenant-scoped incomplete states instead of crashing. It also removes misleading preliminary-draft language where the governed generation API still blocks final generation, and it makes P5 Source/Tower handoff disclosure explicit when live activation is not configured.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves view-model, phase build UI, evidence readiness copy, and cross-module trace copy. The behavior applies to all clients through the common Moves routes.
- `client-data-lane`: No schema, migration, seed, or tenant data mutation is included.

## Client Applicability

- All clients: Yes, for Strategic Moves route/view-model hardening and truthful generation/handoff copy.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Hardened sparse Move row normalization and optional Strategic Moves hydration.
- Updated phase build copy so required evidence gaps disable final build instead of offering unsupported preliminary generation.
- Updated evidence readiness packet language to stop implying a preliminary draft lane is active.
- Updated Source/Tower trace gap language to disclose that workflow/tracking activation is not configured for demo Moves unless linked evidence exists.
- Added regression coverage for sparse Move rendering, evidence/generation copy alignment, and P5 handoff disclosure.

## QA / Validation

- Focused Jest: `npx jest src/lib/programs/__tests__/strategic-moves-transformers.test.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx src/lib/programs/__tests__/cross-module-trace-view.test.ts --runInBand` — passed, 4 suites / 20 tests.
- Additional TypeScript, ESLint, release check, deployment, and signed-in browser proof are required before release.

## Rollout Plan

Merge to `main`, build the exact git SHA into ACR, deploy through Azure Container Apps `ca-abarva-web-lab-eastus`, assign 100% traffic to the healthy revision, then run signed-in Lakeshore and wrong-tenant Moves route proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: None.
- Approved image digest: To be recorded after `az acr build`.
- ACA runtime invariant: `app.abarva.ai` must run the digest-pinned image for the merged SHA.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by assigning ACA traffic back to the prior healthy revision. No data-plane migration rollback is required.

## Audit Evidence

- PR / commit SHA to be recorded after merge.
- ACA revision and image digest to be recorded after deployment.
- Signed-in proof bundle to include Lakeshore `/strategic-moves`, upload-binding Move detail/evidence/phase/trace, readiness/generation copy, P5 trace disclosure, and wrong-tenant negative checks.

## Known Gaps

The full preliminary draft lane is not implemented in this release. The product now states that explicitly instead of implying it is available.
