# 2026-09-21 Source New Event Route Continuity

## Release ID

`2026-09-21-source-new-event-route-continuity`

## Status

`candidate`

## Plain-English Summary

Source New now keeps its own product context while an accepted sourcing event opens. The event route uses a Source New loading state, and its return link goes back to the Source New event list.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product presentation only. No canonical objects, adapters, tenant data, workflow decisions, or event lifecycle state change.

## Client Applicability

- All clients: yes, for users opening governed Source events.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added a route-specific loading shell for governed Source events.
- Changed the event-workspace return link from the optimization workspace to Source New.
- Added behavioral coverage for both navigation states.

## QA / Validation

- Signed-in read-only smoke reproduced the two route-continuity defects before the edit.
- Focused integration suites pass for the event loading shell and Source route shell.
- TypeScript, scoped ESLint, release validation, and the broader Source integration scope are run before merge.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the loading context and return destination.

## Rollback Plan

Revert the squash merge and let the repo-owned workflow restore the prior route presentation. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in read-only route smoke after deployment.

## Known Gaps

Evidence-readiness reconciliation and unresolved actor identities observed during the smoke remain separate governed data/read-model investigations. This release does not change either state.
