# 2026-07-02-tower-visible-ava-starters — Tower aVa Starter Questions Stay Visible

## Release ID

`2026-07-02-tower-visible-ava-starters`

## Status

`candidate`

## Plain-English Summary

Tower already had better CIO-grade aVa starter questions, but the shared chat dock hid them once the Tower advisor opening message existed. This release makes Tower explicitly keep its pinned starter questions visible, so the aVa rail offers useful CIO prompts instead of leaving the user with a blank composer after the opening read.

## Layer Impact

- `global-control-lane`: Adds an opt-in shared `AgentDock` behavior for surfaces that need suggested questions to remain visible after an opening advisor turn.
- `global-control-lane`: Passes that opt-in through the Tower `AtlasChatPanel` adapter.
- `global-control-lane`: Enables the opt-in only on Tower so other surfaces keep their existing suggestion-hiding behavior.

## Client Applicability

- All clients: Tower UI behavior updates wherever the shared Tower page is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `keepSuggestedActionsVisible` to `AgentDock`.
- Adds the same pass-through prop to `AtlasChatPanel`.
- Enables the prop on `TowerIndexPage`.
- Adds regression coverage proving a focused dock with an opening advisor turn can still display meaningful pinned Tower questions.

## QA / Validation

- Focused test coverage:
  - `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
  - Status: Pass. 2 suites passed, 55 tests passed.
- Release check:
  - `npm run release:check`
  - Status: Pass. Release Control Gate, Deploy Authority Gate, and Pilot Data Loader Gate passed.
- Browser proof:
  - Signed-in `/tower` shows the meaningful aVa starter questions in the dock.
  - Status: Not run yet; requires deployed ACA revision after merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After the revision is healthy and receiving 100% traffic, verify the signed-in Tower page.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No manual runtime mutation required.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match the approved main image.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/tower`.

## Rollback Plan

Revert the release commit or redeploy the previous approved main image. This change has no schema, data, or migration rollback requirement.

## Audit Evidence

- PR: Pending.
- Focused tests: Pass, 55/55 focused tests.
- Release check: Pass.
- ACA deploy proof: Not run yet.
- Browser proof: Not run yet.

## Known Gaps

This release only fixes starter-question visibility. It does not change Tower metrics, data loading, or aVa answer quality.
