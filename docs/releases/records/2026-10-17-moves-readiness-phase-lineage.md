# 2026-10-17-moves-readiness-phase-lineage — retain each transition review

## Release ID

`2026-10-17-moves-readiness-phase-lineage`

## Status

`candidate`

## Plain-English Summary

Saving a readiness workbook or its review could supersede the same artifact type from another phase. Readiness artifacts now advance their version and supersede history only within the same transition, so one phase cannot hide another phase's reviewed workbook.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3: readiness artifact lineage is scoped to Move, artifact type and phase. Native evidence and approval decisions remain unchanged.
- Layer 4: gate and generation readers retain access to the current workbook for each transition.

## Client Applicability

- All clients: subsequent readiness workbook and review saves.
- Specific clients: none.
- Internal only: no new operator capability.
- Public/demo only: no restriction.
- Feature flag: none.

## Changes Included

The artifact writer reads readiness version history within the target phase, including previously superseded versions to avoid reusing an old Blob path. Other artifact types retain their existing version scope. Historical cross-phase supersedes are not silently restored; the normal workbook upload and review path creates a new version.

## QA / Validation

PASS: 29 targeted artifact tests cover both readiness types, a first workbook in a new phase, prior superseded Blob versions, failed lineage reads and ordinary artifact lineage. PASS: TypeScript, scoped lint and all 11 release checks. Live signed-in proof must show both transition workbooks remain readable after resaving one.

## Rollout Plan

Squash merge through a PR, then deploy using the repo-owned ACA main workflow. Re-upload and review any affected historical transition through the normal authenticated product path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: successful main workflow output.
- ACA runtime invariant: template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: both delivery worker jobs match the approved digest.
- Feature/env flag update path: no flag or environment changes.
- Live signed-in proof required: current readiness for two transitions and version-bound review readback.

## Rollback Plan

Revert this code through the same PR and ACA workflow. No migration or destructive data mutation is included. Preserve created artifact versions and Blob history. A rollback reintroduces the cross-phase supersede defect, so avoid further readiness saves until the corrected writer is restored.

## Audit Evidence

PR, targeted test output, release checks, main deployment, runtime invariant, signed-in transition readiness readback and artifact version history.

## Known Gaps

Existing cross-phase superseded records need a fresh upload and review. This change does not grant approval or attest to evidence quality.
