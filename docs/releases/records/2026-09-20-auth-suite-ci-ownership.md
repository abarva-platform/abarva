# 2026-09-20-auth-suite-ci-ownership - Auth suite CI ownership

## Release ID

`2026-09-20-auth-suite-ci-ownership`

## Status

`candidate`

## Plain-English Summary

The pull-request workflow now runs the healthy portion of the authentication and tenancy test tree. Six known-red files remain visible in a named quarantine instead of leaving the entire security-sensitive tree outside CI.

## Layer Impact

- `global-control-lane`: test and release-control coverage for shared authentication and tenancy behavior.
- No client data, schema, migration, product runtime, or model behavior changes.

## Client Applicability

- All clients: future pull requests receive the additional CI coverage.
- Specific clients: none.
- Internal only: CI ownership and its audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add a unit-workflow command for the healthy auth suites.
- Name six known-red files in an explicit quarantine.
- Add a behavioral guard for command ownership and the measured census split.
- Add a negative test proving an ordinary client cannot grant itself Setup access through module metadata.
- Refresh the generated test-to-CI census.

## QA / Validation

- PASS - green auth command: 13 suites and 88 tests.
- BASELINE MEASURED - full auth tree: 19 suites, 206 tests, 195 passing, 11 failures across six named files.
- PASS - CI ownership behavior guard: 2 tests.
- PASS - mutation checks for explicit tenancy, tenant-role identity, Setup access, program scope, Source scope, tenant isolation, and workflow ownership.
- PASS - TypeScript, scoped ESLint, YAML parsing, release control, and repository behavior suite before merge.

## Rollout Plan

Merge through the protected pull-request path. The workflow coverage is active on subsequent pull requests; there is no runtime or data-plane rollout.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a main deploy may run because repository policy deploys every merged change.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved only by the repo-owned deploy workflow after merge.
- ACA runtime invariant: unchanged and checked by the repo-owned workflow if it runs.
- Worker image invariant: unchanged and checked by the repo-owned workflow if it runs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product behavior changed; authenticated product proof is not claimed.

## Rollback Plan

Revert the workflow step, behavior guard, generated census update, and added negative test. No migration or data rollback is required.

## Audit Evidence

- The committed generated census records the exact 19-suite / 13-covered split.
- The workflow and behavior guard name every quarantined file.
- Focused test and mutation outputs are summarized in the pull request.

## Known Gaps

Six quarantined files contain 11 existing failures caused by stale policy or fixture expectations. This release does not rewrite those expectations or claim the quarantined behavior is correct.
