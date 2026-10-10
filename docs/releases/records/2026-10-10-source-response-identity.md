# 2026-10-10-source-response-identity - Canonical supplier response intake

## Release ID

`2026-10-10-source-response-identity`

## Status

`candidate`

## Plain-English Summary

Source New response workbooks must name an accepted supplier by its canonical ID. A matching supplier name or filename no longer makes a response appear uploaded or parsed for that supplier. A durable event-activity receipt shows the upload before parser output is accepted. A workbook that declares a different supplier is refused before storage, and other event stages cannot write normalized response facts.

## Layer Impact

- **Release lane:** `global-control-lane`; the behavior applies to the shared Source New product path.
- **Source adapters:** The response workbook parser can carry an explicitly supplied canonical supplier ID; other callers retain their existing parsing behavior.
- **Products:** Source New submits the selected accepted supplier ID and reads upload state through a scoped event-activity receipt plus the exact registered artifact. Parsed and accepted response facts remain separate from the upload receipt.
- **Canonical model:** No schema or identity record changes. The existing accepted-candidate authority remains the source of supplier identity.

## Client Applicability

- All clients: Source New response workbook uploads and readback.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

The Source New supplier selector, response upload route, workbook parser, scoped activity-receipt reader, and response-intake read model. No migration or data load.

## QA / Validation

- PASS: Seven focused Jest suites, 130 tests, cover canonical ID submission, pre-storage identity-conflict refusal, activity-receipt write/read failure, parser ID propagation, readback isolation between same-named suppliers, exact-artifact readback when filename inference uses a pricing family, and refusal of packages from other event stages.
- PASS: Mutation proof: replacing exact-ID package matching with name matching fails both the wrong-ID and same-name cases; the original matcher was restored.
- PASS: Typecheck on the candidate tree.
- PASS: CI coverage census, all 11 release gates, and targeted ESLint with zero errors and three existing test-file warnings. The new reader suite is registered in the PR workflow.
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

Existing response packages with name-derived IDs are intentionally not reassigned. If a receipt write fails after artifact registration, the route returns an explicit error and artifact ID; operators must reconcile that unlinked artifact before retrying. The external portal invitation and release-to-portal handoff remain separately gated by recipient authority and database readiness. This release does not claim the multi-response comparison or scoring experience is complete.
