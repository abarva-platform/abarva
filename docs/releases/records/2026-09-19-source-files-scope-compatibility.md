# 2026-09-19-source-files-scope-compatibility — Preserve Artifact Reader Scope Compatibility

## Release ID

`2026-09-19-source-files-scope-compatibility`

## Status

`candidate`

## Plain-English Summary

Keep existing Source artifact callers scoped by client ID while allowing the Source New workspace to request registry-only uploads by governed tenant key. The explicit selector prevents a shared reader change from silently emptying download, render, finalization, or deal-pack paths that still use client IDs.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 compatibility projection: no schema or data mutation.
- Layer 4, Source: artifact reads retain their existing client-ID contract unless a caller explicitly selects tenant-key scope.

## Client Applicability

- All clients using Source artifact reads.
- No client-specific behavior, data, or identifiers are introduced.

## Changes Included

- Restore string arguments to their established client-ID meaning.
- Add an explicit `{ tenantKey }` selector for registry-only artifact reads.
- Make the Source New event page opt into tenant-key scope.
- Add regression tests for both scope modes.

## QA / Validation

- PASS: focused File Cabinet repository tests.
- PASS: 24 existing-caller route tests across artifact listing, download, rendering, and client-finalization.
- PASS: TypeScript with an 8 GB Node heap.
- PASS: scoped ESLint.
- PASS: diff whitespace check.
- PASS: Source New page test after updating the explicit tenant-key selector expectation.
- PASS: release-control check.
- NOT RUN: pull-request CI; required before merge.

## Rollout Plan

Squash-merge through the protected branch. Deploy only through the repository-owned ACA main workflow after the prior candidate deploy has been cancelled.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Live signed-in proof required for Files, Intelligence, Approvals, and one existing artifact download/read path.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned workflow. No database rollback is required.

## Audit Evidence

- Pull request diff and CI checks.
- Cancelled superseded deploy run.
- ACA deployment run and exact merged-SHA readback.
- Signed-in Source New event proof after deployment.

## Known Gaps

- Tenant-key scope is limited to callers that opt in explicitly.
- Visibility of a stored file does not promote it to parsed, reviewed, citation-ready, or agent-ready.
