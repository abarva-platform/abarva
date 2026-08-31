# 2026-08-31-home-executive-story-readiness — Home Executive Story Readiness

## Release ID

`2026-08-31-home-executive-story-readiness`

## Status

`candidate`

## Plain-English Summary

This release makes the Home executive story readiness label match the actual section states. A held or deferred section is no longer counted as ready in the opening pill or side rail.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Updates Home preview rendering only. The governed narrative rows, terminal states, source claims, and ECL read path are unchanged.

## Client Applicability

- All clients: Home preview users receive the corrected readiness wording once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home route behavior is unchanged.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx`: derives readiness from section terminal states and reports ready, held, and deferred counts separately.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`: adds a regression test for mixed published, refused, and deferred states.

## QA / Validation

- `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx` — passed.
- `npm test -- --runTestsByPath src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand` — passed.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home preview after deployment.

## Rollback Plan

Revert the PR and redeploy the previous known-good web image through the repo-owned ACA workflow.

## Audit Evidence

PR, deploy run, ACA runtime invariant, health check, and signed-in Home preview screenshot should be attached to the final release evidence.

## Known Gaps

This is a readiness-label correctness fix only. It does not regenerate narrative content, alter the Home deterministic context layer, or change the source data.
