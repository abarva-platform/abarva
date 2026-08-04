# 2026-08-03-contract-360-numeric-coercion-fix — Fix "Not available" on Contract 360 numeric fields

## Release ID

`2026-08-03-contract-360-numeric-coercion-fix`

## Status

`candidate`

## Plain-English Summary

Live verification found the Contract 360 detail page (`/source/vendor-portfolio/[contractId]`)
showing "Not available" for Commercial Terms figures (annual value, total committed value,
committed/actual annual spend), Financial Exposure figures (linked budget/forecast/actual/
committed), Operational Performance figures, Initiative Dependency approved budget, Tower value
claim promised/calculated values, and Evidence Lineage confidence — even though the exact same
contracts show correct dollar figures on the Vendor & Contract Portfolio list page one click away.

Root cause: `node-postgres` returns `NUMERIC`/`DECIMAL` columns as strings, not numbers, even
though this repo's row types declare them `number | null`. `SourceContract360Page.tsx` passed
these raw driver values straight into `formatUsdCompact`/`formatPct`, which use the strict
`Number.isFinite` check — that returns `false` for a string, so every numeric field silently
rendered "Not available" instead of the real value. The sibling list-page view
(`vendor-portfolio-view.ts`) already had this exact coercion fixed via a `numberFromDb()` helper
in a same-day PR; `SourceContract360Page.tsx` was never updated to match, and had no test
coverage that would have caught the gap.

Separately, the Evidence Lineage panel's caption claimed every extraction "cites the source file,
page, and section it came from." For CSV/structured-import extractions (`source_kind: 'column'`),
page/section is structurally not applicable — only document-span extractions (`source_kind:
'span'`) carry that data. The caption has been softened to describe this accurately instead of
overpromising a citation depth that CSV-sourced data can't carry.

## Layer Impact

- `global-control-lane`: `SourceContract360Page.tsx` is shared UI behind Contract 360 for every
  tenant using this data model.

## Client Applicability

- All clients: the fix is a general numeric-coercion correction and caption accuracy fix, not
  tenant-specific.
- Specific clients: only tenants with the Source v3 data model loaded currently exercise this
  page, so observable impact is scoped to those tenants today.

## Changes Included

- `src/components/source/SourceContract360Page.tsx`: import `numberFromDb` from
  `vendor-contract-portfolio.ts` and wrap every raw DB-sourced numeric value at its ~14 call
  sites (Commercial Terms, conflict-note resolved values, extraction confidence, Financial
  Exposure, Operational Performance, Initiative Dependency approved budget, Tower value claim
  promised/calculated values, Evidence Lineage confidence) before passing to
  `formatUsdCompact`/`formatPct`. Softened the Evidence Lineage caption to not promise page/section
  citation for structured-import extractions.
- `src/components/source/__tests__/SourceContract360Page.test.tsx` (new): regression test that
  renders the page with string-typed numeric fixture values (matching what the real Postgres
  driver returns) and asserts real currency/percentage values render instead of "Not available",
  plus a second test confirming genuinely absent values still render `—`.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint src/components/source/SourceContract360Page.tsx src/components/source/__tests__/SourceContract360Page.test.tsx`
- PASS: `npx jest src/components/source/__tests__/SourceContract360Page.test.tsx` (2/2)
- PASS: `npx jest src/lib/source/data-model/__tests__/contract-360-view.test.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts` (24/24, no regression)
- Live signed-in proof: pending post-deploy — Contract 360 headline financial figures must show
  real dollar amounts matching the Vendor & Contract Portfolio list page, not "Not available".

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation — this is pure display-layer coercion over
already-loaded rows.

## Audit Evidence

- Live screenshots of Contract 360 showing "Not available" for Salesforce Data Platform
  Agreement 3 and NorthPeak Consulting Saas Agreement 1 before this fix, with the same figures
  rendering correctly on the Vendor & Contract Portfolio list page.
- This PR's diff and CI run.
- Post-deploy: live signed-in screenshot showing corrected figures on both contracts.

## Known Gaps

A separate, per-contract data-population gap was found during the same investigation: one
contract's denormalized `scoped_application_count` (75) doesn't reconcile with its
`contract_application_scope` junction rows (0) — the aggregate column and the detail rows are
independently sourced and nothing cross-checks them. This is a data-population gap, not a code
defect in this file, and is not addressed by this release. Worth a spot-check across a few more
contracts to confirm how isolated it is.
