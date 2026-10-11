# 2026-10-11 Tower Layer 4 Readback Scope

## Release ID

`2026-10-11-tower-layer4-readback-scope`

## Status

`candidate`

## Plain-English Summary

The Tower reload check now distinguishes the rows made by the Tower package from rows added by governed Source extensions. It also checks the declared active assessment and reports when a serving view includes rows from older assessments. A count mismatch remains a failure, with the affected population named in the result.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 Products: Readback checks and evidence only. No source intake, adapter, canonical data, or product row is changed by this release.

## Client Applicability

- All clients: Yes, when this Tower Layer 4 loader is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Check base package counts separately from known Source bridge rows, while rejecting other extra rows.
- Compare serving rows for the target assessment with the declared active generation and tenant-wide view.
- Require the serving bridge count to match the corresponding Source bridge rows in the target assessment.
- Add focused readback tests.

## QA / Validation

- `node --check scripts/tower/load-healthcare-demo-layer4-products.mjs`: passed.
- `node scripts/tower/__tests__/run-layer4-readback-scope-tests.mjs`: passed, six checks.
- `node scripts/tower/__tests__/run-layer4-purge-mode-tests.mjs`: passed, seven checks.
- `node scripts/tower/__tests__/run-layer4-freshness-stamp-tests.mjs`: passed, four checks.
- Scoped ESLint: passed.
- Local Layer 4 dry-run SQL generation and scoped query inspection: passed.
- `npm run release:check`: passed, 11 gates.
- Live database readback on this candidate: not run.

## Rollout Plan

Merge through a pull request. The repo-owned main deployment workflow builds and deploys the approved image. Run the readback in a governed, read-only operator job before any data reload. Any required Source bridge reapply and product proof remain separate gates.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deployment workflow.
- ACA runtime invariant: Template, active revision, traffic revision, and required workers use the approved digest.
- Worker image invariant: Operator jobs use the approved digest.
- Feature/env flag update path: None for this change.
- Live signed-in proof required: Yes, before claiming Tower data is live-proven.

## Rollback Plan

Revert the merge through a pull request and redeploy the approved main image. This change writes no tenant data.

## Audit Evidence

- Pull request, commit, local test output, release check, and later operator readback proof.

## Known Gaps

This release does not repair serving functions that expose retired assessments, rebuild Source bridge rows, or reconcile financial source amounts. It makes those conditions visible to the operator.
