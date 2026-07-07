# 2026-06-09-ws-c-admin-bulk-e2e — Admin bulk ingestion end-to-end (WS-C)

## Release ID

`2026-06-09-ws-c-admin-bulk-e2e`

## Status

`candidate`

## Plain-English Summary

Confirms the governed Admin bulk ingestion path end-to-end and proves WS-B
idempotency through the real loader. Adds a smoke that runs the actual
`loadCsvUploadToTenantContext` (the same entrypoint the Admin csv-upload route
calls) with a canonical Vendors & Contracts template payload, twice, and reports
each ingestion state separately (parsed → committed facts → chunks). The second
run commits the same logical facts/chunks — no duplicates — proving supersede +
the partial unique active-fact index + content-stable chunk upsert hold through
the governed path. Upload commits facts and makes rows promotion-eligible; it
never mints agent_ready directly.

## Layer Impact

- `client-data-lane` / `ops-release-lane`: a QA smoke that exercises the real
  ingestion write path. No schema change. The smoke writes clearly-marked
  synthetic rows that supersede idempotently (no accumulation).

## Client Applicability

- All clients: the path is the canonical one every client/pilot uses.
- Internal only: the smoke is QA tooling.

## Changes Included

- `src/scripts/qa/admin-bulk-ingestion-smoke.ts`
- `docs/governance/ADMIN_BULK_INGESTION_E2E_2026-06-09.md`

## QA / Validation

- `npx tsc --noEmit` / `npx eslint` → clean.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.
- **Live ACA run** in-VNet: two identical uploads via the real loader; the
  second run commits the same facts/chunks (idempotent). Results in the WS-C doc.

## Rollout Plan

Merge to `main`. The smoke runs as an ACA job; the loader change set it validates
(WS-B) is already live.

## Rollback Plan

Revert the PR. QA-only; the smoke's synthetic rows supersede idempotently and can
be left or retired.

## Audit Evidence

- PR URL: (filled on open). Live ACA job logs (per-run state counts).

## Context Ingestion Evidence

Applicable. Exercises the governed Admin structured-context ingestion path.
States reported separately: parsed · committed (active facts) · chunked. Index
refresh = async embed job; promotion_candidate = WS-F; agent_ready = governed
promotion. No new ZIP/unzip claim (the existing bulk-upload ZIP path is
confirmed, not reinvented).

## Known Gaps

- The smoke asserts parsed/committed/chunked + idempotency; index/retrieval/
  cite-render states are proven by the WS-G answer-quality probe and the embed
  job, not re-measured here.
