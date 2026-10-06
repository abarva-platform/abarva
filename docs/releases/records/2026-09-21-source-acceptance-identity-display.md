# 2026-09-21 Source Acceptance Identity Display

## Release ID

`2026-09-21-source-acceptance-identity-display`

## Status

`candidate`

## Plain-English Summary

The Source event Files view no longer displays an internal UUID as the person who accepted an artifact. A recorded display name remains visible; an internal-only identity now renders as an unresolved recorded user.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product presentation only. The stored acceptance record and identity authority are unchanged.

## Client Applicability

- All clients: yes, when an older acceptance record contains only an internal identity key.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Reused the canonical UUID display detector in the artifact acceptance panel.
- Preserved named actors exactly.
- Added a behavior test proving an internal UUID cannot reach the visible acceptance status.

## QA / Validation

- Signed-in read-only smoke reproduced the identifier exposure before the edit.
- The focused component test failed before implementation and passes after it.
- TypeScript, scoped ESLint, release validation, and the relevant Source component scope are run before merge.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on a record whose actor is an internal UUID.

## Rollback Plan

Revert the squash merge and let the repo-owned workflow restore the prior display. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in read-only Files-view proof after deployment.

## Known Gaps

This display guard does not assign a person name. Historical rows need a governed identity repair if a named actor is required for audit completeness.
