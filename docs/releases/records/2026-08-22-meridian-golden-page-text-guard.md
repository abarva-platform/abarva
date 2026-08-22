# 2026-08-22-meridian-golden-page-text-guard — Meridian page-text load guard

## Release ID

`2026-08-22-meridian-golden-page-text-guard`

## Status

`candidate`

## Plain-English Summary

This fixes a malformed synthetic Meridian contract-evidence page-text extract and adds a preflight guard to the loader. The guard catches PDF page rows with shifted columns, nonnumeric page numbers, mismatched vendor names, mismatched mapping status, bad page counts, or page-text hash drift before an ACA operator load attempts to write `doc.page`.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1 / client intake package: corrects the synthetic/demo Meridian CF-003 PDF page-text rows.
- Layer 2 / source adapter: adds semantic validation in the golden-evidence loader before plan or apply proceeds.
- Layer 3 / canonical model: no schema change. The change prevents invalid page rows from reaching governed document tables.
- Layer 4 / products: no direct product UI change in this PR.

## Client Applicability

Specific clients: applies only to the synthetic Meridian demo evidence package under `datasets/source/contract-intelligence/meridian-golden-20260809`.

All clients: the loader guard applies whenever this golden-evidence loader is used for any tenant package.

Internal only: the ACA operator load remains a separate controlled action; this PR does not mutate live data.

## Changes Included

- `datasets/source/contract-intelligence/meridian-golden-20260809/synthetic/contract_pdf_page_text.csv`
- `scripts/source/load-source-golden-contract-evidence.mjs`
- `docs/releases/records/2026-08-22-meridian-golden-page-text-guard.md`

## QA / Validation

Status: pass locally.

Passed:

```bash
npm run source:contract-evidence:meridian:validate
npm run source:contract-evidence:meridian:plan
git diff --check
```

The loader plan reported:

- dataset: `meridian-source-v1-202608-golden-evidence`
- contracts: `CF-001`, `CF-003`
- package CSV tables: 18
- source rows: 608
- document files: 6
- document page rows: 24
- document extraction rows: 30
- mapped golden PDFs: 6

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow will build the corrected package and loader guard into the digest-pinned runtime image. Any live data-plane write must still run separately through the ACA operator job path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: resolved by the main deploy workflow after merge
- ACA runtime invariant: required before any later operator load uses the deployed image
- Worker image invariant: required by the main deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: not for this package/loader fix alone; required after any later data-plane load and product route verification

## Rollback Plan

Revert the PR. If a later operator load has already succeeded, data-plane rollback must use the operator/load-run cleanup path; code rollback alone does not remove loaded rows.

## Audit Evidence

Inspect the PR diff, local validation output, GitHub checks, ACA main deploy evidence after merge, and any later ACA operator job proof bundle. This record does not claim live data-plane load/readback.

## Known Gaps

The live data-plane load and readback remain pending until this fix is merged, deployed, and the ACA operator job succeeds.
