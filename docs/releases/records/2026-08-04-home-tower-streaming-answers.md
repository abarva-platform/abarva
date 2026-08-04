# 2026-08-04-home-tower-streaming-answers - Home and Tower aVa Streaming

## Release ID

`2026-08-04-home-tower-streaming-answers`

## Status

`candidate`

## Plain-English Summary

Home and Tower aVa answer surfaces now start responding immediately with streaming status events instead of waiting silently for the full answer. The existing final answer contracts remain unchanged: Home still returns the governed Home KNOW response, and Tower still returns the governed Tower answer packet.

## Layer Impact

`global-control-lane`: Home and Tower chat experiences receive streaming progress updates while the backend binds tenant context, composes the answer, and validates the visible response.

Canonical model and data layers: no schema, migration, dataset, Cube, or source-data mutation.

## Client Applicability

- All clients: yes, for Home and Tower aVa surfaces that call the updated endpoints.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/api/home/know/ask` now supports `application/x-ndjson` streaming when requested by the client.
- Home aVa clients now request the streaming Home KNOW path and render status text while waiting.
- `/api/tower/cio-chat` now emits an immediate accepted status before Tower visual/status planning.
- Non-streaming JSON compatibility remains for existing Home callers.

## QA / Validation

- `npx eslint src/app/api/home/know/ask/route.ts src/app/api/tower/cio-chat/route.ts src/components/home/know/HomeKnowAsk.tsx src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx src/components/home/HomeSurface.tsx src/lib/home/know/home-know-stream-client.ts` - passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` - passed.
- Local webpack dev server booted on `http://localhost:3017`; local Clerk ticket proof could not complete because the local page did not expose the Clerk object within the auth timeout. Production signed-in streaming proof is required after ACA deployment.
- The pre-fix 100-question live eval was stopped after confirming slow Home answer waits; the eval should be rerun after deployment.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared ACA runtime. No manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy by the standard workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home and Tower streaming first-event timing plus the 100-question Home/Tower eval.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. Existing non-stream JSON response behavior remains compatible, so rollback risk is low.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- ACA deploy proof: pending.
- Live signed-in stream timing and 100-question eval: pending after deployment.

## Known Gaps

Home answer quality still needs the follow-up 100-question evaluation after streaming is live; this release improves response visibility and perceived latency, not the underlying advisory prose quality.
