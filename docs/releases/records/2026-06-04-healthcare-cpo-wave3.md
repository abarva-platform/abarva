# 2026-06-04-healthcare-cpo-wave3 — Healthcare CPO Sourcing Operating Pack

## Release ID

`2026-06-04-healthcare-cpo-wave3`

## Status

`candidate`

## Plain-English Summary

This release adds the third healthcare hardening wave: 1,420 healthcare CPO sourcing patterns that teach the corpus how to reason through sourcing events, vendor leverage, BAFO negotiation, savings validation, managed-services scope, GPO/supply-chain economics, make-buy decisions, and cross-CXO procurement governance.

The pack is authored as governed-loader JSONL. It does not mutate production data by itself. Because the governed loader caps a single upload at 1,000 rows, the upload units are the ten per-domain JSONL files under `scripts/corpus/generated/healthcare-cpo-wave3/`, not the combined report file.

## Layer Impact

- `client-data-lane`: Adds import-ready global healthcare CPO sourcing doctrine for the `genome_patterns` substrate.
- `global-control-lane`: Adds deterministic generation, audit, critique, checkpoint, and import-prep tests for the Wave 3 CPO corpus pack.

## Client Applicability

- All clients: Global healthcare sourcing doctrine can be reused once loaded.
- Specific clients: Meridian Health is the primary demo target, with actual vendor contracts and tenant-specific incumbent facts deferred to governed tenant data loading.
- Internal only: Generator, report artifacts, and tests are internal release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/corpus/generated/healthcare-cpo-wave3/generate-healthcare-cpo-wave3.mjs`.
- Adds ten generated JSONL upload batches under `scripts/corpus/generated/healthcare-cpo-wave3/`.
- Adds `scripts/corpus/generated/healthcare-cpo-wave3/__tests__/wave3-cpo-pattern-pack.test.ts`.
- Adds Wave 3 run evidence under `reports/healthcare-harden/wave-3/`.

## QA / Validation

- `npx jest scripts/corpus/generated/healthcare-cpo-wave3/__tests__/wave3-cpo-pattern-pack.test.ts --runInBand` — pass.
- The focused pack test verifies exactly 1,420 patterns, exact per-domain counts, required schema fields, CPO persona coverage, healthcare specificity, evidence presence, graph relationship shape, and successful `prepareCorpusJsonlImport()` parsing for all ten upload batches.
- The test also verifies each governed upload batch stays at or below the 1,000-row loader limit.
- Additional validation will be recorded before release when TypeScript, ESLint, release check, and whitespace checks complete.

## Rollout Plan

Merge the candidate PR to main and deploy the app normally. The pack becomes available as governed admin upload content. Production corpus writes require an authenticated operator to upload each per-domain batch through `/admin/context-layer/uploads`, choose commit mode, and provide the required upload attestation.

## Rollback Plan

Revert the PR to remove the Wave 3 pack, generator, tests, and evidence. If any batch is later committed through the admin loader, use the ingestion-run audit records to remove or supersede imported pattern IDs.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.
- Local pack summary: `reports/healthcare-harden/wave-3/SUMMARY.md`.
- Local import-prep checkpoint: `reports/healthcare-harden/wave-3/checkpoint.json`.
- Local critique output: `reports/healthcare-harden/wave-3/critique-final.jsonl`.

## Known Gaps

- The patterns are import-ready but not yet live-loaded into production data.
- Vendor-specific rows intentionally avoid invented prices and contract terms; tenant contract evidence must come through the governed data loader.
- Live Source/CPO retrieval eval is not claimed until the pack is loaded through the governed admin lane.
- Meridian-specific incumbent relationships remain a later tenant-overlay wave.
