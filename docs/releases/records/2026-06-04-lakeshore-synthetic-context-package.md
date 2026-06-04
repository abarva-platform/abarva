# 2026-06-04-lakeshore-synthetic-context-package — Lakeshore Synthetic Context Package

## Release ID

`2026-06-04-lakeshore-synthetic-context-package`

## Status

`candidate`

## Plain-English Summary

Creates the extensive synthetic data package needed to rehearse a new Lakeshore Holdings client onboarding through AbarVa's governed data-load path. The package includes a fictional Chicago holding company, four operating companies, their own organization structures, IT systems, vendors, contracts, financials, risks, initiatives, policies, reports, and an offline ZIP bundle a client can review once before loading.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific synthetic context files, documents, workbook, manifest, and verification script for private data-plane rehearsal. No production database writes or migrations are included.
- `internal-admin`: Adds a repeatable generator and verifier that AbarVa operators can run before using `/admin/setup` or governed upload APIs.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: Lakeshore Holdings synthetic pilot package only.
- Internal only: Generator, verifier, research notes, and offline review package.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/scripts/lakeshore/generate-synthetic-context.ts`
- `scripts/lakeshore/verify-synthetic-context.mjs`
- `docs/build/lakeshore/loaded/**`

The generated bundle contains:

- 18 canonical template CSV files.
- 1,329 structured synthetic records.
- 21 synthetic documents across PDF, DOCX, and PPTX formats.
- One XLSX offline review workbook.
- One offline review ZIP containing the README, research notes, manifest, CSVs, documents, workbook, and how-to pages.

## QA / Validation

- `npx tsx src/scripts/lakeshore/generate-synthetic-context.ts` — passed; generated the full package.
- `node scripts/lakeshore/verify-synthetic-context.mjs` — passed; verified tenant keys, all five companies, record volume, canonical template coverage, document signatures, stable opco join keys, and ZIP contents.
- ZIP inspection with `unzip -l docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip` — passed; confirmed 65 offline review entries.

## Rollout Plan

Merge to `main`. There is no runtime activation by merge alone. AbarVa operators use the generated offline review bundle with the client, then use the governed Data Loads workflow or upload APIs to load files into Lakeshore's private data plane in a later slice.

## Rollback Plan

Revert the PR to remove the generated files, generator, verifier, and release record. No database rollback is required because this release writes no runtime data.

## Audit Evidence

- Generated manifest: `docs/build/lakeshore/loaded/manifest.json`
- Offline review ZIP: `docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip`
- Research notes: `docs/build/lakeshore/loaded/RESEARCH_NOTES.md`
- Verifier output from `node scripts/lakeshore/verify-synthetic-context.mjs`

## Known Gaps

- The package is generated and verified, but not yet uploaded through `/admin/setup` into Lakeshore's private data plane.
- Document parsing via Azure Document Intelligence remains part of the next loader-processing slice.
