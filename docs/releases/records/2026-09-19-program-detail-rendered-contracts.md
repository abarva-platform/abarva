# 2026-09-19 Program Detail Rendered Contracts

## Release ID

`2026-09-19-program-detail-rendered-contracts`

## Status

`candidate`

## Plain-English Summary

Replaces five sets of source-text assertions over the Program detail component with rendered behavior checks. The tests now prove what a user can see and do: live-record labeling, upload guidance, record navigation, the Maestro action composer, and the Phase 0 gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Product assurance only: tests and release evidence; product runtime code is unchanged.

## Client Applicability

- All clients: shared Program detail assurance.
- Specific clients: None.
- Internal only: Release assurance.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Exercise five Program detail contracts through the real rendered component.
- Remove three integration files whose assertions only scanned component source.
- Retain server-route and separate-component checks where client rendering cannot prove the contract.

## QA / Validation

- PASS: focused rendered and retained unit suites, 3 suites / 17 tests.
- PASS: changing the live-record label made the new rendered contract fail 1 of 14 cases; the product file was restored byte-clean.
- PASS: integration CI visibility checker, including its 5 self-tests, confirms the deleted source-scan suites do not create an unowned changed-suite gap.
- PASS: TypeScript no-emit with Node 24 and an 8 GB heap.
- PASS: scoped ESLint, release control, and whitespace diff checks.

## Rollout Plan

Merge through the protected pull-request lane. The existing AI surface workflow must execute the rendered suite before merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable to test-only behavior.
- ACA runtime invariant: Record if the repository-owned workflow builds a new main image.
- Worker image invariant: Record if the repository-owned workflow builds a new main image.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Product runtime behavior is unchanged; the rendered suite replaces source scans.

## Rollback Plan

Revert the test-only commit. No runtime, data, or schema rollback is required.

## Audit Evidence

- Focused Jest output for the real Program detail component.
- Mutation output showing a visible contract fails when removed.
- Pull-request CI output from the existing workflow that owns the rendered suite.

## Known Gaps

Server-route state derivation and separate-component copy remain covered by their own focused tests because mounting the Program detail client cannot prove those contracts.
