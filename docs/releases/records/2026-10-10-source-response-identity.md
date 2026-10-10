# 2026-10-10-source-response-identity - Canonical supplier response intake

## Release ID

`2026-10-10-source-response-identity`

## Status

`candidate`

## Plain-English Summary

Source New response workbooks must name an accepted supplier by its canonical ID. A matching supplier name or filename no longer makes a response appear uploaded or parsed for that supplier. If the accepted-supplier authority cannot be read, the upload refuses before storing the file.

## Layer Impact

- **Release lane:** `global-control-lane`; the behavior applies to the shared Source New product path.
- **Source adapters:** The response workbook parser can carry an explicitly supplied canonical supplier ID; other callers retain their existing parsing behavior.
- **Products:** Source New submits the selected accepted supplier ID and reads response state only through that ID and its exact registered artifact.
- **Canonical model:** No schema or identity record changes. The existing accepted-candidate authority remains the source of supplier identity.

## Client Applicability

- All clients: Source New response workbook uploads and readback.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

The Source New supplier selector, response upload route, workbook parser, and response-intake read model. No migration or data load.

## QA / Validation

- PASS: Four focused Jest suites, 104 tests, cover canonical ID submission, upload refusal before Blob storage, parser ID propagation, and readback isolation between same-named suppliers.
- PASS: Mutation proof: replacing exact-ID package matching with name matching fails both the wrong-ID and same-name cases; the original matcher was restored.
- PASS: Typecheck on the candidate tree.
- PASS: All 11 release gates and the CI coverage census; targeted ESLint has zero errors and three existing test-file warnings.
- NOT RUN: PR CI and signed-in runtime readback are separate promotion evidence.

## Rollout Plan

Squash merge after applicable checks pass. The repo-owned ACA main workflow builds and deploys the shared web image. This release needs no migration, seed, feature flag, or manual data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Record after deployment.
- ACA runtime invariant: Verify template, 100%-traffic revision, and worker images against the approved digest.
- Worker image invariant: No worker behavior changed; verify the required worker images during runtime proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Upload and read back a governed synthetic response for two accepted suppliers with distinct IDs; do not send external invitations.

## Rollback Plan

Revert this PR through a new PR and let the repo-owned ACA main workflow deploy the rollback. Do not delete or relabel previously stored response packages as part of rollback.

## Audit Evidence

PR checks, focused Jest output, typecheck, mutation result, deployment run, digest-invariant readback, and a signed-in synthetic upload/readback are separate evidence items.

## Known Gaps

Existing response packages with name-derived IDs are intentionally not reassigned. The external portal invitation and release-to-portal handoff remain separately gated by recipient authority and database readiness. This release does not claim the multi-response comparison or scoring experience is complete.
