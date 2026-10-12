# 2026-10-12 Tower deployed-ancestor schema binding

## Release ID

`2026-10-12-tower-schema-deployed-ancestor`

## Status

`candidate`

## Plain-English Summary

The Tower schema operator can inspect a digest-pinned image built from an earlier `main` commit while unrelated commits wait for deployment. An explicit full commit SHA is required for this path. The workflow checks that the deployed commit is in current `main` history and that the Tower approval, input registry, migrations, job code, and direct dependencies have not changed between that commit and current `main`. The default path still requires current `main` itself to be deployed.

## Layer Impact

- **Release lane:** `client-data-lane` operator orchestration.
- **Layers 1–3:** No intake, adapter, canonical data, or schema change in this release.
- **Products:** No Tower page or serving change in this release.

## Client Applicability

- **All clients:** The operator guard applies to the shared lab schema workflow.
- **Specific clients:** The existing exact registered synthetic candidate approval remains required by the image-bound Tower script.
- **Internal only:** Workflow dispatch and proof binding.
- **Public/demo only:** No direct change.
- **Feature flag:** None.

## Changes Included

- Add an optional complete `deployed_sha` input to the Tower-only schema workflow. Omission keeps the current-main requirement.
- Compare the image-bound Tower contract, approval manifests, registry, exact migration files, operator script, direct import, and package scripts from both the workflow head and deployed commit against current `main`. Reject changed or non-ancestor commits.
- Bind the public run receipt to the workflow head, deployed image source SHA, current main SHA, and the live digest shared by the web template, sole 100% traffic revision, and both worker jobs.
- Repeat the ancestry and contract check immediately before the read-only status job and before any apply. Repeat worker image parity immediately before apply.

## QA / Validation

- Focused Git-history tests cover an unchanged deployed ancestor, default current-main enforcement, a changed Tower operator contract, and a changed runner workflow.
- Workflow YAML parsing, targeted ESLint, diff hygiene, and all release gates must pass before merge.
- A live read-only status run and private proof are required after merge; local tests do not prove database state.

## Rollout Plan

Merge through a protected squash PR. Operators may dispatch `status` on `main` with the full SHA of a still-deployed main ancestor only when the protected contract files are unchanged. The workflow verifies the live ACR digest, web revision, worker images, operator idle state, exact migration hashes and ledger, active Tower selection, page fingerprints, and private Blob proof. `apply` still requires explicit confirmation and a fresh read-only preflight; this release does not authorize or dispatch it.

## Deployment Authority

- Repo-owned ACA main deploy workflow remains the only shared web traffic authority.
- This change does not update the web app, workers, or shared operator outside the existing exact schema workflow.
- Runtime images remain digest-pinned and must match across the web template, 100% revision, and required workers.

## Rollback Plan

Stop dispatches with `deployed_sha` or revert this workflow and runner guard through a protected PR. Previously applied migrations, if any, remain governed by their own ledger and readback; this release performs no database write.

## Audit Evidence

Retain the workflow's ancestor binding, runtime digest binding, redacted status receipt, private Blob proof SHA/URI and readback result, and operator idle receipt. Full tenant and schema evidence stays in private Blob.

## Known Gaps

An earlier deployed image cannot be used after the candidate approval, Tower contract, or protected operator files change on `main`. A new candidate must receive its own exact approval and image-bound review before data stage or serving promotion.
