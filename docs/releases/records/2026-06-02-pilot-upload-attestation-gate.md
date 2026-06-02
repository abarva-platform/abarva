# 2026-06-02-pilot-upload-attestation-gate - Pilot Upload Attestation Gate

## Release ID

`2026-06-02-pilot-upload-attestation-gate`

## Status

`candidate`

## Plain-English Summary

Pilot context CSV uploads now fail closed unless the tenant admin explicitly attests that they have authority to load the data, understand the pilot data-use disclaimer, and reviewed the file for restricted data before processing starts.

## Layer Impact

Client data lane: the admin context-layer upload path now requires a human data-load attestation before tenant context chunks can be queued.

Control plane: the upload UI now shows the attestation language and disables the load action until the operator accepts it.

## Client Applicability

- All clients: Applies to all tenant-scoped admin CSV context uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/upload-attestation.ts` adds the reusable pilot data-load attestation contract.
- `src/app/api/admin/context-layer/csv-upload/route.ts` rejects uploads without the current attestation.
- `src/lib/context-ingestion/csv-upload-connector.ts` carries accepted attestations into chunk provenance and ingestion run summaries.
- `src/components/admin/context-layer/CsvUploadConnector.tsx` adds the operator-facing attestation checkbox and note.
- Tests cover the attestation contract and API route fail-closed behavior.

## QA / Validation

- Pass - `npx jest src/lib/context-ingestion/__tests__/upload-attestation.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand`
- Pass - `git diff --check`
- Pass - `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and let the standard Vercel deployment promote the updated admin upload route and UI. No migration is required.

## Rollback Plan

Revert this PR to restore the prior upload behavior. Already persisted chunk provenance remains valid because the attestation metadata is additive.

## Audit Evidence

- PR URL: pending.
- Local focused Jest output.
- Release control check output.

## Known Gaps

This slice does not persist attestations to a standalone attestation ledger table and does not provide legal sign-off for the attestation copy. It records accepted attestations in ingestion run summaries and chunk provenance only.
