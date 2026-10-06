# 2026-09-21-source-approvals-readable-audit — Reader-Friendly Decision Trail

## Release ID

`2026-09-21-source-approvals-readable-audit`

## Status

`candidate`

## Plain-English Summary

The Source New decision trail now presents recorded stages, artifacts, criteria, and automated actions with reader-facing names instead of internal storage keys. Unresolved human identities remain explicitly unresolved rather than being guessed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes only the Source New activity-log read projection and its display text.
- Layer 3, Canonical Model: no stored activity records or identities are changed.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Resolve canonical stage labels through the Source stage registry.
- Resolve known artifact codes through the governed artifact specification registry.
- Humanize unknown decision keys without claiming additional semantics.
- Present the recorded automation role as aVa while preserving named people and unresolved identities.

## QA / Validation

- PASSED: focused activity-log behavior suite.
- PASSED: red-first cases for automation actors, canonical stage and artifact labels, and unknown-key fallback.
- PASSED: mutation check restoring leaked internal labels.
- PASSED: scoped ESLint and TypeScript.
- PASSED: release check and diff check.

## Rollout Plan

Squash merge to `main`; the repo-owned Azure Container Apps workflow builds and deploys the exact merged revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on the Source New Approvals decision trail.

## Rollback Plan

Revert the squash commit and allow the repo-owned deployment workflow to restore the prior read projection. No data rollback is required.

## Audit Evidence

- Focused test and mutation output.
- Pull request checks and squash commit.
- Repo-owned deployment runtime-invariant artifact.
- Signed-in Source New Approvals readback after deployment.

## Known Gaps

This release does not repair missing person display-name snapshots in historical activity rows.
