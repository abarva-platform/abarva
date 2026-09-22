# 2026-09-22 Source Event Five-Phase Reader Journey

## Release ID

`2026-09-22-source-event-five-phase-reader-journey`

## Status

`candidate`

## Plain-English Summary

The Source event detail page now makes the accepted Source New five-checkpoint journey the primary
reader-facing rail. The governed internal stage view is still available as a stage-detail link, so
operators can open a specific canonical stage without reading the legacy eleven-stage list as the
main product journey.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product behavior only. Source remains a projection over governed event data; canonical
  stage keys, approval routing, artifact state, event facts, and tenant data are unchanged.

## Client Applicability

- All clients: yes, for users who open `/source/events/[eventId]`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` renders the existing Source New
  checkpoint order in the primary rail and keeps canonical stage access in a smaller stage-detail
  link.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`
  asserts the five-checkpoint reader rail and direct deep-stage href for every canonical stage.

No migration, route action, approval write, supplier communication, or data-plane mutation is
included.

## QA / Validation

- Red-first rendered test failed before implementation: the rail had no
  `source-reader-journey-checkpoint` items and still rendered the legacy stage rail.
- Focused render suite after implementation: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx --runInBand` passed, 15 tests.
- Mutation proof: reversing only the implementation patch restored the legacy rail and the focused
  suite failed, 11 failed / 4 passed, on the missing `source-reader-journey-checkpoint` assertion.
  Reapplying the implementation returned the same suite to green.
- The initial CI run correctly caught that the simplified reader rail had also replaced the
  contract-optimization journey. The implementation now preserves that journey's Negotiation Plan
  and omits competitive-market checkpoints; disabling that motion-specific branch makes the
  existing contract-optimization behavior test fail again.
- Full Source canvas component suite after the correction: 28 suites and 176 tests passed.
- Focused projection/render regression: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx src/lib/source/new-workspace/phase-state.test.ts --runInBand` passed, 46 tests.
- Scoped ESLint: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx src/lib/source/new-workspace/phase-state.ts src/lib/source/new-workspace/phase-state.test.ts` passed.
- TypeScript: `npm run typecheck` passed clean.
- Release validation: `npm run release:check` passed.
- Diff hygiene: `git diff --check` passed.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main
workflow builds and deploys the exact merge SHA. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template image, active traffic revision image, and required worker images
  must match the approved digest after deployment.
- Worker image invariant: required by the same deploy proof.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, read-only visual acceptance of the Source event detail rail is
  owed after deployment. This PR does not claim signed-in acceptance.

## Rollback Plan

Revert the squash merge and let the repo-owned deploy workflow restore the previous event-detail
rail. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Focused Jest output for red-first, mutation, and green runs.
- Repo-owned ACA deployment run and runtime-invariant artifact after merge.

## Known Gaps

- Signed-in acceptance is owed after deployment and is not claimed here.
- This release does not change canonical internal Source stage keys, approval semantics, event
  progression, artifact generation, or Source New request creation.
