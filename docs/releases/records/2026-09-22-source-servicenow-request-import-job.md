# 2026-09-22-source-servicenow-request-import-job - ACA request import job

## Release ID

`2026-09-22-source-servicenow-request-import-job`

## Status

`candidate`

## Plain-English Summary

Adds the repo-owned ACA operator path for the ServiceNow-to-Source request import lane. The workflow defaults to dry-run proof bundle generation. Apply mode is separately gated, must use an exact confirmation phrase, and is limited to immutable request-version rows.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1 client intake: reuses the governed native-shaped request extract and records the input SHA in the operator proof.
- Layer 2 source adapter: reuses the merged ServiceNow sourcing-request loader and validates complete registered-archetype coverage.
- Layer 3 canonical model: apply mode can append request-version rows only after separate authorization. It does not apply migrations, accept mappings, create events, contact suppliers, or approve any Source stage.

## Client Applicability

- All clients: reusable operator workflow after tenant-specific approval.
- Specific clients: None.
- Internal only: The ACA operator workflow and proof artifacts.
- Public/demo only: The checked-in synthetic extract is public-safe.
- Feature flag: None.

## Changes Included

- `.github/workflows/source-servicenow-request-import-job.yml`
- `scripts/source/load-servicenow-sourcing-requests-job.ts`
- `source:servicenow-requests:proof-job`
- ACA wrapper proof-bundle marker support for `source_servicenow_request_import`
- Behavioral tests for dry-run proof, apply refusal, workflow confirmation, and no migration path.

## QA / Validation

- PASS - Job dry-run writes job contract, progress, validation, quality gate, and summary artifacts without database access.
- PASS - Dry-run proof emits a tar bundle marker that the ACA operator wrapper can extract.
- PASS - Apply mode fails closed before database access unless the approval environment variable and exact confirmation phrase are present.
- PASS - Workflow dispatch defaults to dry-run and contains no migration command path.
- PENDING - Hosted CI and final release check complete on the pull request before merge.
- NOT RUN - ACA workflow dispatch, apply mode, tenant data import, migrations, deployment, and signed-in acceptance.

## Rollout Plan

Squash-merge through the protected repository workflow, then deploy the app image through `.github/workflows/aca-main-deploy.yml`. The import does not run on deploy. Operators may dispatch the new workflow in dry-run mode to capture proof against the digest-pinned deployed image. Apply mode remains a separate action-time authorization and must run from `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: `.github/workflows/source-servicenow-request-import-job.yml` submits the existing private ACA operator job only.
- Approved image digest: Resolved from the currently deployed Container App template at workflow runtime.
- ACA runtime invariant: Required after any app deploy; this workflow does not shift web traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, only after a separately approved apply run and request-inbox readback.

## Rollback Plan

Revert the squash commit to remove the workflow, job entrypoint, npm script, and wrapper marker. Dry-run artifacts are local/operator evidence only. If a separately approved apply run inserted immutable request versions, do not delete or rewrite them; supersede through the governed request-version process.

## Audit Evidence

Pull request, hosted CI, focused job tests, workflow artifact bundle, ACA operator wrapper output, dry-run proof bundle, validation JSON, quality-gate JSON, and release check output.

## Known Gaps

- This release does not apply the request-authority migration.
- This release does not run the ACA workflow or import tenant data.
- A future apply run needs separate action-time approval, digest-pinned image proof, operator job logs, data-plane readback, and signed-in request-inbox proof before any live acceptance claim.
