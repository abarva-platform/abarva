# 2026-09-21 Source New aVa Phase Readiness

## Release ID

`2026-09-21-source-new-ava-phase-readiness`

## Status

`candidate`

## Plain-English Summary

When a Source New user asks how to complete the current phase and which evidence is missing, aVa now uses the same simplified phase label and next action as the Source New workspace. It also states explicitly when no phase blocker or missing phase input is recorded, while continuing to report evidence-processing gaps separately.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 read and answer behavior only. No canonical facts, workflow state, approval, tenant data, schema, or source adapter is changed.

## Client Applicability

- All clients: yes, for governed Source New event chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source New and Source event chat availability.

## Changes Included

- Shared the reader-facing Source New phase labels and next-action projection between the workspace and aVa.
- Mapped internal scope/strategy stages to the visible Define phase.
- Kept market-package wording neutral when the accepted RFI/RFP authority is not available to the answer route.
- Made absent phase blockers and absent missing-input records explicit instead of silently omitting them.
- Added real-route, governed-answer, phase, and workspace behavior coverage.

## QA / Validation

- Signed-in acceptance of the prior release exposed the internal stage label and generic action.
- Red-first route and answer tests reproduced both failures.
- Mutation proof confirmed that reverting to the internal stage label fails the route behavior test.
- Focused route, governed-answer, phase, and workspace tests pass.
- TypeScript, scoped ESLint, release validation, and PR CI must pass before merge.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, repeat the combined phase-completion and evidence question and verify the visible phase, action, blocker state, missing-input state, and evidence-processing gaps.

## Rollback Plan

Revert the squash merge and let the repo-owned workflow restore the previous chat projection. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in read-only Source New chat smoke after deployment.

## Known Gaps

This release reports the phase blocker and missing inputs available to the existing answer context. It does not create missing evidence, infer approvals, or join solicitation authority that the route has not read.
