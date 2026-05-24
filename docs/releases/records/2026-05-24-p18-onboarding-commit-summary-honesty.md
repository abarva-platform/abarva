# 2026-05-24-p18-onboarding-commit-summary-honesty — Onboarding Commit Summary Honesty

## Release ID

`2026-05-24-p18-onboarding-commit-summary-honesty`

## Status

`candidate`

## Plain-English Summary

Updates the Packet 18 onboarding commit summary so it accurately reports embedding handling as `preserved_existing_or_pending_new` instead of implying every committed chunk is newly pending.

## Layer Impact

- `onboarding-lane`: makes commit status truthful after idempotent reruns.
- `corpus-knowledge-lane`: reinforces that existing embedded chunks are preserved.

## Client Applicability

- All clients: no.
- Specific clients: Apex Retail synthetic/demo tenant.
- Internal only: Packet 18 onboarding simulation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/onboarding/apex-p18-pack-ingestion.ts`

## QA / Validation

- pass: `npx jest src/lib/onboarding/__tests__/apex-p18-pack-ingestion.test.ts --runInBand`
- pass: `npx eslint src/lib/onboarding/apex-p18-pack-ingestion.ts`
- pass: `npx tsc --noEmit --pretty false`
- pass: `npm run release:check -- --base origin/main --head HEAD`
- pass: `npm run db:verify:p18-apex-pack`

## Rollout Plan

Merge after CI. No migration is required.

## Rollback Plan

Revert the PR. Existing sessions are unaffected.

## Audit Evidence

- PR URL after publication.
- Verifier output showing Apex remains at 280 embedded chunks.

## Known Gaps

- Existing historical session rows retain their previous summary text unless explicitly updated.
