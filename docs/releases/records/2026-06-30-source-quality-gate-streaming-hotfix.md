# 2026-06-30-source-quality-gate-streaming-hotfix — Source Quality Gate Streaming Hotfix

## Release ID

`2026-06-30-source-quality-gate-streaming-hotfix`

## Status

`candidate`

## Plain-English Summary

Source artifact generation now streams the route-level consulting quality
rewrite, review, and retry-review calls. This closes the remaining long-request
failure path found after the D09 map-reduce streaming hotfix: D09 sections could
stream successfully, but the Source route quality gate could still use a
non-streaming Anthropic call and fail before the artifact was saved.

## Layer Impact

- `global-control-lane`: shared Source artifact generation behavior for every
  client using the Source stage artifacts and consulting-grade quality gate.
- `public-demo`: supports the live Source golden path proof for the RFP Package
  and Vendor Response Control Pack.

## Client Applicability

- All clients: Source artifact generation quality-gate calls.
- Specific clients: None.
- Internal only: None.
- Public/demo only: The immediate browser proof target is the Source demo event.
- Feature flag: Existing Source generation flags only; no new flag added.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- `src/__tests__/integration/source/source-access-control-static.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/__tests__/integration/source/source-access-control-static.test.ts --runInBand`
- `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' src/__tests__/integration/source/source-access-control-static.test.ts src/lib/source/agent-generation/d09-map-reduce.ts src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts`
- `npm run release:check`

Live proof before this candidate showed the route still failed D09 generation
with the Anthropic long-request streaming requirement after the D09 map-reduce
hotfix deployed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, confirm 100% ingress traffic on the new `ca-abarva-web-lab-eastus`
revision, then rerun the signed-in Source golden path proof for D09 and D11.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps image/revision update only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the deployed `main` SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: No new env var or feature flag.
- Live signed-in proof required: Yes, Source D09/D11 generation and render/download probes.

## Rollback Plan

Revert this hotfix commit and redeploy the prior `main` image. No schema,
migration, or data-plane changes are included.

## Audit Evidence

- PR URL: to be added after PR creation.
- Pre-candidate live proof folder:
  `/Users/anand/Downloads/source-response-control-postdeploy-2026-06-30T1618Z`
- Post-deploy proof folder: to be added after live verification.

## Known Gaps

Post-deploy live proof is pending for this candidate.
