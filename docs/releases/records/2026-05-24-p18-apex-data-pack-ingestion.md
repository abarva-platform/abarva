# 2026-05-24-p18-apex-data-pack-ingestion — Packet 18 Data Pack Ingestion

## Release ID

`2026-05-24-p18-apex-data-pack-ingestion`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable loader and verifier for the Apex Packet 18 data pack. The loader can dry-run the static pack or apply its source-file registry and corpus chunks into the existing enterprise context tables.

## Layer Impact

- `client-data-lane`: loads Apex-scoped source-file and chunk rows into Postgres when run with `--apply`.
- `corpus-knowledge-lane`: stages 280 chunks for embedding/retrieval by inserting them into `enterprise_context_chunks` with `embedding_status='pending'`.
- `ops-release-lane`: adds explicit package scripts for dry-run, load, and verification.

## Client Applicability

- All clients: none.
- Specific clients: Apex Retail synthetic/demo tenant only.
- Internal only: Packet 18 onboarding simulation and QA.
- Public/demo only: Apex demo substrate after the load script is applied.
- Feature flag: none.

## Changes Included

- `src/scripts/setup-data/load-apex-p18-data-pack.ts`
- `src/scripts/setup-data/verify-apex-p18-data-pack.ts`
- `package.json` scripts:
  - `db:dry:p18-apex-pack`
  - `db:load:p18-apex-pack`
  - `db:verify:p18-apex-pack`

## QA / Validation

- pass: `npm run db:dry:p18-apex-pack`
- pass: `npm run verify:apex-data-pack`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI. Then run `npm run db:load:p18-apex-pack` against the live database and confirm with `npm run db:verify:p18-apex-pack`. Vercel production deploy is automatic through Git integration.

## Rollback Plan

Revert the PR for code rollback. If data was applied, remove rows where `tenant_key='apex-retail'` and `chunk_id LIKE 'APX-P18-CHUNK-%'`, rows where `source_system='packet_18_apex_synthetic'`, and the `enterprise_context_template_runs` row with `run_key='p18-apex-synthetic-v1-2'`.

## Audit Evidence

- PR URL after publication.
- GitHub CI checks for the PR.
- Dry-run output showing 42 source files and 280 chunks.
- Live verification output after DB load.

## Known Gaps

- Does not generate embeddings; loaded chunks remain `pending`.
- Does not implement the admin upload/confirm UI.
- Does not execute live Sentinel canonical questions.
