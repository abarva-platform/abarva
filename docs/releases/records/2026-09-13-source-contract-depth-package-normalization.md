# 2026-09-13 — Source contract depth package normalization

## Release ID

`2026-09-13-source-contract-depth-package-normalization`

## Status

`candidate`

## Plain-English Summary

The contract-depth loader now accepts the equivalent column names used by the
staged cloud-consumption and managed-services packages. It preserves their
application identifiers, clause identifiers, and evidence-document links, so
valid dense packages can complete the same governed Layer 2 and Layer 3 path.
Conflicting tenant or dataset identity is still rejected.

## Layer Impact

- `client-data-lane`: Layer 1 package intake now normalizes known equivalent
  source-column names without changing the package's facts or lineage.
- `client-data-lane`: Layer 2 adapter rows retain the source file and row
  identity needed to link scope, clauses, and change orders to evidence.

## Client Applicability

- All clients: shared loader normalization and identity checks.
- Specific clients: none.
- Internal only: controlled operator loading and proof workflow.
- Public/demo only: staged synthetic contract-depth packages.
- Feature flag: none.

## Changes Included

- `scripts/source/load-contract-depth-package.ts`
- `scripts/source/__tests__/load-contract-depth-package.test.ts`
- This release record.

## QA / Validation

- Loader unit tests: passed, 13 tests.
- ESLint on changed TypeScript files: passed.
- Databricks package plan: passed.
- Cloud-consumption package plan: passed.
- Managed-services package plans: passed after normalization.
- Thin five-contract package: blocked as designed because its managed-services
  records do not contain the required resource, invoice, batch, and QBR lanes.

## Rollout Plan

Merge through the protected main PR lane. Build and deploy the exact merged SHA
through the repo-owned ACA workflow. Run only approved packages through the
private ACA operator Job, each with an explicit tenant, dataset version,
idempotency key, and distinct load run ID. Require Layer 2/3/4 readbacks,
quality-gate output, proof bundle, Tower reconciliation, and signed-in Source
verification before product claims rely on the package.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: record the final main-deploy digest before live proof.
- ACA runtime invariant: template image, 100% traffic revision, and required
  worker images must match the approved digest.
- Worker image invariant: private operator jobs use the same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected Source routes and tabs.

## Rollback Plan

Revert the application change through the protected PR lane and redeploy the
prior approved digest. Data remains isolated by tenant, dataset version, and
load run; do not delete or truncate shared Source tables as a code rollback.
Any failed operator readback must roll back its transaction and leave the
package ineligible for product use.

## Audit Evidence

- PR #7676 and its CI checks.
- Package plan outputs and package hashes.
- ACA runtime invariant for the merged SHA.
- Private operator proof bundles with Layer 2/3/4 readbacks and quality gates.
- Signed-in Source tab-by-tab smoke output.

## Known Gaps

This change does not classify or enrich the remaining register-only portfolio
without authoritative source mappings. The thin five-contract package remains
blocked until its missing managed-services evidence is supplied. Synthetic
package content remains demo-only and is not finance-confirmed client truth.
