# 2026-08-03-source-v4-synthetic-package-generator - Source v4 Synthetic Package Generator

## Release ID

`2026-08-03-source-v4-synthetic-package-generator`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic offline generator for the Source v4 synthetic system-extract package. The
generator creates system-of-record-shaped CSV extracts with lineage, row hashes, evidence states,
quality states, planted story threads and extraction instructions. It writes the generated package
to `/Users/anand/Downloads` and does not load data into any database.

## Layer Impact

- `client-data-lane`: adds offline synthetic package generation and validation support for Source
  v4 pressure testing.
- CLIENT INTAKE: adds extraction instructions in the generated ZIP so client-facing workbook/source
  requests can trace fields to practical systems, reports, APIs and owner roles.
- SOURCE ADAPTERS: uses the existing row-depth verifier as the acceptance gate for generated CSVs.
- CANONICAL MODEL: no schema or identity model change.
- PRODUCTS: no UI, Cube runtime, aVa runtime or web product behavior change.

## Client Applicability

- All clients: no production behavior change.
- Specific clients: applies to the synthetic airline Source v4 build path.
- Internal only: yes, this is build/QA tooling and a generated synthetic package.
- Public/demo only: no public page or demo route.
- Feature flag: none.

## Changes Included

- `scripts/source/build-skyharbor-v4-synthetic-package.mjs` generates the v4 synthetic package.
- `docs/source/SKYHARBOR_SOURCE_V4_SYNTHETIC_PACKAGE_BUILD.md` documents package shape and
  validation.
- `package.json` adds `source:v4:synthetic-package:build` and `source:v4:row-depth:verify`.

## QA / Validation

- PASS: `node --check scripts/source/build-skyharbor-v4-synthetic-package.mjs`.
- PASS: `npm run source:v4:synthetic-package:build`.
- PASS: `node scripts/source/verify-skyharbor-v4-row-depth.mjs <generated-csv-dir>`.
- PASS: `npm run source:v4:question-coverage:verify`.
- PASS: ZIP integrity check with `unzip -t`.
- PASS: byte SHA-256 verified with `shasum -a 256`.

## Rollout Plan

Merge through the normal PR path. No runtime deploy, database migration, Cube deployment or data load
is performed. Operators can run the generator locally to produce a timestamped ZIP in
`/Users/anand/Downloads`.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the generator, docs and npm scripts. No tenant data, database object,
runtime image, Cube model or feature flag cleanup is required.

## Audit Evidence

- PR for this release.
- Generated package path and SHA-256 emitted by the generator.
- Row-depth verifier JSON report.
- Question-coverage verifier output.
- ZIP integrity output.

## Known Gaps

- The generated package is not loaded to lab or production by this change.
- Cube and aVa answer baselines are not run by this change.
- Generated rows are synthetic pressure-test data and must not be described as client facts.
