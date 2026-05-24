# 2026-05-24-p18-apex-embedding-verification — Packet 18 Embedding Verification

## Release ID

`2026-05-24-p18-apex-embedding-verification`

## Status

`candidate`

## Plain-English Summary

Extends the Apex Packet 18 live verifier so it proves not only that the 280 corpus chunks were loaded, but also that all 280 were embedded.

## Layer Impact

- `client-data-lane`: verifies Apex-scoped rows in `enterprise_context_chunks`.
- `corpus-knowledge-lane`: verifies the embedding-ready retrieval substrate by checking `embedding_status='embedded'`.
- `ops-release-lane`: strengthens the existing `db:verify:p18-apex-pack` command.

## Client Applicability

- All clients: none.
- Specific clients: Apex Retail synthetic/demo tenant only.
- Internal only: Packet 18 onboarding simulation and QA.
- Public/demo only: Apex demo substrate after loader and embedding scripts run.
- Feature flag: none.

## Changes Included

- `src/scripts/setup-data/verify-apex-p18-data-pack.ts`

## QA / Validation

- pass: `npm run db:verify:p18-apex-pack`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI. No migration is required. Run `npm run db:verify:p18-apex-pack` after embeddings complete.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL after publication.
- GitHub CI checks for the PR.
- Live verifier output showing 42 source files, 280 chunks, 280 embedded chunks, and 1 template run.

## Known Gaps

- Does not verify Pinecone vector count directly.
- Does not execute live Sentinel canonical questions.
