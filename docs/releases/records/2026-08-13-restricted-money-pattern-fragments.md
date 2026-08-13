# 2026-08-13-restricted-money-pattern-fragments — Restricted Money Pattern Leaves No Fragment

## Release ID

`2026-08-13-restricted-money-pattern-fragments`

## Status

`candidate`

## Plain-English Summary

The pattern that redacts money amounts for users not entitled to exact financial values matched two
common shapes incorrectly.

A spelled-out magnitude was cut in half. The list of magnitude words was ordered with `m` before
`million`, so `$5 million` matched only `$5 m` and the answer read
`[restricted financial value]illion of value` — a corrupted line that still disclosed the magnitude of
a restricted amount.

A bare amount ate the space after it. The space sat outside the optional magnitude group, so
`$8 of value` matched `$8 ` and rendered as `[restricted financial value]of value`.

Both are fixed by ordering the magnitude words longest-first and only consuming the space when a
magnitude word actually follows.

## Layer Impact

- Release lane: `global-control-lane`
- Products: every agent surface that streams through the shared agent route and applies the restricted
  output policy.
- Canonical model: No canonical data, adapter, migration, or entitlement rule changed. What is
  restricted and for whom is unchanged; only the match boundary of the existing pattern is corrected,
  so it now covers the whole amount rather than part of it.

## Client Applicability

- All clients: Yes, wherever a user's policy has `exactFinancialValues: false`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. Entitled users are unaffected — the pattern is not applied to them.

## Changes Included

- `src/lib/agent/restricted-output-policy.ts` — `MONEY_PATTERN` and `MONEY_TEST_PATTERN`
- `src/lib/agent/__tests__/restricted-financial-streamer.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/restricted-financial-streamer.test.ts` — 11 tests, including
  the spelled-out magnitude case, the eaten-space case, and a regression set covering compact
  (`$1.56B`, `$140.7M`), comma-separated (`$1,250,000`), and banded (`$2M–$5M`) amounts
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- `npx jest src/lib/agent` — 9 suites / 23 tests fail identically on `origin/main` with these changes
  stashed. Pre-existing and untouched; passing tests rise from 806 to 809.

How it was found: a live signed-in aVa answer on the Responses stage rendered
`[restricted financial value]–[restricted financial value]of protected value`, which showed the
pattern was consuming the trailing space. Tracing that pattern surfaced the magnitude-word bug beside
it.

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
- Live signed-in proof required: Yes — a restricted answer containing money values must show no word or
  digit fragment beside a redaction marker, and no missing space after one.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Reverting restores the previous fragment behaviour.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in aVa answer after deploy, checked for fragments beside redaction markers.

## Known Gaps

- The financial-metric pattern's 80-character lookahead still cannot be fully honoured mid-stream. That
  limitation predates this change and is unchanged.
- Whether these values should be restricted for this tenant at all remains open as AVA-S-03; this only
  ensures that when a value is restricted, nothing of it survives in the output.
