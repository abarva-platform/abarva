# 2026-09-17-source-opportunity-rewrite-action-guard

## Release ID

`2026-09-17-source-opportunity-rewrite-action-guard`

## Status

`candidate`

## Plain-English Summary

A package loader now refuses to replace its opportunity records when the same writer scope has approval, review, negotiation, Finance, or other operator action. The check runs before any opportunity-spine delete. It requires an unfiltered database role so an RLS-hidden action cannot look like an empty result.

## Layer Impact

`client-data-lane`: Layer 3 canonical Source opportunity writes. No schema, package input, or product read model changes.

## Client Applicability

- All clients: Applies to any tenant/dataset processed by this operator loader.
- Specific clients: None in this public record.
- Internal only: Operator data-build path.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/load-cloud-consumption-package.mjs`: run the scoped action guard immediately before replacing opportunity-spine rows.
- `scripts/source/opportunity-rewrite-guard.mjs`: check exact tenant, dataset, opportunity, case, calculation, and contract IDs with an unfiltered read requirement.
- `scripts/source/__tests__/opportunity-rewrite-guard.test.mjs`: scope, action, failed-read, and disposable PostgreSQL/RLS tests.

## QA / Validation

- Focused Node tests with disposable local PostgreSQL: passed (6 tests).
- Existing package-loader Jest tests: passed (9 tests).
- Scoped ESLint and repository TypeScript check: passed.
- Release check: passed against `origin/main` after the public-prose correction.
- No shared data-plane mutation or live product proof performed.

## Rollout Plan

The guard becomes available in a future approved operator image. A separate, governed data-build job would be required to exercise it against any client dataset. No migration or runtime flag is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: Required for any later shared runtime rollout.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Not checked; no deployment requested.
- Worker image invariant: Not checked; no deployment requested.
- Feature/env flag update path: None.
- Live signed-in proof required: Separate from this code-only candidate.

## Rollback Plan

Revert the loader guard through the normal release process before any later operator run. No data rollback is needed because this candidate does not run a data build.

## Audit Evidence

Focused test output, scoped validation results, and this branch's diff. The PostgreSQL replay uses a disposable local cluster and generic fixture identifiers.

## Known Gaps

This is a transaction-time preflight, not a cross-system write lock. An independently committed human action racing the check is not serialized unless that writer participates in the same locking protocol. A later workflow-wide lock or database-enforced invariant is needed for that concurrency guarantee.
