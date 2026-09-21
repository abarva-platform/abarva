# 2026-09-20-governance-tenant-green-suite-ownership — Governance and tenant CI ownership

## Release ID

`2026-09-20-governance-tenant-green-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Nine previously unowned, measured-green governance, tenant, and search suites
now run on every pull request. Five failing files and one legacy compatibility
suite remain named quarantines.

## Layer Impact

- `global-control-lane`: test and release-control coverage only.
- No client intake, adapter, canonical-model, runtime, schema, or data changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: CI workflow and coverage evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add nine measured-green suite files to the pull-request unit workflow.
- Preserve five measured-red files and one architecture-blocked compatibility
  suite as exact quarantines.
- Add a behavioral contract for the workflow set and three census splits.
- Refresh the generated test-coverage census.

## QA / Validation

- PASS: measured 16 files as 16 loaded, 16 collected, 16 run, 11 green,
  and five red; one green file was already workflow-owned.
- PASS: canonical tenant coverage reads the code-owned tenant registry.
- PASS: the database compatibility module has one live component importer, but
  its legacy client import is rejected by the architecture gate and remains
  quarantined rather than bypassing that control.
- PASS: all nine newly-owned green files and the behavioral contract run locally.
- PASS: mutation check removes one green entry and makes the contract fail.
- PASS: generated census check, TypeScript, focused ESLint, and release check.

## Rollout Plan

Squash-merge through the protected repository after the preceding workflow PR.
The repository-owned main ACA workflow carries the exact merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository workflow only.
- Approved image digest: recorded from the post-merge workflow artifact.
- ACA runtime invariant: template, active revision, and worker digests must
  match before deployed status is recorded.
- Worker image invariant: required.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; this is a CI-only control change.

## Rollback Plan

Revert the workflow, behavioral test, census refresh, and this record. The
five red suites and their product findings are not altered by rollback.

## Audit Evidence

- Workflow names all nine newly-owned green files explicitly.
- Behavioral test requires 5/8 governance, 1/4 root-library, and 4/4 search
  suite coverage in the generated census.
- Existing context-corpus workflow continues to own policy-exceptions tests.

## Known Gaps

- Three governance fixtures remain red on current context-policy behavior.
- Active-client display expectations and the tenant-purity scan remain red.
- The database compatibility suite remains green but unwired because the
  architecture gate rejects newly owned legacy client dependencies.
