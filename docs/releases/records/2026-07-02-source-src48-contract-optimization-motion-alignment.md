# 2026-07-02-source-src48-contract-optimization-motion-alignment — Source SRC48 Contract Optimization Export Alignment

## Release ID

`2026-07-02-source-src48-contract-optimization-motion-alignment`

## Status

`candidate`

## Plain-English Summary

Source now keeps the SkyHarbor Air AMS Contract Optimization export story aligned across the CXO report and Deal Pack. The CXO report and PPTX no longer reuse generic RFP / BAFO lifecycle language for the existing-contract optimization motion. The Deal Pack becomes an evidence appendix for the contract baseline, optimization findings, negotiation levers, caveats, and audit trail.

## Layer Impact

- `global-control-lane`: Updates shared Source export route behavior and the report/deal-pack rendering library.
- `public-demo`: Improves the controlled SkyHarbor Air contract optimization demo exports so they match the live Source page and AMS Contract Optimization Brief.

## Client Applicability

- All clients: The generic Source CXO report remains on the safer decision-gate behavior and does not award early.
- Specific clients: SkyHarbor Air contract optimization demo events receive the motion-specific CXO report and evidence appendix.
- Internal only: None.
- Public/demo only: This is primarily demo-safe packaging for the Source contract optimization motion.
- Feature flag: None.

## Changes Included

- Added contract-optimization-specific CXO report and Deal Pack appendix helpers under `src/lib/source/contract-optimization/cxo-exports.ts`.
- Routed `/api/v1/source/[eventId]/cxo-report` to the contract optimization report for the SkyHarbor AMS contract optimization event.
- Routed `/api/v1/source/[eventId]/deal-pack` to the contract optimization evidence appendix for the SkyHarbor AMS contract optimization event.
- Added regression checks that forbid RFP / BAFO lifecycle drift, Sentinel wording, seed-gap scaffolding, and missing-contract language in the contract optimization report and appendix.
- Updated the generic Source CXO report test fixture so award-ready output is only expected at the executive-decision stage.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts` — passed, 50 tests.
- Additional lint, TypeScript, release check, deployment, and live signed-in proof are required before marking released.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps main deploy lane, then verify the live Source contract optimization CXO report and Deal Pack routes for the SkyHarbor AMS contract optimization event.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: Azure Container Apps web app only.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic only after the new revision is healthy.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by reverting this PR or shifting ACA ingress traffic back to the previous healthy revision. No migrations or data-plane changes are introduced.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI / local gates: Focused Source export tests passed locally.
- Deployment URL: `https://app.abarva.ai` after ACA deploy.
- Smoke output: Live CXO report and Deal Pack export captures to be stored in the SRC48 proof ZIP.

## Known Gaps

- Live ACA deploy and signed-in export proof are pending for this candidate.
