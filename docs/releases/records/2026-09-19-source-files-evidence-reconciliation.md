# 2026-09-19-source-files-evidence-reconciliation — Reconcile Source Files and Evidence

## Release ID

`2026-09-19-source-files-evidence-reconciliation`

## Status

`candidate`

## Plain-English Summary

Make uploaded Source evidence visible in the Source New Files workspace. Uploads were registered and recorded in the event activity trail, but the Files reader filtered on a compatibility identifier that registry-only uploads did not carry. The result was one event showing an upload in its history while claiming its Files folder was empty.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 compatibility projection: uploaded evidence continues to use the existing canonical artifact registry; no schema or data mutation is introduced.
- Layer 4, Source: the Files and Intelligence projections can now read existing registry-only uploads through the governed tenant key.

## Client Applicability

- All clients: yes, for Source New artifact uploads and event Files views.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Populate the existing File Cabinet compatibility columns on future Source uploads.
- Scope event file reads by canonical tenant key rather than the optional compatibility client ID.
- Safely map older registry-only rows into File Cabinet records without inventing approval or evidence state.
- Extend file-format handling for the formats already accepted by the artifact registry.
- Add regression coverage for registry-only uploads and complete upload metadata.

## QA / Validation

- PASS: 17 focused tests across the repository mapper, Source New event page, and upload route.
- PASS: TypeScript with an 8 GB Node heap.
- PASS: scoped ESLint with no errors; three pre-existing unused-variable warnings remain in the upload test.
- PASS: diff whitespace check.
- PASS: release-control check.
- NOT RUN: pull-request CI; required before merge.

## Rollout Plan

Squash-merge through the protected branch and let the repository-owned ACA main deploy workflow publish the exact merged SHA. No migration, backfill, or feature flag is required; the reader recovers existing registry rows at runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: template, 100%-traffic revision, and required workers must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: the same event must show its uploaded files in Files and make those rows available to Intelligence without changing the activity trail.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned workflow. No database rollback is required.

## Audit Evidence

- Pull request diff and CI checks.
- ACA deployment run and digest readback after merge.
- Signed-in before/after read of Work, Files, Intelligence, and Approvals for one event.

## Known Gaps

- The change makes existing registry uploads visible; it does not mark them reviewed, accepted, or citation-ready. Those states continue to require their governed evidence checks.
- Existing registry-only rows remain compatibility-shaped at read time; a governed canonical artifact-service cutover is a separate architecture step.
