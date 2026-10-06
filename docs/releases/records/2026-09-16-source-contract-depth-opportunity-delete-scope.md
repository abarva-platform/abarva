# 2026-09-16-source-contract-depth-opportunity-delete-scope

## Release ID

`2026-09-16-source-contract-depth-opportunity-delete-scope`

## Status

`candidate`

## Plain-English Summary

The contract-depth package loader now limits opportunity replacement to the tenant and dataset version being loaded. A rerun can still replace its own opportunity row without deleting a row from another dataset version that uses the same opportunity identifier.

## Layer Impact

`client-data-lane`: Layer 3 canonical Source opportunity writes. The change narrows one delete predicate; it does not change package inputs or product read models.

## Client Applicability

- All clients: Applies when the shared contract-depth operator loader is used.
- Specific clients: None.
- Internal only: Operator data-build path.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/load-contract-depth-package.ts`: include `dataset_version` in the opportunity delete predicate and bind parameters.
- `scripts/source/__tests__/load-contract-depth-package.test.ts`: verify cross-version isolation and same-version replay using a disposable local PostgreSQL table when PostgreSQL tools are available.

## QA / Validation

- Focused loader test: passed, including a red-before assertion and green-after disposable PostgreSQL replay.
- Scoped ESLint: passed.
- TypeScript check (`tsc --noEmit`): passed.
- Release check (`npm run release:check`): passed.
- No shared data-plane mutation or live product proof is part of this candidate.

## Rollout Plan

The change takes effect only when a future approved operator job runs code containing this loader. No migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for any shared runtime rollout.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Not checked; no deployment requested.
- Worker image invariant: Not checked; no deployment requested.
- Feature/env flag update path: None.
- Live signed-in proof required: Required separately if a future rollout makes live product claims.

## Rollback Plan

Revert the loader change through the normal release path before any later operator run. A completed data-build requires a separate, evidence-backed data-plane recovery decision; reverting code alone does not restore deleted rows.

## Audit Evidence

The focused test's red-before and green-after results, local validation output, and this branch's diff.

## Known Gaps

Opportunity ownership across packages and existing data-plane reconciliation are outside this change.
