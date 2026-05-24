# 2026-05-24-p18-preserve-embedding-status — Preserve Apex Packet 18 Embeddings

## Release ID

`2026-05-24-p18-preserve-embedding-status`

## Status

`candidate`

## Plain-English Summary

Protects already-embedded Apex Packet 18 corpus chunks during repeat loads or onboarding commits. Existing `embedding_status` values are read before upsert, so a second commit does not downgrade embedded chunks back to pending.

## Layer Impact

- `corpus-knowledge-lane`: preserves retrieval readiness during idempotent Packet 18 reruns.
- `onboarding-lane`: makes the new upload/confirm/commit path safe to exercise after embeddings have been generated.

## Client Applicability

- All clients: no.
- Specific clients: Apex Retail synthetic/demo tenant.
- Internal only: Packet 18 QA and onboarding simulation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/onboarding/apex-p18-pack-ingestion.ts`
- `src/scripts/setup-data/load-apex-p18-data-pack.ts`

## QA / Validation

- pass: `npx jest src/lib/onboarding/__tests__/apex-p18-pack-ingestion.test.ts --runInBand`
- pass: `npx eslint src/lib/onboarding/apex-p18-pack-ingestion.ts src/scripts/setup-data/load-apex-p18-data-pack.ts`
- pass: `npx tsc --noEmit --pretty false`
- pass: `npm run release:check -- --base origin/main --head HEAD`
- pass: `npm run db:verify:p18-apex-pack`

## Rollout Plan

Merge before running a live onboarding commit simulation. No migration is required.

## Rollback Plan

Revert the PR. Existing database rows are not changed by the code rollback.

## Audit Evidence

- PR URL after publication.
- Live verifier output showing all 280 Apex Packet 18 chunks remain embedded after rerun/commit testing.

## Known Gaps

- This preserves status only for the Packet 18 loader/onboarding path. Other loaders should be reviewed before repeat-running them after embeddings.
