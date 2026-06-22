# 2026-06-22-aca-deploy-rerun-idempotency — ACA Deploy Rerun Idempotency

## Release ID

`2026-06-22-aca-deploy-rerun-idempotency`

## Status

`candidate`

## Plain-English Summary

The main Azure Container Apps deploy workflow now handles reruns without failing solely because the original revision suffix already exists. If the existing revision already has the intended digest, the workflow reuses it. If a rerun built a new digest for the same commit, the workflow creates a deterministic rerun revision suffix and then runs the normal traffic and invariant checks.

## Layer Impact

- `global-control-lane`: Changes only the shared deploy workflow for the ACA Product/Lab runtime. It does not change application behavior, tenant data, flags, DNS, or schemas.

## Client Applicability

- All clients: Indirectly, because all clients share the ACA web runtime deploy path.
- Specific clients: None.
- Internal only: Deploy operators and release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/aca-main-deploy.yml` now selects the effective revision created or reused by the deploy step.
- Deploy reruns reuse an existing revision when its image digest matches the current build.
- Deploy reruns choose a rerun-safe suffix when the base commit suffix already exists with a different digest.
- Traffic shifting now retries while Azure finishes active Container App provisioning operations.

## QA / Validation

- `npm run release:check` passes.
- Workflow YAML parsed with Ruby `Psych`.
- Local shell syntax smoke covered the deploy script body extracted from the workflow.
- Live ACA runtime was separately checked before the change: template and 100% traffic were already on the expected main revision.

## Rollout Plan

Merge to `main`. The next ACA main deploy run will use the hardened workflow. No data migration, DNS change, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: GitHub Actions OIDC principal for the main deploy workflow.
- Approved image digest: Resolved by the workflow from the `main-<shortsha>` ACR tag before deploy.
- ACA runtime invariant: Existing post-deploy invariant remains required: template image, 100% traffic revision, and active revision image must match the expected digest.
- Worker image invariant: Existing worker-job image update remains in the workflow.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Not required for this workflow-only hardening; application behavior is unchanged.

## Rollback Plan

Revert this workflow change. The prior workflow behavior will return: one fixed revision suffix per commit and no retry around traffic shifts.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live runtime evidence before PR: ACA template and 100% traffic revision both pointed at `ca-abarva-web-lab-eastus--m29a2ae85`.

## Known Gaps

This change hardens the repo-owned deploy workflow, but it does not retroactively turn the already-failed GitHub Actions run green. The next `main` deploy, or a new workflow dispatch after this PR lands, is the proof that the rerun path is fixed. Manual Azure Portal or `az` mutations are still governed by cloud RBAC outside this workflow.
