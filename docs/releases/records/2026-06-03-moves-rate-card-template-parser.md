# 2026-06-03-moves-rate-card-template-parser — Moves Rate-Card Templates and Parser

## Release ID

`2026-06-03-moves-rate-card-template-parser`

## Status

`candidate`

## Plain-English Summary

Adds the executable intake contract for Moves rate-card uploads: three governed template definitions
for internal loaded-cost rates, vendor/SI rates, and geography modifiers, plus a parser that
normalizes CSV/workbook/JSON row headers into the rate-card kernel. The parser recomputes and
validates server-side inputs rather than trusting workbook formula previews.

## Layer Impact

- `global-control-lane`: Extends the deterministic Moves expert-kernel surface with rate-card
  intake templates, parser utilities, and stricter validation. No route, UI, schema, migration, or
  tenant data changes.
- `client-data-lane`: Future tenant-specific rate-card uploads can use this parser before commit,
  but no client records are loaded by this release.

## Client Applicability

- All clients: Applies to future Moves estimate sharpening and rate-card uploads.
- Specific clients: None.
- Internal only: AbarVa engineering/product operators until wired into Data Loads.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/programs/expert-kernel/rate-card/rate-card-templates.ts`
- `src/lib/programs/expert-kernel/rate-card/rate-card-row-parser.ts`
- `src/lib/programs/expert-kernel/rate-card/rate-card-ingestion.ts`
- `src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-row-parser.test.ts`
- `src/lib/programs/expert-kernel/index.ts`

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-ingestion.test.ts src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-row-parser.test.ts --runInBand` — passed, 17 tests.
- `npx eslint src/lib/programs/expert-kernel/rate-card/rate-card-ingestion.ts src/lib/programs/expert-kernel/rate-card/rate-card-row-parser.ts src/lib/programs/expert-kernel/rate-card/rate-card-templates.ts src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-row-parser.test.ts src/lib/programs/expert-kernel/index.ts` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. The code is pure library code until a later Data Loads slice calls it, so no
runtime activation or environment change is required.

## Rollback Plan

Revert the PR. No migrations or data writes are involved.

## Audit Evidence

- PR URL: pending.
- Focused parser and validation tests prove header normalization, currency/percent parsing,
  optional vendor names, geo modifiers, and `NaN` rejection.

## Known Gaps

- Not yet wired into the Data Loads upload UI/API.
- Does not populate production seed rows or parse the non-repo workbook directly.
- Does not yet write committed rate-card rows into the tenant data plane.
