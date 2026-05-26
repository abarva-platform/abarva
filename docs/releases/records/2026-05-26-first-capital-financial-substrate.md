# 2026-05-26-first-capital-financial-substrate — First Capital Financial Context Substrate

## Release ID

`2026-05-26-first-capital-financial-substrate`

## Status

`candidate`

## Plain-English Summary

First Capital Financial is no longer a thin fixture tenant. This release adds a banking-grade context substrate with application inventory, financial metrics, vendor contracts, initiatives, org depth, regulatory context, source documents, and retrieval chunks so Sentinel, Source, Tower, and context-layer surfaces can ground answers in First Capital-specific banking facts.

## Layer Impact

- Data plane: Adds `datasets/first-capital-financial-synthetic-v1/` with deterministic source files, corpus chunks, org data, vendor contracts, and verification targets.
- Control scripts: Extends `scripts/seed/load-tenant-substrate.ts` with First Capital aliases and structured loading phases for applications, initiatives, and vendor contracts.
- Auditability: Keeps the generator in `scripts/seed/generate-first-capital-substrate.mjs` so the pack can be regenerated and diffed deterministically.

## Client Applicability

- All clients: No.
- Specific clients: First Capital Financial, including legacy aliases `firstcapital`, `first-capital`, and `arcturus`.
- Internal only: Loader/generator scripts are operator tooling.
- Public/demo only: Synthetic dataset is demo/pilot substrate only.
- Feature flag: None.

## Changes Included

- PR #2365.
- Adds 180 application rows, 380 integration edges, 42 initiatives, 70 vendor contracts, 22 teams, 1,650 roles, 60 source files, and 400 corpus chunks on disk.
- Extends the substrate loader to accept First Capital aliases, work from clean worktrees, load initiatives and vendor contracts, and handle both `chunk_id` and `id` JSONL chunk schemas.

## QA / Validation

- `node scripts/seed/generate-first-capital-substrate.mjs` generated the pack deterministically.
- `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run` passed.
- `TENANT_KEY=arcturus npx tsx scripts/seed/load-tenant-substrate.ts --dry-run` passed.
- `TENANT_KEY=first-capital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run --only-tables` passed.
- `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --concurrency=10` loaded and embedded 400 chunks.
- `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --only-tables` loaded 180 applications, 42 initiatives, and 70 vendor contracts.
- Focused ESLint passed for the loader and generator scripts.
- Focused TypeScript check passed for the loader script.
- Live Postgres verification showed 400 embedded chunks, 180 apps with populated annual run cost, 49 total initiatives, 42 pack-seeded initiatives, and 70 substrate-loaded vendor contracts for First Capital.

## Rollout Plan

Merge to main. Production deploy carries the loader/generator and dataset files. The live database was already loaded during validation with the service-role loader; future replays are idempotent for chunks, applications, pack-seeded initiatives, and substrate-loaded vendor contracts.

## Rollback Plan

Revert PR #2365 to remove the dataset and loader aliases from code. If the live database must be rolled back, rerun targeted deletes for First Capital rows loaded by `tenant_key='first-capital'`, `is_demo_data=true`, `loaded_via_template='firstcapital-substrate-v1'`, and `created_by='substrate-loader'`.

## Audit Evidence

- PR #2365.
- Loader command output in the PR validation notes.
- Live Postgres count verification for `enterprise_context_chunks`, `applications`, `ai_initiatives`, and `vendor_contracts`.
- Dataset manifest: `datasets/first-capital-financial-synthetic-v1/manifest.yaml`.
- Verification targets: `datasets/first-capital-financial-synthetic-v1/99-verification/`.

## Known Gaps

`enterprise_context_source_files` is not directly inserted because the table currently has an upstream UUID foreign-key dependency; source provenance is preserved on every chunk through `source_doc`, `source_record_id`, and `source_path`.
