# 2026-09-19-test-ci-governed-risk-ranking — Rank uncovered tests by governed responsibility

## Release ID

`2026-09-19-test-ci-governed-risk-ranking`

## Status

`candidate`

## Plain-English Summary

The test CI coverage census now ranks uncovered test directories by the governance responsibility of the product code their tests import. Declared AI controls, approval or lifecycle writers, and tenant-scoped readers rank ahead of inert helpers even when the helper directory contains more tests.

## Layer Impact

`global-control-lane`: repository quality tooling and its generated architecture evidence only. No product runtime, tenant data, schema, migration, prompt, or model path changes.

## Client Applicability

- All clients: no client-facing behavior changes.
- Specific clients: none.
- Internal only: all engineering and release-control operators receive the improved ranking.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts`
- `docs/architecture/test-ci-coverage-census.json`
- This release record.

## QA / Validation

- PASS: focused behavior suite, 12 of 12 tests.
- PASS: a fixture proves a one-test governed surface outranks a larger inert test directory.
- PASS: three mutations were caught: removing control priority, allowing unclassified rows into the governed summary, and removing the tenancy resolver signal.
- PASS: the generated census was refreshed from the same executable logic.
- PASS: the ranked head was executed as the scope decision. `src/__tests__/integration/programs` ran 66 suites / 1,495 tests, with 48 suites passing, 17 failing, 1 skipped, and 31 failing tests. It is therefore a triage tranche, not safe to wire wholesale as a merge gate yet.
- PASS: TypeScript and scoped ESLint.
- PASS: release control and diff hygiene after this record was aligned to the enforced template.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned ACA workflow may deploy the descendant image; no runtime behavior depends on this report.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: resolved by the repo-owned deploy after merge.
- ACA runtime invariant: required if the descendant image deploys.
- Worker image invariant: required if the descendant image deploys.
- Feature/env flag update path: none.
- Live signed-in proof required: no; no product behavior changes.

## Rollback Plan

Revert the release commit. The previous test-count ordering and census shape are restored without data or runtime impact.

## Audit Evidence

- Focused Jest output for `test-ci-coverage-census.test.ts`.
- Mutation outputs showing all three governance signals are load-bearing.
- Programs integration baseline JSON showing the ranked-head decision.
- Generated `docs/architecture/test-ci-coverage-census.json`.
- Pull-request checks and repo-owned deployment evidence after merge.

## Known Gaps

The ranking is deterministic static analysis, not a claim that every imported source is executed by every test. Dynamic module resolution remains explicitly outside the census and is reported separately when a Jest invocation cannot be resolved.

The first scope decision is to triage the 17 failing Programs integration suites before registering that directory in CI. This release does not weaken those assertions or import a known-red directory into the merge lane.
