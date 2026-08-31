# 2026-08-31-home-executive-story-layout-polish — Home Executive Story Layout Polish

## Release ID

`2026-08-31-home-executive-story-layout-polish`

## Status

`candidate`

## Plain-English Summary

This release refines the executive story opening so the landing screen reads as a boardroom brief supported by evidence, instead of a proof panel with oversized diagnostic framing. It does not change the data source, generation process, or published claims.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Updates the Home preview rendering component for the executive story surface. The page still reads the same governed ECL-backed narrative rows and terminal states.

## Client Applicability

- All clients: Home preview users receive the layout refinement once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home route behavior is unchanged.

## Changes Included

- `src/components/home/v4/ExecutiveStoryPage.tsx`: tightens the opening page hierarchy, moves evidence basis into a smaller support rail, and makes the lead number a contained proof point rather than the main headline.

## QA / Validation

- `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx` — passed.
- `git diff --check` — passed.

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

This is a layout polish only. It does not regenerate narrative content, alter the Home deterministic context layer, or change the architecture/data-browser designs.
