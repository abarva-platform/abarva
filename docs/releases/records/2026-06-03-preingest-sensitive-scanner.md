# 2026-06-03-preingest-sensitive-scanner — Pre-Ingest Sensitive Scanner

## Release ID

`2026-06-03-preingest-sensitive-scanner`

## Status

`candidate`

## Plain-English Summary

Adds a reusable pre-ingest sensitive-data scanner for PHI/PII and financial
identifier detection before uploads can be stored, indexed, parsed into
evidence, or used by agents. The existing sensitive upload guard now delegates
identifier detection to this scanner while preserving its quarantine behavior.

## Layer Impact

- `client-data-lane`: Strengthens the upload quarantine gate used before
  client files enter parsing, indexing, evidence extraction, or retrieval.
- `global-control-lane`: Adds shared scanner vocabulary and Presidio-compatible
  entity names for future runtime adapters.

## Client Applicability

- All clients: Applies to shared sensitive-upload guard behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/security/preingest-sensitive-scanner.ts` adds deterministic scanner
  findings for SSN, MRN/patient ids, DOB, bank account/routing labels, payment
  cards, email, and phone numbers.
- `src/lib/security/sensitive-upload-guard.ts` now delegates pattern detection
  to the scanner while keeping its existing allow/quarantine response shape.
- `src/lib/security/__tests__/preingest-sensitive-scanner.test.ts` covers PHI,
  PII, financial identifiers, flag-only business contact data, and
  Presidio-compatible entity output.
- `docs/architecture/azure/PREINGEST_SENSITIVE_SCANNER.md` documents the
  scanner boundary and Presidio follow-on.
- `docs/runbooks/azure-blob-upload-pattern.md` links the upload flow to the
  scanner.

## QA / Validation

- PASS: `npx jest src/lib/security/__tests__/preingest-sensitive-scanner.test.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts --runInBand` (9 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint src/lib/security/preingest-sensitive-scanner.ts src/lib/security/sensitive-upload-guard.ts src/lib/security/__tests__/preingest-sensitive-scanner.test.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. The scanner becomes active
wherever the existing sensitive-upload guard is already called.

## Rollback Plan

Revert the PR to return the sensitive-upload guard to its prior inline pattern
matching implementation. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2950.
- CI: pending at PR open.
- Local QA: focused Jest, TypeScript, eslint, diff whitespace, and release control pass locally before PR.

## Known Gaps

This does not deploy the Microsoft Presidio service, add OCR, add a new
quarantine migration, or prove live Azure DLP/Purview execution. T032 should
remain `In progress` until a live Presidio or equivalent Azure DLP/Purview
adapter is wired and verified end to end.
