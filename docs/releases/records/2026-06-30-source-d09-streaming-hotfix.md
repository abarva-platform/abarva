# 2026-06-30-source-d09-streaming-hotfix — Source D09 Streaming Hotfix

## Release ID

`2026-06-30-source-d09-streaming-hotfix`

## Status

`candidate`

## Plain-English Summary

The Source RFP Package D09 generator now uses Anthropic streaming for the
parallel section and assembly calls. This prevents long-running D09 map-reduce
drafts from failing with the provider's long-request streaming requirement.
The Source canvas also treats heartbeat-wrapped JSON errors as failed drafts,
even when the transport response stays HTTP 200 to keep Azure ingress alive.

## Layer Impact

- `global-control-lane`: shared Source artifact generation behavior for every
  client using the Source RFP stage.
- `public-demo`: improves the live demo golden path for the RFP Pack and Vendor
  Response Control Pack.

## Client Applicability

- All clients: Source D09 generation and canvas error handling.
- Specific clients: None.
- Internal only: None.
- Public/demo only: The immediate proof target is the Lakeshore Source demo.
- Feature flag: Uses the existing `ABARVA_SOURCE_D09_MAP_REDUCE` runtime flag.

## Changes Included

- `src/lib/source/agent-generation/d09-map-reduce.ts`
- `src/components/source/canvas/UniversalCanvasShell.tsx`
- `src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts`
- `src/__tests__/integration/source/source-access-control-static.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand`
- `npx jest src/__tests__/integration/source/source-access-control-static.test.ts --runInBand`
- `npx eslint src/lib/source/agent-generation/d09-map-reduce.ts src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/components/source/canvas/UniversalCanvasShell.tsx src/__tests__/integration/source/source-access-control-static.test.ts`

Live pre-fix proof captured that `/generate` was reachable but D09 failed with:
`Streaming is required for operations that may take longer than 10 minutes`.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, confirm 100% ingress traffic on the new `ca-abarva-web-lab-eastus`
revision, then rerun the signed-in Lakeshore Source RFP-stage proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps image/revision update only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the deployed `main` SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: Existing flag only; no new env var.
- Live signed-in proof required: Yes, Source RFP-stage D09/D11 generation and render/download probes.

## Rollback Plan

Revert the hotfix commit and redeploy the prior `main` image. No schema,
migration, or data-plane changes are included.

## Audit Evidence

- PR URL: to be added after PR creation.
- Live pre-fix proof folder:
  `/Users/anand/Downloads/source-response-control-proof-2026-06-30T1548Z`
- Post-deploy proof folder: to be added after live verification.

## Known Gaps

Post-deploy live proof is pending for this candidate.
