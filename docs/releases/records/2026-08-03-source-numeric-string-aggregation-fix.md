# 2026-08-03-source-numeric-string-aggregation-fix — Fix numeric-string concatenation in vendor concentration math

## Release ID

`2026-08-03-source-numeric-string-aggregation-fix`

## Status

`candidate`

## Plain-English Summary

Live verification against the newly-loaded SkyHarbor v3 register (Codex's PR
#5884/#5885) found the Vendor & Contract Portfolio page rendering nonsensical
dollar figures — `$InfinityB`, `$3.4e+30B`, `NaN%` concentration shares —
while the per-contract "All contracts" table showed correct values like
`$50.0M`. Root cause: `node-postgres` returns `NUMERIC`/`DECIMAL` columns as
strings, not numbers, but `vendor-contract-portfolio.ts`'s aggregation
functions (`summarizePortfolio`, `computeVendorConcentration`,
`computeRenewalExposure`, `computeContractLeverageSignals`) accumulated
`annual_value` with `+`/`+=` assuming it was already a number. In JavaScript,
`0 + "50000000.00"` is string concatenation, not addition — a single
contract's value displays fine (`Math.abs`/`/` coerce a lone string
correctly), but summing two or more contracts for the same vendor produces a
garbled digit string that later gets coerced to a huge or infinite number.
This was invisible in this session's own unit tests because their fixtures
used JavaScript number literals directly, never a string — exactly what the
real Postgres driver returns.

## Layer Impact

- `global-control-lane`: `vendor-contract-portfolio.ts` is shared logic
  behind the Vendor & Contract Portfolio and Sourcing Opportunities pages for
  every tenant using this data model.

## Client Applicability

- All clients: the fix is a general numeric-coercion correction, not
  tenant-specific.
- Specific clients: only SkyHarbor currently has data loaded into this
  schema, so it's the only tenant where the bug was observable.

## Changes Included

- `src/lib/source/data-model/vendor-contract-portfolio.ts`: added a `toNum()`
  coercion helper and applied it at every arithmetic accumulation site
  (`summarizePortfolio`'s `sum`, `computeVendorConcentration`'s per-vendor
  running total, `computeRenewalExposure`'s `sumAnnual`,
  `computeContractLeverageSignals`'s sorted-values array and per-row
  `annualValue`).
- `src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts`:
  added 3 regression tests that inject real strings (matching what
  `node-postgres` actually returns) instead of number literals, including
  one that explicitly asserts the summed value stays under $1B (the exact
  regression: string concatenation produced values in the 1e22–1e30 range).

## QA / Validation

- PASS: `npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint src/lib/source/data-model/vendor-contract-portfolio.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts`
- PASS: `npx jest src/lib/source/data-model/__tests__/` (32/32, including 3 new)
- Live signed-in proof: pending post-deploy — the Top 10 vendors table and
  headline stat cards on `/source/vendor-portfolio` must show plausible
  dollar figures (tens of millions to low billions, not e+22 or Infinity).

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys
automatically.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked
  `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation — this is pure
computation over already-loaded rows.

## Audit Evidence

- Live screenshot of the Top 10 vendors table showing `$3.412728325888451e+30B`
  before this fix.
- This PR's diff and CI run.
- Post-deploy: live signed-in screenshot showing corrected figures.

## Known Gaps

`contract-360-view.ts` and `sourcing-opportunities.ts` were checked and do
not perform their own multi-row `+`/`+=` accumulation over these numeric
fields (`sourcing-opportunities.ts` reuses the now-fixed functions in this
file; `contract-360-view.ts` looks up single rows via `.find()`, never sums).
No other read-adapter consumer in this data model was found doing unguarded
numeric-string accumulation, but this file was the only one audited in
depth — a broader sweep of every numeric field returned by
`read-adapter.ts` (financial exposure, operational performance, Tower
observations) for the same failure mode has not been done and is real
follow-up work, lower urgency now that the demonstrated bug is fixed.
