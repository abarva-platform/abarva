# 2026-08-31-home-executive-story-entry-card-polish — Home Executive Story Entry Card Polish

## Release ID

`2026-08-31-home-executive-story-entry-card-polish`

## Status

`candidate`

## Plain-English Summary

Improves the Home executive story entry cards so each card presents a distinct title and explanatory line instead of visually joining the two strings. This is a presentation-only correction to keep the Home opening canvas professional and readable.

## Layer Impact

- `global-control-lane`: updates the shared Home executive story component and its Tier 1 UI regression test.
- Layer 4 Products: presentation-only Home change. No source, adapter, canonical, projection, serving-view, migration, or data-load behavior changes.

## Client Applicability

- All clients: yes, for the shared Home executive story surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx`
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`

## QA / Validation

- `npx jest --runTestsByPath src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand` passed: 12 tests passed.
- `npm run release:check` is expected to pass after this release record is included.

## Rollout Plan

Squash merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image for the shared product runtime.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required before claiming the change is live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: Home route visual proof after deploy.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps workflow.

## Audit Evidence

- Pull request URL and CI run after opening the PR.
- Targeted Jest output from the Home Tier 1 test.
- ACA deploy workflow run and runtime-invariant proof after merge.
- Signed-in Home screenshot after deploy.

## Known Gaps

This release does not regenerate Home narrative content or change the source/context data model. It only fixes the entry-card presentation defect.
