# 2026-09-19 Integration Test CI Visibility

## Release ID

`2026-09-19-integration-test-ci-visibility`

## Status

`candidate`

## Plain-English Summary

Adds a pull-request guard that stops changed integration suites from being described as enforced when no GitHub workflow executes them. The guard follows npm-script calls from real workflows, but does not accept comments or local-only scripts as proof.

## Layer Impact

- Release lane: `global-control-lane`.
- Release assurance only: no product, canonical-data, adapter, schema, or intake behavior changes.

## Client Applicability

- All clients: shared release assurance.
- Specific clients: None.
- Internal only: CI policy and engineering documentation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add the integration-suite CI visibility checker and self-tests.
- Add a pull-request workflow for changed integration suites.
- Record the explicit-registration policy and its measured baseline.
- Add an npm command for local reproduction.

## QA / Validation

- Measured baseline before implementation: 469 suites / 10,541 tests, 124 failing suites, 406 failing tests, 93 seconds.
- Checker self-tests: passed, 5/5.
- Registered and unregistered suite simulations: passed in the checker self-test.
- Mutation check: forcing every changed suite to appear registered made 3 of 5 self-tests fail; the checker was restored before final validation.
- Workflow formatting and diff checks: passed. Release control: passed after the QA statuses were finalized.

## Rollout Plan

Merge through the protected pull-request lane after the new workflow executes on this pull request. It becomes a PR-time release-assurance guard; no product runtime activation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable to the guard itself.
- ACA runtime invariant: Record if the main deploy workflow builds a descendant image.
- Worker image invariant: Record if the main deploy workflow builds a descendant image.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the workflow, checker, documentation, and npm-script entry. No data or schema rollback is required.

## Audit Evidence

- Full-directory baseline output in the private execution log.
- Checker self-test output.
- Pull-request run of `Integration test CI visibility`.

## Known Gaps

The legacy failures remain to be triaged. This release prevents new or changed suites from being falsely described as CI-enforced; it does not make the entire legacy directory green.
