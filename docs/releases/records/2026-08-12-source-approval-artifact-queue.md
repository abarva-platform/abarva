# 2026-08-12-source-approval-artifact-queue — Clarify Source Approval Artifact Queue

## Release ID

`2026-08-12-source-approval-artifact-queue`

## Status

`candidate`

## Plain-English Summary

The Source approval workspace now makes the gate boundary clearer when workflow inputs are complete but required artifacts are still unresolved. Instead of implying that a completed checklist is enough to approve the stage, the approval readiness card says the artifact queue blocks the gate and sends the user back to clear the queue.

## Layer Impact

- Product layer: updates Source event approval presentation only.
- Canonical/data layers: no schema, adapter, data-plane, or persistence changes.

## Client Applicability

- All clients: yes, for tenants using the shared Source event journey UI.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source approval readiness copy now distinguishes workflow completion from artifact gate readiness.
- The Files action in the approval workspace is labeled as clearing the artifact queue rather than simply opening Files.
- Regression coverage asserts that a complete workflow with artifact gaps is not presented as gate-ready.

## QA / Validation

- PASS: focused Source stage approval unit test.
- PASS: ESLint on touched files.
- PASS: diff whitespace check.
- PASS: TypeScript check.
- PASS: release control gate.
- NOT RUN YET: PR checks.
- NOT RUN YET: ACA deploy proof through the repo-owned workflow.
- NOT RUN YET: signed-in browser proof on the Source approval workspace.

## Rollout Plan

Merge through a pull request to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. Live proof must be captured on the signed-in Source approval workspace before calling this released.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to restore the previous approval readiness language. No data rollback is required.

## Audit Evidence

Pending:

- PR URL and checks.
- ACA workflow run and evidence bundle.
- Signed-in browser proof file and screenshot.

## Known Gaps

This release clarifies the approval gate wording. It does not create missing artifacts, change parsing behavior, or alter approval persistence.
