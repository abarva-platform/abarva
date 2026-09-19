# 2026-09-19-integration-root-suite-ownership — Own the loose integration-root suites without naming the root

## Release ID

`2026-09-19-integration-root-suite-ownership`

## Status

`candidate`

## Plain-English Summary

The integration test workflow now explicitly owns the passing test files that live directly under
`src/__tests__/integration`. It still does not name the integration root itself, because that would
also run red subdirectories and turn a known gap into a noisy always-red job.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Control / test tooling:** Adds CI ownership for passing root-level integration suites and
  strengthens the behavior guard that prevents broad root ownership, prefix-style accidents, and
  unclassified loose root files.
- **Product runtime:** No runtime behavior, route, prompt, schema, migration, data-plane, or auth
  behavior changes.

## Client Applicability

- All clients: no runtime client-facing change.
- Specific clients: none.
- Internal only: CI/test-control evidence for the shared repository.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/integration-suites.yml` names 13 measured-green loose root integration suites.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` refuses broad
  `src/__tests__/integration` ownership, verifies each named root file is registered, and records
  the measured-red survivors.
- `docs/architecture/test-ci-coverage-census.json` is regenerated from the workflow resolver.

## QA / Validation

- PASS: 23 previously unowned root suites measured directly: 13 suites / 60 tests pass; 10 suites
  remain red and are deliberately not wired.
- PASS: `npx jest --runTestsByPath src/__tests__/behaviors/integration-directory-ci-coverage.test.ts --no-coverage --ci`
  reported 12 / 12 passing.
- PASS: workflow-shaped green integration command reported 160 passed and 1 skipped suite, with
  4,332 passed and 20 skipped tests.
- PASS: `node scripts/quality/test-ci-coverage-census.mjs --write` reports 732 Jest suites reached
  by a workflow, up 13 from the current pre-edit measurement.
- Mutation caught: removing one explicitly named root file makes the behavior contract fail.
- Mutation caught: adding the broad integration root path makes the behavior contract fail.

## Rollout Plan

Merge to `main`. This only changes GitHub Actions CI ownership and committed test-coverage
measurement output. No Azure Container Apps deploy, migration, feature flag, data build, traffic
shift, or runtime runbook is required.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. That returns the 13 loose root suites to their prior unowned state and restores the
previous census. No runtime rollback is needed.

## Audit Evidence

- Focused behavior contract output.
- Direct 23-suite root measurement output.
- Workflow-shaped integration command output.
- Regenerated `docs/architecture/test-ci-coverage-census.json`.
- Mutation logs for the missing-file and broad-root cases.

## Known Gaps

Ten measured-red loose root suites remain out of the green integration workflow until separate
owner items repair or quarantine them by name.
