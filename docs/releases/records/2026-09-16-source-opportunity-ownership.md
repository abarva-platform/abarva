# 2026-09-16 Source Opportunity Ownership

## Release ID

`2026-09-16-source-opportunity-ownership`

## Status

`candidate`

## Plain-English Summary

Source package loaders now require explicit, reciprocal per-contract opportunity ownership. One package writes canonical opportunity rows; a contributing package continues to load contract and operating evidence without writing competing opportunities for that contract. Missing or conflicting declarations stop the load before database access.

## Layer Impact

`client-data-lane`: Layer 1 package metadata declares ownership. Layer 2 adapter evidence remains intact. Layer 3 opportunity writes and readback expectations follow the declaration. No product projection or schema changes are included.

## Client Applicability

- All clients: No automatic runtime change.
- Specific clients: Only packages named in the ownership manifest; other packages retain current behavior.
- Internal only: Operator-run package loaders.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Add a per-contract ownership manifest and shared validator.
- Gate both package loaders' opportunity writes and expectations by declared ownership.
- Add focused plan-mode tests for canonical, evidence-only, missing/conflicting, and unrelated package cases.

## QA / Validation

- Focused ownership and adjacent loader tests: passed (40 tests across 4 suites). The ownership suite failed before the loader gates were added and passed after.
- Scoped ESLint and TypeScript no-emit checks: passed.
- Release check: passed.
- No database, Azure, or product-runtime mutation performed.

## Rollout Plan

Merge only after review as a separate behavior slice. Apply to data only through a separately approved operator run with preflight reconciliation of existing opportunity and dependent rows, followed by tenant- and dataset-scoped readback. This candidate does not authorize a data run or deployment.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked by this candidate.
- Shared runtime mutators: None authorized.
- Approved image digest: Not applicable to this code-only candidate.
- ACA runtime invariant: Not checked; no runtime claim.
- Worker image invariant: Not checked; no worker update.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a separately approved deployment or data run.

## Rollback Plan

Revert the code and manifest before any data run. After a data run, reconcile row lineage and dependent references before any rollback; code reversal alone does not restore canonical data state. Do not delete cross-dataset rows as a rollback shortcut.

## Audit Evidence

- Focused test output, TypeScript and ESLint results, release-check result, and the separate PR diff.
- Any later data run requires its own before/after readback and approval evidence.

## Known Gaps

- No live data reconciliation, apply-mode integration, or signed-in product proof in this code-only candidate.
- Existing same-version competing opportunities must be reconciled before an evidence-only package can pass Layer 3 readback.
- Cross-dataset opportunity deletion is a separate prerequisite fix; this release does not change that path.
- Calculation-state semantics are a separate follow-up and are not changed here.
