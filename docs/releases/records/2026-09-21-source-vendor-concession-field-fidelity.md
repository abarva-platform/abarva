# Source vendor concession field fidelity

## Release ID

`2026-09-21-source-vendor-concession-field-fidelity`

## Status

`candidate`

## Plain-English Summary

Contract 360 optimization levers now use one canonical vendor-concession field. Rows carrying `vendor_concession` keep that value, rows carrying only the legacy `vendor_give` spelling are accepted explicitly, and rows carrying neither render a declared absence instead of authored-looking placeholder prose.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 adapters: normalizes the cloud contract-intelligence adapter field spelling.
- Layer 4 products: Contract Intelligence / Contract 360 read-model behavior for optimization lever text.
- Data model and tenant data: unchanged. No migration or data-side rename is included.

## Client Applicability

- All clients: shared Source Contract 360 / Contract Intelligence behavior.
- Specific clients: none named.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Canonicalizes vendor concession reads on `vendor_concession`.
- Preserves the legacy `vendor_give` spelling as an explicit fallback for already-shaped rows.
- Replaces the old `Vendor give not loaded.` fallback with `Vendor concession: not declared in source row.`
- Adds focused tests for canonical, legacy-only, and absent rows.

## QA / Validation

- PASS: measured current row shape before editing:
  `scripts/source/build-meridian-databricks-cloud-consumption-package.mjs` emits `vendor_concession`;
  `scripts/source/load-cloud-consumption-package.mjs` requires `vendor_concession`;
  `scripts/source/load-contract-depth-package.ts` previously wrote canonical `vendor_concession`
  from legacy `vendor_give`;
  `src/lib/source/contract-intelligence/cloud-adapter.ts` previously translated canonical
  `vendor_concession` into legacy `vendor_give`; and
  `src/lib/source/contract-intelligence/build.ts` previously read only `vendor_give`.
- PASS: focused Jest for Contract Intelligence field fidelity and loader guard:
  `npx jest --runTestsByPath src/lib/source/contract-intelligence/__tests__/cloud-adapter.test.ts scripts/source/__tests__/load-contract-depth-package.test.ts --runInBand`.
- PASS: mutation checks caught canonical-only, legacy-only, absent-row, and loader canonical-first mutants.
- PASS: scoped ESLint over touched source and test files.
- PASS: repository TypeScript check with 8 GB Node heap.
- PASS: `npm run release:check`.
- Pending in this candidate branch before PR: PR checks.

## Rollout Plan

Squash-merge through the normal pull-request lane after validation is green. The change is code-only and uses existing rows without rewriting tenant data.

## Deployment Authority

- Repo-owned deploy workflow: normal main workflow only after merge.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: required only if the repo-owned workflow deploys after merge.
- Worker image invariant: required only if the repo-owned workflow deploys after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no signed-in proof is claimed by this release record.

## Rollback Plan

Revert the pull request. No data rollback is required because no tenant data, schema, or migration changes are included.

## Audit Evidence

- Item `T-585`.
- Focused field-fidelity tests over the Contract Intelligence cloud adapter.
- Loader text guard for canonical-first vendor-concession ingestion.

## Known Gaps

No data-side rename, Azure data-build job, route/browser proof, vendor contact, or signed-in acceptance is included.
