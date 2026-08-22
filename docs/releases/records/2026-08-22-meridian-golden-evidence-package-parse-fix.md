# 2026-08-22-meridian-golden-evidence-package-parse-fix

## Release Lane

`client-data-lane`

## Summary

Fixes the Meridian Source golden contract evidence package so the package validator can parse and reconcile the package before any governed operator load is attempted.

The change is data-package hygiene only:

- quotes comma-bearing vendor legal-name values in package CSV rows
- refreshes document inventory SHA-256 values from the package's checked-in synthetic PDFs
- preserves the package row counts, contract identifiers, and reconciliation totals

## Layer Impact

- Layer 1 / intake package: corrected CSV encoding and document hash metadata
- Layer 2+ / adapters, canonical models, products: no code or runtime behavior change in this PR

## Client Applicability

Applies only to the synthetic/demo Meridian Source golden evidence package under `datasets/source/contract-intelligence/meridian-golden-20260809`.

## Validation

Passed:

```bash
npm run source:contract-evidence:meridian:validate
```

Validator result:

- dataset: `meridian-source-v1-202608-golden-evidence`
- contracts: `CF-001`, `CF-003`
- parsed package rows:
  - overview: 2
  - invoice: 192
  - rates: 11
  - SLA: 96
  - usage: 144
  - finance: 2
  - scope: 18
  - document inventory: 6
  - page text: 24
  - clauses: 30
  - reconciliation: 2
- failures: 0

## Rollout

Merge through PR and allow the repo-owned ACA main deploy workflow to build the corrected package into the digest-pinned runtime image. A later data-plane load, if approved, must run through the ACA operator job path per `docs/ops/aca-data-build-job-rule.md`.

## Rollback

Revert the package-only PR. No live data-plane rows are changed by this PR.

## Audit Evidence

The validator output above is the package-level proof. Live load/readback proof is intentionally not claimed here.
