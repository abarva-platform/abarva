# 2026-09-19 Workflow Run Command Parser

## Release ID

`2026-09-19-workflow-run-command-parser`

## Status

`candidate`

## Plain-English Summary

Makes the shared CI workflow parser recognize legal one-line YAML sequence steps such as `- run: npm test`. The test-coverage census now uses that shared behavior directly instead of carrying a private normalization workaround.

## Layer Impact

- Release lane: `global-control-lane`.
- CI and audit tooling only.
- No product runtime behavior changes.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Teach the shared workflow command extractor to accept an optional YAML sequence marker.
- Add a failing-first parser case for a compact one-line test command.
- Remove the duplicate compact-step normalization from the test-coverage census.

## QA / Validation

- PASS: failing-first parser suite produced 1 failure and 5 passes.
- PASS: corrected parser suite passes 6 of 6 tests.
- PASS: test-coverage census behavior suite passes 11 of 11 tests.
- PASS: live census completes with 2,276 Jest files, 375 workflow-covered, 372 pull-request-covered, and 1,901 uncovered on this branch.
- PASS: TypeScript (`npx tsc --noEmit`, Node 24 with an 8 GB heap).
- PASS: scoped ESLint, release control, and whitespace checks.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This is CI and audit tooling only.

## Rollback Plan

Restore the stricter parser expression and the census normalization helper. No runtime, data, or schema rollback is required.

## Audit Evidence

- Failing-first and corrected Node test output.
- Test-coverage census behavior output and live report.
- TypeScript, lint, release-control, and diff checks.

## Known Gaps

The committed census refresh policy remains a separate decision. This change only removes the parser inconsistency.
