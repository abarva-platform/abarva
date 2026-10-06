# 2026-09-22-source-candidate-supplier-registry-synthetic-v1 — Synthetic Candidate Supplier Registry

## Release ID

`2026-09-22-source-candidate-supplier-registry-synthetic-v1`

## Status

`candidate`

## Plain-English Summary

Adds a public-safe synthetic candidate-supplier registry package for dry-run validation of governed Source supplier suggestion filters. The package covers every registered Source archetype with two eligible fictional legal entities and includes negative controls proving missing lineage, draft authority, duplicate identity, mismatched eligibility, and missing contact authority fail closed.

## Layer Impact

Release lane: `public-demo`.

Layer 1 tenant-context fixture: adds a synthetic source-shaped registry extract and field guide. It is not real client intake and does not assert real supplier, contract, person, or contact facts.

Layer 2 validation-only adapter discipline: adds a deterministic dry-run validator that reads the registered Source archetype/category denominator and emits a coverage matrix. It does not load data or write a product projection.

Layer 4 products: no runtime Source UI, API, Stage 04, candidate-supplier repository, or suggestion behavior changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: dry-run fixture validation and governance review.
- Public/demo only: synthetic repository fixture only.
- Feature flag: none.

## Changes Included

- `datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv`
- `datasets/source/candidate-supplier-registry-synthetic-v1/FIELD_GUIDE.md`
- `docs/governance/dataset-manifests/source-candidate-supplier-registry-synthetic-v1.json`
- `scripts/source/validate-candidate-supplier-registry-package.ts`
- `scripts/source/__tests__/candidate-supplier-registry-package.test.ts`

## QA / Validation

Passed:

- `npx jest scripts/source/__tests__/candidate-supplier-registry-package.test.ts --runInBand`
- `npx tsx scripts/source/validate-candidate-supplier-registry-package.ts --out /tmp/source-candidate-supplier-registry-validation.json`
- `npm run validate:context-corpus:manifests`

Pending before merge:

- `npm run release:check`

## Rollout Plan

Merge-only repository fixture. No Azure Container Apps deploy, migration, tenant write, data-plane load, feature flag, Source event mutation, or supplier contact is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no. The change is not wired to runtime.

## Rollback Plan

Revert the PR. This removes the synthetic dataset, manifest, field guide, validator, and tests. No database or runtime rollback is required because nothing is loaded or deployed.

## Audit Evidence

Inspect the PR diff, the local validator output, and the Jest mutation tests. The validator output contains the exact archetype coverage matrix and fail-closed control list.

## Known Gaps

No live product acceptance, supplier suggestion runtime wiring, Azure load, tenant-scoped review, signed-in proof, supplier outreach, NDA workflow, award workflow, or production retrieval is included.
