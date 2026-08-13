# 2026-08-12-restricted-financial-stream-redaction — Restricted Financial Redaction Across Stream Boundaries

## Release ID

`2026-08-12-restricted-financial-stream-redaction`

## Status

`candidate`

## Plain-English Summary

For a user who is not entitled to see exact financial values, the agent redacts money amounts before
they stream to the browser. That redaction was applied to each streamed fragment on its own, and the
model emits a money value across several fragments. When `$22.1K` arrived as `$22` then `.1K`, the
first fragment was redacted and the second had no `$` left to match, so it streamed through untouched.

The observed output was `[restricted financial value].1K` — part of a restricted amount reaching a user
who is not entitled to it.

Redaction is now boundary-aware. A trailing fragment that could still grow into a money token is held
back and re-tested when the next fragment arrives, so redaction always sees the whole token. The
hold-back is capped so a stray `$` in prose can never stall the stream, and anything still held is
flushed when the stream ends so a value at the very end of an answer is never dropped.

## Layer Impact

- Release lane: `global-control-lane`
- Products: every agent surface that streams through the shared agent route and applies the restricted
  output policy.
- Canonical model: No canonical data, adapter, migration, or entitlement rule changed. What is
  restricted and for whom is unchanged; only the point at which redaction is evaluated moved, so it can
  no longer be defeated by a fragment boundary.

## Client Applicability

- All clients: Yes, wherever a user's policy has `exactFinancialValues: false`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. Entitled users stream through untouched exactly as before.

## Changes Included

- `src/lib/agent/restricted-output-policy.ts` — adds `createRestrictedFinancialTextStreamer`
- `src/lib/agent/__tests__/restricted-financial-streamer.test.ts` (new)
- `src/app/api/chat/agent/route.ts` — the stream writer uses the streamer, and flushes it before close

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/restricted-financial-streamer.test.ts` — 8 tests, including a
  direct reproduction of the live leak (`$22` + `.1K`), a value split one character at a time, a value
  that ends the stream, and equivalence with whole-string sanitization
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- `npx jest src/lib/agent src/app/api/chat/agent` — 12 suites / 29 tests fail identically on
  `origin/main` with these changes stashed. Pre-existing and untouched; passing tests rise from 851 to
  859 with this change.

How the leak was found: the aVa Source probe (`docs/testing/source-ava-hard-qa-2026-08-12.md`) returned
`[restricted financial value].1K` in a live signed-in answer, which showed the redaction had been
applied to a partial token.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. No manual runtime mutation, migration, or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image, and revision health match
  the deployed digest before claiming live-proven.
- Worker image invariant: Not affected; no worker job changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — a restricted answer containing money values must show no digit
  fragments alongside a redaction marker.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Reverting restores the previous per-fragment redaction, including the leak.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in aVa answer after deploy, checked for digit fragments next to redaction markers.

## Known Gaps

- Only the money pattern is boundary-safe. The financial-metric pattern uses an 80-character lookahead
  that a stream cannot fully honour, so a percentage or multiple qualified by a distant keyword can
  still evaluate differently mid-stream than it would on the complete string. That limitation predates
  this change and is not addressed here.
- This fixes leakage of restricted values. It does not decide whether these values should be restricted
  for this tenant at all — aVa redacts figures the tenant's own surfaces display, tracked separately as
  AVA-S-03.
