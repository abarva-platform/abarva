# 2026-07-01-tower-governed-chat-path — Tower Chat Uses Governed CIO Answer Contract

## Release ID

`2026-07-01-tower-governed-chat-path`

## Status

`candidate`

## Plain-English Summary

Tower chat now routes deterministic CIO questions, such as top-program and spend questions, through the governed CIO Tower answer contract instead of the older Atlas factual-spine answer path. This keeps dashboard values, aVa answers, prompt traces, and visible tenant names aligned to the same Tower data layer.

## Layer Impact

- `global-control-lane`: Updates shared Tower/Atlas chat routing used by the signed-in product runtime.
- `client-data-lane`: No schema or data mutation. The change only reads the existing governed `cio_tower` answer context and metric/fact layers.

## Client Applicability

- All clients: Yes, for Tower chat questions that match deterministic CIO/Tower facts.
- Specific clients: Browser proof should include SkyHarbor Air because the bug was visible there.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/orchestrator.ts`: Delegates Tower factual-spine candidate questions to `answerCioTowerQuestion`.
- `src/lib/atlas/tower-grounding.ts`: Canonicalizes Tower client display names before they enter prompt/context state.
- `src/app/api/tower/cio-chat/route.ts`: Canonicalizes the direct Tower chat tenant display name.
- `src/app/api/v1/atlas/ask/route.ts`: Uses Tower state client name for rendered response metadata when present.
- `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts`: Proves top-program questions use the governed Tower answer contract and real tenant label.
- `src/lib/atlas/__tests__/tower-grounding-client-name.test.ts`: Proves legacy demo labels are canonicalized before Tower prompt state.

## QA / Validation

- Passed: `npx jest src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts src/lib/atlas/__tests__/tower-grounding-client-name.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`
- Passed: `npx eslint src/lib/atlas/orchestrator.ts src/lib/atlas/tower-grounding.ts src/app/api/tower/cio-chat/route.ts src/app/api/v1/atlas/ask/route.ts src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts src/lib/atlas/__tests__/tower-grounding-client-name.test.ts`
- Pending after merge/deploy: signed-in deployed `/api/v1/atlas/chat` proof for SkyHarbor top-program, top-AI-program, total-spend, and advisory questions.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the exact main image. After deploy, rerun the Tower prompt/raw/render trace against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No manual ACA mutation.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Active revision, template image, and 100% traffic must match the main deploy image.
- Worker image invariant: Not changed by this release, but deploy proof should confirm no drift.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and let the repo-owned main deploy workflow redeploy the prior image. No database rollback is required.

## Audit Evidence

- PR: To be attached before merge.
- CI: GitHub checks for the PR.
- Deployed proof: ACA revision/image/traffic plus signed-in Tower chat trace after merge.

## Known Gaps

- This release does not add new Tower data. It only ensures the chat path consumes the governed answer contract and real tenant label.
