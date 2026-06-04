# 2026-06-04-healthcare-wave4-audit-refine — Healthcare Domain Audit + Doctrine Refinement

## Release ID

`2026-06-04-healthcare-wave4-audit-refine`

## Status

`candidate`

## Plain-English Summary

This release adds the fourth healthcare hardening wave: an auditable sample review of existing healthcare domain patterns from `dom31` through `dom80`, plus governed-loader JSONL files that backfill rich doctrine context for the rows that need it.

The wave does not run seed scripts and does not directly mutate production data. It reads the local authored healthcare seed files, produces a reproducible audit trail, and prepares two upload units for the governed admin corpus import lane.

## Layer Impact

- `client-data-lane`: Prepares import-ready global healthcare pattern refinements and gap-fill rows for the `genome_patterns` substrate.
- `global-control-lane`: Adds deterministic generation, audit, critique, checkpoint, and import-prep tests for the Wave 4 healthcare domain hardening pack.

## Client Applicability

- All clients: Global healthcare provider doctrine can be reused once loaded through the governed admin import path.
- Specific clients: Meridian Health is the primary healthcare demo target, but no tenant-specific Meridian facts are added in this wave.
- Internal only: Generator, report artifacts, and tests are internal release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/corpus/generated/healthcare-wave4-audit-refine/generate-healthcare-wave4-audit-refine.mjs`.
- Adds two generated JSONL upload batches under `scripts/corpus/generated/healthcare-wave4-audit-refine/`.
- Adds `scripts/corpus/generated/healthcare-wave4-audit-refine/__tests__/wave4-audit-refine-pack.test.ts`.
- Adds Wave 4 run evidence under `reports/healthcare-harden/wave-4/`.

## QA / Validation

- `npx jest scripts/corpus/generated/healthcare-wave4-audit-refine/__tests__/wave4-audit-refine-pack.test.ts --runInBand` — pass.
- `npx eslint scripts/corpus/generated/healthcare-wave4-audit-refine/generate-healthcare-wave4-audit-refine.mjs scripts/corpus/generated/healthcare-wave4-audit-refine/__tests__/wave4-audit-refine-pack.test.ts` — pass.
- `npx tsc --noEmit --pretty false` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass.
- `git diff --check` — pass.
- The focused pack test verifies a 1,000-row audit sample across 50 healthcare domains, exact KEEP/REFINE/KILL counts, rich doctrine-context fields, load-bearing domain coverage, and successful `prepareCorpusJsonlImport()` parsing for both upload batches.
- Additional validation will be recorded before release when TypeScript, ESLint, release check, and whitespace checks complete.

## Rollout Plan

Merge the candidate PR to main and deploy the app normally. The pack becomes available as governed admin upload content. Production corpus writes require an authenticated operator to upload the two JSONL batches through `/admin/context-layer/uploads`, choose commit mode, and provide the required upload attestation.

## Rollback Plan

Revert the PR to remove the Wave 4 pack, generator, tests, and evidence. If any batch is later committed through the admin loader, use the ingestion-run audit records to remove or supersede imported pattern IDs.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Local pack summary: `reports/healthcare-harden/wave-4/SUMMARY.md`.
- Local import-prep checkpoint: `reports/healthcare-harden/wave-4/checkpoint.json`.
- Local critique output: `reports/healthcare-harden/wave-4/critique-final.jsonl`.

## Known Gaps

- The refinements and gap-fill rows are import-ready but not yet live-loaded into production data.
- Kill candidates are not soft-deleted in this wave because soft-delete requires authenticated database context and operator review.
- Live Atlas/Source retrieval eval is not claimed until the rows are committed through the governed admin lane.
