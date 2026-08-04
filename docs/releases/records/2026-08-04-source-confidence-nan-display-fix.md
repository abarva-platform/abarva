# 2026-08-04-source-confidence-nan-display-fix — Never render "NaN%" for a non-finite source_confidence value

## Release ID

`2026-08-04-source-confidence-nan-display-fix`

## Status

`candidate`

## Plain-English Summary

Live testing ahead of tomorrow's client walkthrough found a real display bug: the Source Workspace's
Contract 360 header strip and Optimization tab showed the literal text **"NaN%"** for "Source
confidence" on a real contract (CTR-090, Salesforce Data Platform Agreement 3). Root cause: the
shared `pct()` formatter (`(v * 100).toFixed(1) + '%'`) has no guard against a non-finite input, and
`contract.source_confidence` is holding a non-numeric value for this row — most likely the same class
of Postgres NUMERIC-returned-as-string issue this file has hardened against before (see
`2026-08-03-source-numeric-string-aggregation-fix` and `2026-08-03-contract-360-numeric-coercion-fix`),
just on a field that reaches a formatter via multiplication (`*`) rather than the string-concatenation
(`+`) pattern those fixes targeted — multiplication auto-coerces a clean numeric string fine, but a
malformed/non-numeric value (e.g. an empty or non-numeric string) produces `NaN`, which passed the
existing `!= null` guard undetected (`NaN != null` is `true` in JavaScript) and reached the client as
literal garbage text.

This release makes `pct()` itself defensive (returns "Not established" for any non-finite input,
matching this file's existing `money()`/`fmtDate()` pattern) and tightens all four call sites that
read `source_confidence` to also check `Number.isFinite(...)` before formatting, so a bad value falls
through to the same honest "Not established" / "Mixed" / "Portfolio-level" gap language already used
everywhere else on this page, instead of ever reaching the screen as "NaN%".

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/viewModel.tsx` and
  `buildViewModel.ts` are UI-layer formatting/view-model code for the Source Workspace, used by all
  tenants. This is a pure formatting guard — no data read, computation, or governed value changes;
  a value that was already `null` continues to render exactly as before.

## Client Applicability

- All clients using the Source Workspace. Any tenant/contract whose `source_confidence` column holds
  a non-finite value will now see "Not established" instead of "NaN%" — a strict readability
  improvement with no other behavior change.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`: `pct()` returns `'Not established'` for
  any non-finite input instead of propagating `NaN` into the formatted string.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: the four `source_confidence`
  read sites (header-strip value item, two evidence-caption sites, one status-selection site) now
  check `Number.isFinite(c.source_confidence)` alongside the existing `!= null` guard, so a
  non-finite value correctly falls into this page's existing "missing"/"Not established" styling and
  bucket (e.g. `pendingItems`) rather than reaching `valueStrip` at all.
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`: new
  regression test asserting a non-finite `source_confidence` never appears as "NaN" anywhere in the
  rendered `valueStrip` and is instead correctly routed to `pendingItems`.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` (clean worktree off `origin/main`)
- PASS: `npx eslint` on all three changed/added files
- PASS: `npx jest buildViewModel.numeric.test` — 6/6 (5 pre-existing + 1 new regression test)
- Live signed-in proof: pending post-deploy — reload CTR-090's Contract 360 Overview and Optimization
  tabs on the deployed endpoint and confirm "Source confidence" reads "Not established", not "NaN%".

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — pure display-formatting fix.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change — reverting restores the exact
prior (buggy) "NaN%" display for the affected field.

## Audit Evidence

- Live pre-fix screenshot/observation (this session): CTR-090's Contract 360 Overview and Optimization
  tabs both showing "SOURCE CONFIDENCE: NaN%" on `app.abarva.ai`.
- This PR's diff and CI run.
- Post-deploy: live signed-in re-check of the same contract's Overview/Optimization tabs.

## Known Gaps

- This release fixes the display layer only. It does not investigate or fix why
  `source.contract_360.source_confidence` holds a non-finite value for CTR-090 (or any other affected
  row) in the underlying governed data — that is a separate data-quality question for the Source data
  plane, out of scope for a same-day display fix ahead of a client walkthrough. Worth a follow-up data
  audit if this recurs across many contracts, not just the one found live today.
