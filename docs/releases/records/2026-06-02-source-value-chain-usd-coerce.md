# 2026-06-02-source-value-chain-usd-coerce — Normalize string USD inputs at the Source value boundary

## Release ID

`2026-06-02-source-value-chain-usd-coerce`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source value chain against USD amounts arriving as strings from the Postgres driver or UI call sites. Baseline, negotiated, and realized value statements now coerce those inputs before writing evidence or value-state rows, and the user-facing claim text uses consistent currency formatting instead of raw numbers.

## Layer Impact

- `global-control-lane`: Source value-proof behavior and claim-text formatting are shared application behavior.
- `client-data-lane`: client-scoped Source value rows continue to use the same schema, but amounts are normalized before persistence.

## Client Applicability

- All clients: receive normalized USD handling in Source value-chain writes and cleaner claim text.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/value-chain.ts`: broadens accepted USD input types to include strings, coerces them before persistence, and formats claim text through `formatUsd()`.

## QA / Validation

- PASS: `npx eslint src/lib/source/value-chain.ts`
- PASS: `git diff --check`
- INFO: `npx tsc --noEmit --pretty false` is currently blocked by a repo-baseline missing module error in `tests/accessibility/public-axe.spec.ts` for `@axe-core/playwright`; unrelated to this slice.

## Rollout Plan

Merge to `main`, then deploy the Next.js app to production through the standard Vercel production deployment path. No database migration is required.

## Rollback Plan

Revert the application commit. No migration rollback is required.

## Audit Evidence

After merge, inspect the PR diff, CI output, Vercel deployment, and a Source value-proof flow where negotiated or realized values arrive as strings but render and persist as normalized USD amounts.

## Known Gaps

This slice does not yet add dedicated automated coverage around the value-chain write helpers.
