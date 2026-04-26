# Admin/Setup To Source Readiness Contract Review

Date: 2026-04-26
Status: ready for review

## Files Changed

- `src/lib/source/admin-setup-readiness-contract.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-admin-setup-readiness-contract.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/36_ADMIN_SETUP_SOURCE_READINESS_CONTRACT_REVIEW.md`
- `docs/build/production-readiness.json`

## What Changed

This slice adds a deterministic Admin/Setup-to-Source readiness contract read model. It keeps Admin/Setup as the future owner of dataset readiness while letting Source consume a stable projection for sourcing workflow decisions.

The model defines platform readiness records, Source event data requirements, mapping rules, Admin/Setup handoff labels, evidence-usability distinctions, and a deterministic progress summary against 100 percent for event data readiness.

## Deterministic Read Model

The new read model supports:

- seeded Admin/Setup readiness records for the Data & AI Modernization sourcing event
- Source event requirement mapping by category
- missing required category detection
- loaded / available / usable evidence distinctions
- access-restricted and waived readiness handling
- deterministic workflow impact and agent recommendation text
- deterministic progress-to-100 scoring

The progress value is event data readiness only. It is not a production readiness score, not live monitoring, and not proof of production evidence readiness.

## Progress Against 100 Percent

The seeded Data & AI Modernization event currently projects to:

- 8 readiness categories
- 5 required categories
- 2 missing required categories
- 3 caution categories
- 34% event data readiness
- 13% usable evidence coverage

The score is weighted by requirement level and evidence usability. Required data matters more than recommended or optional data, and usable evidence scores higher than loaded-only, available-not-validated, low-confidence, restricted, or missing data.

## Boundary Preserved

This slice does not implement:

- real upload/parsing
- connectors
- Admin/Setup UI
- API routes
- persistence
- migrations
- evidence ledger runtime
- model calls
- Source UI changes

Source consumes a deterministic contract projection. Admin/Setup remains the future system of record.

## Validation Results

- `npx jest src/__tests__/integration/source/source-admin-setup-readiness-contract.test.ts --runInBand`
- `npx eslint src/lib/source/admin-setup-readiness-contract.ts src/lib/source/index.ts src/__tests__/integration/source/source-admin-setup-readiness-contract.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- JSON parse check for `docs/build/production-readiness.json`

All validation passed.

## Production Readiness Impact

`docs/build/production-readiness.json` is updated conservatively:

- Source / Outsourcing records the deterministic Admin/Setup readiness contract model and tests.
- Data / Evidence / Knowledge Fabric records that a deterministic Source-facing readiness projection exists, but no live evidence ledger, connectors, upload, parsing, or tenant-bound platform source exists.
- Validation / QA records the focused contract test once validation passes.

No component is promoted to `pilot_ready` or `production_ready`.

## Remaining Gaps

- Source data readiness panel still needs to consume contract-shaped data in a future UI slice.
- Admin/Setup does not yet back the contract with live dataset readiness.
- No connectors, uploads, parsing, evidence ledger runtime, or tenant-bound readiness source exists.
- Authenticated visual review remains required after the panel consumes the contract projection.

## Recommended Next Slice

Update the Source data readiness panel path so the event canvas consumes the contract-shaped projection and can display the event data readiness percentage compactly without adding upload, parsing, connector setup, Admin UI, or model calls.
