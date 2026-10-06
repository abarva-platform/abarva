# 2026-09-18-source-stage09-economics-coverage - Billing coverage in Contract 360

## Release ID

`2026-09-18-source-stage09-economics-coverage`

## Status

`candidate`

## Plain-English Summary

Contract 360 now shows whether monthly invoice and payment amounts cover the loaded period. It withholds billing totals and reconciliation conclusions when either lane is incomplete. A recorded zero remains a valid amount.

## Layer Impact

Layer 4, Products: the Source Economics projection checks the completeness of its existing monthly billing rows before presenting a billing comparison. The consumption and commitment amounts remain separate measures over loaded periods. Release lane: `global-control-lane`.

## Client Applicability

- All clients: Source Contract 360 Economics views with monthly spend rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

The Economics view counts invoice and paid coverage by month, requiring every row in a month to have a recorded value. When either lane is incomplete, it suppresses both billing totals, the invoice chart series, and reconciliation conclusions. A direct component test covers absent, partial, duplicate-month, recorded-zero, and complete-difference cases.

## QA / Validation

- Direct behavioral test: failed on the original null-as-zero behavior, then passed after the change.
- Deliberate coverage mutation: four of five direct tests failed when invoice completeness was inverted; the original condition was restored and the tests passed.
- Focused Jest: 19 tests passed across three suites.
- Scoped ESLint: passed.
- Full TypeScript check with a 6 GB Node heap: passed.
- `npm run release:check`: passed.
- Signed-in product proof: not performed.

## Rollout Plan

Review through a PR. An authorized merge can enter the repository-owned ACA main deploy workflow. No data-plane operation is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after an authorized merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Not checked; no deployment requested.
- Worker image invariant: Not checked; no worker update requested.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling this product behavior live-proven.

## Rollback Plan

Revert the PR through the normal release path. No schema or tenant-data rollback is required.

## Audit Evidence

The PR diff and local Jest, mutation, lint, TypeScript, and release-check results support this candidate. Deployment and signed-in proof remain separate future evidence.

## Known Gaps

Coverage is assessed only for loaded monthly rows. It cannot establish that the source supplied every expected month or prove invoice exception status.
