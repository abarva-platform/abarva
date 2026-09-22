# 2026-09-22 Source aVa Event Artifact Alias Reconciliation

## Release ID

`2026-09-22-source-ava-event-artifact-alias-reconciliation`

## Status

`candidate`

## Plain-English Summary

Source aVa stage-completion answers now use every artifact registered to the exact event when those
artifacts carry different accepted aliases for the same tenant. This keeps the answer's file count
and artifact-review blockers aligned with the mounted Files and Approvals surfaces. The event fence
remains explicit, so an artifact from another event is not admitted merely because it belongs to the
same tenant.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes only the Source aVa evidence-readiness projection.
- Layers 1-3: no intake, adapter, canonical row, artifact row, approval, parser, or index state changes.

## Client Applicability

- All clients: yes, for Source event stage-completion and evidence-readiness answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Resolve accepted tenant aliases through the shared tenant alias registry before filtering the
  event-scoped artifact set.
- Require every admitted artifact to match one of the exact event aliases through either its event
  identity or canonical event-row identity.
- Add a live-shape regression with three accepted tenant aliases, a foreign-tenant row, and an
  opposite-event row.

## QA / Validation

- RED FIRST: the focused suite returned two stored files instead of four and marked two registered
  gate artifacts as not registered.
- PASS: `npm test -- --runInBand src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts`
  completed 12/12 tests.
- MUTATION: removing the event fence admitted the opposite-event artifact, changed the count from
  four to five, and failed the new regression. The fence was restored afterward.
- PASS: scoped ESLint on the implementation and focused test.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS: release check and `git diff --check`.
- Pending: hosted PR checks.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned Azure Container Apps main
workflow builds and deploys the exact merged revision. No migration, data build, data mutation,
parser/index job, approval action, lifecycle transition, supplier contact, or external send is part
of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none from this change.
- Approved image digest: pending repo-owned deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling the answer live-proven.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned workflow. No database or tenant-data
rollback is required.

## Audit Evidence

- Focused test output and mutation failure from this branch.
- Pull request and hosted checks.
- Repo-owned deployment run and runtime-invariant artifact.
- Signed-in replay of the stage-completion question after deployment.

## Known Gaps

- Deployment and signed-in replay are pending.
- This release does not accept client-final artifacts, approve a stage, run parsers, or make evidence
  agent-ready.
