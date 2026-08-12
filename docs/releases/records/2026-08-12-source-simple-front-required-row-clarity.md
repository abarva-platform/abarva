# 2026-08-12 — Source Simple Front Required-Row Clarity

## Release ID

`2026-08-12-source-simple-front-required-row-clarity`

## Status

`candidate`

## Plain-English Summary

Improves the Source New Event simple front so completed required evidence rows
read as done and no longer compete with the next required action. Pending rows
remain actionable with template, upload, and answer controls, while the approval
gate remains disabled until all required inputs are ready.

## Layer Impact

Release lane: global-control-lane.

Products: Source New Event simple-front UI only. This changes the presentation of
stage evidence readiness and does not change workflow persistence, parser
behavior, upload storage, approvals, scoring, or live data-plane contracts.

## Client Applicability

- All clients: Source users who see the simple-front New Event canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing simple-front availability only; no new flag.

## Changes Included

- `src/components/source/canvas/SimpleStageFront.tsx`
- `src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`
- `docs/backlog/tracks/04-source-commercial/SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`

## QA / Validation

- `npx jest src/components/source/canvas/__tests__/SimpleStageFront.test.tsx --runInBand` — passed.
- `npx eslint src/components/source/canvas/SimpleStageFront.tsx src/components/source/canvas/__tests__/SimpleStageFront.test.tsx` — passed.
- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — required before merge.
- GitHub PR checks — required before merge.

## Rollout Plan

Merge to `main`. Because this is a runtime UI change, it becomes active after
the repo-owned Azure Container Apps main deploy workflow publishes the merged
image. Signed-in Source route proof should confirm the simple-front required row
states after deployment.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source New Event simple-front route.

## Rollback Plan

Revert this UI commit or roll back to the prior ACA web image through the
approved runtime rollback path. No schema or data rollback is required.

## Audit Evidence

- Pull request for this branch.
- Focused component test output.
- Release control output.
- GitHub PR check rollup.
- Post-deploy ACA runtime invariant and signed-in Source screenshot/DOM proof
  when deployed.

## Known Gaps

This does not add vendor proposal parsing, durable evidence acceptance, parser
readiness, scoring, pricing normalization, or approval automation. Those remain
tracked in SRC49-SRC56.
