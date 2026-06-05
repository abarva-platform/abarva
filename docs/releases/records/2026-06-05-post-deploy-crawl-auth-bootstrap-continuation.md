# 2026-06-05-post-deploy-crawl-auth-bootstrap-continuation — Crawl Auth Bootstrap Continuation

## Release ID

`2026-06-05-post-deploy-crawl-auth-bootstrap-continuation`

## Status

`candidate`

## Plain-English Summary

The production post-deploy crawl now keeps testing the remaining personas when a
single demo persona cannot establish a Clerk session. The failed persona is
still recorded as a visible P1 auth-bootstrap finding, but it no longer stops
the entire crawl before Meridian, SkyHarbor, or other tenants can be verified.

## Layer Impact

- `global-control-lane`: updates the shared QA crawl harness and comparator.
- No product runtime UI, tenant data, data-plane schema, or loader behavior
  changes.

## Client Applicability

- All clients covered by the production post-deploy crawl.
- Internal only: CI/deploy verification behavior.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts` records a per-persona
  `auth-bootstrap` observation when Clerk sign-in fails and continues to the
  next persona.
- `src/lib/crawl/baseline-compare.ts` classifies `auth-bootstrap` observations
  as P1 findings instead of generic crawl-execution P0 failures.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` pins the P1
  classification.

## QA / Validation

- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
  passed, 6 tests.
- PASS: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.
- NOT RUN YET: next main post-deploy crawl should continue past Clerk-demo-account
  auth failures and still report product P0s if they appear.

## Rollout Plan

Merge to main. The next `main` push reruns the post-deploy crawl with the
continuation behavior.

## Rollback Plan

Revert this PR. The crawl will return to failing the full run on the first
persona auth-bootstrap error.

## Audit Evidence

- Prior failed main run: `27037354173`, where Clerk ticket auth succeeded for
  `apex-cio` and then the next persona failed with "You have been banned."

## Known Gaps

This does not fix the underlying Clerk demo-user/account protection state. That
should be handled separately by reviewing Clerk user status, moving production
QA to real passwordless identities with profile selection, or dispatching
targeted persona groups with suitable pacing.
