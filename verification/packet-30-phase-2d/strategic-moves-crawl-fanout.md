# Strategic Moves Crawl Fan-Out Verification

Date: 2026-05-29

## Trigger

PR #2442 deployed successfully and initially passed live health. During the
authenticated post-deploy crawl, `/api/health` later returned HTTP 503 and
Vercel logs showed `EMAXCONNSESSION` during `/strategic-moves` gate evaluation.

## Finding

The Strategic Moves portfolio list hydrated visible moves with `Promise.all`.
Each move performed multiple database reads and also ran full gate evaluation.
For a list of up to 8 moves, this created a burst of database sessions during
crawl.

## Change

- Portfolio hydration now runs sequentially.
- Portfolio hydration skips expensive gate evaluation by default.
- Detail/workspace callers still use full gate evaluation unless they opt out.

## Validation

- PASS: focused Strategic Moves transformer test.
- PASS: focused ESLint over changed transformer/test files.
- PASS: full TypeScript check.

## Rollback

Revert the PR. No schema or data rollback required.
