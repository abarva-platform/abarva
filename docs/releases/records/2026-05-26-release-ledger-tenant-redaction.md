# 2026-05-26-release-ledger-tenant-redaction — Release ledger tenant redaction

## Release ID

`2026-05-26-release-ledger-tenant-redaction`

## Status

`released`

## Plain-English Summary

Sanitizes legacy demo tenant names before markdown-backed release records render in the authenticated release ledger. The page still preserves release governance content, but tenant-visible crawls no longer see archived client names from old release notes.

## Layer Impact

- `app-control-lane`: Keeps `/admin/releases` tenant-safe for authenticated demo users.
- `ops-release-lane`: Adds a regression test for markdown release-record redaction.

## Client Applicability

- All clients: Applies to the authenticated admin release ledger.

## Changes Included

- `src/lib/admin/release-ledger.ts`
- `src/lib/admin/__tests__/release-ledger.test.ts`

## QA / Validation

- pass: `npx jest src/lib/admin/__tests__/release-ledger.test.ts --runInBand`
- pass: `npx eslint src/lib/admin/release-ledger.ts src/lib/admin/__tests__/release-ledger.test.ts`

## Rollout Plan

Merge to main after checks pass. Vercel production deployment follows the existing Git integration.

## Rollback Plan

Revert this release if the release ledger must expose raw markdown content verbatim again.

## Audit Evidence

- Post-deploy crawl run `26435304545` isolated `/admin/releases` as the only remaining P0 source after sign-in hardening.

## Known Gaps

This is presentation-layer redaction only. It does not rewrite historical markdown records.
