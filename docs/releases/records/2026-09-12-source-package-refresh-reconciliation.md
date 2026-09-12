# 2026-09-12-source-package-refresh-reconciliation — Source package refresh reconciliation

## Release ID

`2026-09-12-source-package-refresh-reconciliation`

## Status

`candidate`

## Plain-English Summary

Repeated Source package loads now reconcile the complete dataset-scoped row set. Rows that are no
longer present in the incoming package are removed inside the same transaction before the package
is written, so readback counts describe the package that was actually loaded rather than a mixture
of current and stale rows.

## Layer Impact

- **Lane:** `client-data-lane`
- **Layers:** Layer 2 source adapters and Layer 3 canonical snapshots. Cleanup is limited to the
  same tenant and dataset version; it does not change rows for another dataset or tenant.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic Source package validation only.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/load-cloud-consumption-package.mjs` — dataset-scoped reconciliation for adapter
  rows and canonical snapshots before upsert.
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts` — regression coverage for both
  cleanup paths.
- This release record.

## QA / Validation

- PASS: focused Source loader, readiness, purpose, and browser-contract tests.
- PASS: TypeScript, ESLint, and `git diff --check`.
- Required after merge: digest-pinned ACA deployment and runtime invariant.
- Required after deployment: the approved ACA operator batch through Layer 2, Layer 3, readback,
  Layer 4, and readback, followed by signed-in Source proof.

## Rollout Plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, prove the runtime
invariant, then run the approved package through the ACA operator job with a new idempotency key.

## Deployment Authority

- Repo-owned ACA deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Data mutation: ACA operator job only; no production web request performs the load.
- Live signed-in proof: Required for the affected Source Contract 360 routes.

## Rollback Plan

Rollback the web runtime through the approved ACA path if the loader regresses. No schema rollback
is required. Do not rerun an older loader against the package until its reconciliation behavior and
readback contract have been reviewed.

## Audit Evidence

- PR and merge commit for this release.
- Focused test output and package plan output.
- ACA deployment artifact with the approved image digest and runtime invariant.
- ACA operator-job proof bundles and Layer 2/3/4 readbacks.
- Signed-in Source route proof after the refresh.

## Known Gaps

This release fixes refresh correctness for a package that is already governed and does not classify
unmapped portfolio register rows, invent document evidence, or replace missing client packages.
