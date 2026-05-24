# 2026-05-24-p18-onboarding-ingestion-api — Packet 18 Onboarding Ingestion API

## Release ID

`2026-05-24-p18-onboarding-ingestion-api`

## Status

`candidate`

## Plain-English Summary

Adds the first persisted upload → parse → validate → confirm → commit path for the Apex Packet 18 synthetic data pack. Upload sessions are stored in Postgres, validation is deterministic, and commit upserts the Apex enterprise context source files, corpus chunks, and template-run audit row.

## Layer Impact

- `client-data-lane`: adds a persisted onboarding session ledger and commit path.
- `corpus-knowledge-lane`: supports committing Packet 18 source files and corpus chunks from an uploaded ZIP.
- `admin-ops-lane`: adds a confirm page for validated sessions.

## Client Applicability

- All clients: no.
- Specific clients: Apex Retail synthetic/demo tenant.
- Internal only: pilot onboarding simulation and Packet 18 QA.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260524033000_onboarding_upload_sessions.sql`
- `src/lib/onboarding/apex-p18-pack-ingestion.ts`
- `src/lib/onboarding/__tests__/apex-p18-pack-ingestion.test.ts`
- `src/app/api/onboarding/upload/route.ts`
- `src/app/api/onboarding/[session]/status/route.ts`
- `src/app/api/onboarding/[session]/commit/route.ts`
- `src/app/(maestro)/admin/onboarding/[session]/confirm/page.tsx`
- `src/app/(maestro)/admin/onboarding/[session]/confirm/ConfirmCommitButton.tsx`

## QA / Validation

- pass: `jest src/lib/onboarding/__tests__/apex-p18-pack-ingestion.test.ts`
- pass: `npx eslint src/lib/onboarding/apex-p18-pack-ingestion.ts src/app/api/onboarding/upload/route.ts src/app/api/onboarding/[session]/status/route.ts src/app/api/onboarding/[session]/commit/route.ts src/app/(maestro)/admin/onboarding/[session]/confirm/page.tsx src/app/(maestro)/admin/onboarding/[session]/confirm/ConfirmCommitButton.tsx`
- pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Run `npm run db:migrate` before relying on the upload endpoint. Then upload a Packet 18 ZIP to `/api/onboarding/upload`, review `/admin/onboarding/<session>/confirm`, and commit from the confirm page.

## Rollback Plan

Revert the PR. The additive `onboarding_upload_sessions` table can remain safely unused.

## Audit Evidence

- PR URL after publication.
- CI checks for the PR.
- Parser test output proving valid Packet 18 ZIPs pass and incomplete ZIPs fail.

## Known Gaps

- ZIP upload commit currently covers the enterprise context corpus slice, not every static CSV/XLSX table in the Packet 18 pack.
- PDF extraction is not invoked in this slice; contract and charter PDFs remain validated by file presence and the static pack verifier.
- Embedding remains a separate post-commit operation.
