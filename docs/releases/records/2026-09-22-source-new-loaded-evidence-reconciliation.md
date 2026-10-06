# 2026-09-22-source-new-loaded-evidence-reconciliation — Source New Loaded Evidence Reconciliation

## Release ID

`2026-09-22-source-new-loaded-evidence-reconciliation`

## Status

`candidate`

## Plain-English Summary

Source New Intelligence now recognizes that a required scope file is already loaded when its
stored artifact family is generic but its filename matches the canonical, stage-specific evidence
contract. The file remains blocked until governance review makes it agent-ready; the operator is
directed to review the loaded evidence instead of being asked to upload a duplicate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: changes only the Source New Intelligence read projection and its next action.
- Layers 1-3: no intake, adapter, canonical row, parser, indexer, schema, or data-plane behavior changes.

## Client Applicability

- All clients: yes, wherever Source New Intelligence is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source New availability controls apply.

## Changes Included

- Reuses the canonical upload filename matcher to reconcile current loaded artifacts with four
  authored managed-services scope evidence families.
- Passes the recorded filename into the Source New Intelligence projection.
- Keeps inferred loaded evidence in `gap`; it does not make the evidence available or agent-ready.

## QA / Validation

- Red-first focused test failed with the duplicate-upload question before implementation.
- Focused Source New Intelligence suite passed after implementation.
- Mutation removing the application-inventory requirement mapping restored the defect and failed
  the focused suite.
- TypeScript, scoped ESLint, diff check, and release control are required before PR creation.

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the digest-pinned image. No ad-hoc runtime mutation is allowed.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending merge/deploy.
- Worker image invariant: pending merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request. This restores the prior question selection without database rollback or
tenant-data cleanup.

## Audit Evidence

Focused Jest output, mutation output, validation output, PR and CI records, repo-owned ACA evidence,
and a signed-in Source New Intelligence readback on a loaded-but-not-ready scope artifact.

## Known Gaps

- Stored artifact-family quality is unchanged. This release reconciles the operator read path only.
- Loaded evidence remains unusable until its required governance and retrieval checks pass.
