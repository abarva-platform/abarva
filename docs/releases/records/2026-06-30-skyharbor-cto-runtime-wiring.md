# 2026-06-30-skyharbor-cto-runtime-wiring — SkyHarbor CTO Runtime Wiring

## Release ID

`2026-06-30-skyharbor-cto-runtime-wiring`

## Status

`candidate`

## Plain-English Summary

This release wires the focused SkyHarbor CTO/IROPS readiness packet into the Intelligence ask runtime. For SkyHarbor airline questions about IROPS, disruption recovery, AI readiness, autonomous recovery, data certification, model-risk gates, value claims, or board-grade readiness, the runtime injects a high-priority tenant source derived from the SkyHarbor V6 CTO packet.

## Layer Impact

- `global-control-lane`: Updates Intelligence ask source assembly and prompt addendum handling.
- `client-data-lane`: Reads the SkyHarbor V6 local decision substrate to build the runtime packet. No schema migration is included.
- `public-demo`: Supports the airline CTO demo lane.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor Air Group only, gated by SkyHarbor tenant identity plus CTO/IROPS/readiness question detection.
- Internal only: No.
- Public/demo only: Yes, for the SkyHarbor airline CTO demo.
- Feature flag: Existing Intelligence Claude synthesis controls still apply.

## Changes Included

- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/skyharbor-cto-readiness.ts`
- `src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts`
- `src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts`
- `scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`
- `proof/skyharbor-v6-cto-readiness`

## QA / Validation

Pass:

- `npx jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
- `npx jest src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts --runInBand`
- `npx tsx scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`

Not run in the original local slice:

- Signed-in production browser proof; required after ACA deployment.

## Rollout Plan

Deploy through the approved Azure Container Apps lane: commit the scoped SkyHarbor runtime files, build the exact commit into ACR, update `ca-abarva-web-lab-eastus`, wait for the new ACA revision to become ready, move traffic to the new revision, and run signed-in SkyHarbor Intelligence proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main/lab deploy lane.
- Shared runtime mutators: Azure Container Apps image/revision/traffic only.
- Approved image digest: To be captured after ACR build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must point 100% traffic at the tested revision before claiming production-live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No env flag change expected.
- Live signed-in proof required: Yes.

## Rollback Plan

Move ACA traffic back to the prior healthy revision. Code rollback is to remove the SkyHarbor ask source helper, remove its import/use in `src/lib/intelligence/ask/index.ts`, and remove the SkyHarbor CTO packet assets if no longer required.

## Audit Evidence

- Local proof artifacts under `proof/skyharbor-v6-cto-readiness`.
- Focused Jest output for SkyHarbor packet and ask-source tests.
- ACA revision, image digest, traffic state, and signed-in browser proof must be added after production deployment.

## Known Gaps

- Does not claim live browser proof until a signed-in SkyHarbor flow is captured.
- Does not claim live Claude output quality until traces are captured from `/api/intelligence/ask`.
- Does not claim exact ROI or board-grade value for IROPS.
- Does not load the V6 pack into Azure/Postgres in this slice.
