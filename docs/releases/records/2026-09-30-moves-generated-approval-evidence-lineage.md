# Moves generated approval evidence lineage

## Release ID

`2026-09-30-moves-generated-approval-evidence-lineage`

## Status

`candidate`

## Plain-English Summary

Moves now checks that a signed-off generated deliverable is tied to the current approved-evidence revision. The approval record and the artifact it points to must agree; a missing, stale, superseded, or out-of-scope artifact no longer counts as a satisfied phase gate. Historical phases can be re-evaluated for reapproval without changing the Move's stored current phase.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: No canonical enterprise data or schema changes. Reads are constrained by tenant key and Move ID; no data is backfilled or manually edited.
- Layer 4: Moves approval and phase-gate routes now require current evidence lineage for generated or artifact-linked deliverables.

## Client Applicability

- All clients: All Moves approvals that use generated deliverables or linked approved artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The governance gate resolves `deliverables_v2.approved_artifact_id` only within the active tenant and Move, and validates artifact family, lifecycle, deliverable association, and evidence revision.
- Generated-version sign-off verifies the version's evidence revision and records it on the authoritative deliverable approval.
- Uploaded approved replacements record the current evidence revision on the linked artifact.
- Phase approval status and historical reapproval validate the phase's hard gate before reporting or recording approval.
- No migration, feature-flag change, phase-state mutation, or readiness-gate bypass.

## QA / Validation

- Pass: The linked-artifact/no-evidence-lineage regression failed before the fix and passed after it.
- Pass: Focused governance, phase approval, sign-off, and approved-upload suites: 82 tests passed.
- Pass: Cross-tenant artifact-link and historical reapproval cases are covered.
- Not run: Full CI, release check, deployed runtime, and signed-in product acceptance.

## Rollout Plan

Squash-merge through a PR after local validation. Deploy only through `.github/workflows/aca-main-deploy.yml`. No database migration or flag operation is required. The change applies to all tenants when the approved main image receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending exact merged-SHA workflow output.
- ACA runtime invariant: Pending verification of template image, 100%-traffic revision, and both worker job images.
- Worker image invariant: Pending exact digest comparison.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify a stale generated approval remains blocked, rebuild and approve against current evidence, then verify the phase can be reapproved without rolling back the Move.

## Rollback Plan

Revert the merged change through a follow-up PR and deploy it through the same main workflow. No schema rollback is required. Until rollback is deployed, stale or unbound generated approvals remain blocked; do not repair them by direct database edits or by weakening the readiness gate.

## Audit Evidence

Regression and mutation tests, PR review and CI, release-check output, exact merged-SHA ACA workflow and runtime-invariant artifacts, and signed-in phase-gate readback.

## Known Gaps

The signed-in synthetic Move journey and the full P0-P5 smoke test remain pending. Existing generated approvals with missing or stale lineage require regeneration or an explicit human-reviewed replacement through product flows before their phase gate can pass.
