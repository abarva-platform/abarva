# 2026-05-24-p18-apex-document-corpus-assets — Packet 18 Document And Corpus Assets

## Release ID

`2026-05-24-p18-apex-document-corpus-assets`

## Status

`candidate`

## Plain-English Summary

Adds the Apex Retail synthetic document and retrieval substrate needed to simulate a mature pilot onboarding lane: contract PDFs, charter PDFs, Excel workbooks, source-file registry rows, and tenant-grounded corpus chunks.

## Layer Impact

- `client-data-lane`: adds Apex-scoped synthetic data-plane assets under `datasets/apex-retail-synthetic-v1`.
- `corpus-knowledge-lane`: adds source-file registry rows and 280 retrieval chunks for future enterprise-context loading.
- `demo-public-lane`: adds static demo evidence assets; no runtime route behavior changes.
- `ops-release-lane`: extends `npm run verify:apex-data-pack` so the document and corpus assets are counted, byte-checked, and referentially validated.

## Client Applicability

- All clients: none.
- Specific clients: Apex Retail synthetic/demo tenant only.
- Internal only: Packet 18 onboarding simulation and demo QA.
- Public/demo only: Apex demo substrate.
- Feature flag: none.

## Changes Included

- `scripts/datasets/generate-apex-document-corpus-assets.py`
- `scripts/verify/apex-data-pack-scaffold.mjs`
- `datasets/apex-retail-synthetic-v1/02-financial/*.xlsx`
- `datasets/apex-retail-synthetic-v1/04-vendors/contract-pdfs/*.pdf`
- `datasets/apex-retail-synthetic-v1/09-charters/charter-pdfs/*.pdf`
- `datasets/apex-retail-synthetic-v1/13-context/*`
- `datasets/apex-retail-synthetic-v1/99-verification/expected-corpus-load.json`

## QA / Validation

- `npm run verify:apex-data-pack` passes locally.
- `npm run release:check -- --base origin/main --head HEAD` passes locally after this release record.

## Rollout Plan

Merge to main after CI. Vercel production deploy is automatic through the existing Git integration. No database migration or manual DB apply is required for this static-data slice.

## Rollback Plan

Revert the PR. No schema or live data rollback is required.

## Audit Evidence

- PR URL after publication.
- GitHub CI checks for the PR.
- `npm run verify:apex-data-pack` output showing 42 source files, 280 corpus chunks, 30 contract PDFs, and 10 charter PDFs.

## Known Gaps

- Does not implement onboarding upload/parse/validate/confirm/store pipeline.
- Does not apply these assets into live Postgres.
- Does not execute live Sentinel canonical questions.
