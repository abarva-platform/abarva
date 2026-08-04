# 2026-08-03-source-workspace-numeric-coercion-and-promotion — Fix numeric-string concatenation in the Source Workspace explorer, promote it to the canonical `/source` landing

## Release ID

`2026-08-03-source-workspace-numeric-coercion-and-promotion`

## Status

`released`

## Plain-English Summary

Live signed-in verification of the Source Workspace (`/source/preview/workspace`, shipped in
`2026-08-03-source-workspace-live-binding` / PR #5912) found the left-hand Explorer sidebar and the
Leverage lens's quadrant panel rendering nonsensical dollar figures — `$InfinityB` on the "Leverage"
badge, `$8.45e+119B`-style scientific notation on vendor-category badges, `$4.35e+15B` on the
"Build alternatives and renegotiate" quadrant total — while every individual contract/vendor row
and the top Context tiles ($1.4805B annual value, $1.2817B actual spend) rendered correctly.

Root cause: `node-postgres` returns NUMERIC/DECIMAL columns as strings, not numbers. A concurrent
same-day workstream had already found and fixed this exact failure mode inside
`vendor-contract-portfolio.ts`'s own aggregation functions (`2026-08-03-source-numeric-string-aggregation-fix`)
and inside `SourceContract360Page.tsx` (`2026-08-03-contract-360-numeric-coercion-fix`) — which is
why the Context tiles (built from those now-hardened functions) were correct. But
`buildViewModel.ts`/`viewModel.tsx` (the Source Workspace's own client-side view model) do their own
`t + (row.annual_value ?? 0)` accumulations directly over raw rows for the explorer-tree badges,
quadrant totals, and a few narrative sentences — bypassing the fixed functions entirely, so those
specific aggregates kept string-concatenating a single value looks fine (`Math.abs`/`/` coerce a
lone string), but summing two or more silently concatenates digits into a huge or infinite number.

Separately, per explicit direction, the Source Workspace is being promoted from a preview surface to
the canonical `/source` landing page; the prior portfolio-book dashboard remains reachable at
`/source/portfolio` for existing deep links (including its `?stage=`/`?status=`/`?demo=` query-param
consumers) but is no longer the default entry point.

## Layer Impact

- `client-data-lane`: `buildViewModel.ts`/`viewModel.tsx` are the Source Workspace's client-side
  view model, reading governed `source.contract_360` / `source.vendor_contract_portfolio` rows for
  the SkyHarbor tenant today. The fix is a pure display-layer coercion over already-loaded rows —
  no schema, query, or business-calculation change.
- `global-control-lane`: `/source/page.tsx`'s redirect target changes for every tenant hitting the
  Source nav entry. `/source/portfolio`, `/source/events/*`, `/source/vendor-portfolio*`,
  `/source/sourcing-opportunities`, `/source/renewal/*` are all unchanged and remain independently
  reachable.

## Client Applicability

- All clients: the numeric-coercion fix and the `/source` redirect change apply to every tenant.
- Specific clients: only SkyHarbor currently has data loaded into `source.contract_360` /
  `source.vendor_contract_portfolio`, so it is the only tenant where the explorer numbers are
  currently observable; other tenants continue to see the workspace's honest empty state.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: import `numberFromDb` from
  `vendor-contract-portfolio.ts`; add `addRowAnnualValue`/`addAnnualValue` reducers and use them (or
  an inline `numberFromDb(...)  ?? 0`) at every `+`-based accumulation over a raw row's
  `annual_value` / `annualValue` / `critical_application_count` — the explorer-tree exec/vendor-
  category/contract-list badges, the vendor/contract-list narrative thesis sentences, the
  concentration decision strips, the leverage quadrant panel and its narrative sentence, and the
  vendor-detail critical-application total.
- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`: same fix for the concentration
  Pareto-tail bucket, the renewal "further active contracts" narrative, and the Explore lens's
  window/group-by aggregates.
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts` (new):
  injects string-typed `annual_value` fixture rows (matching what the real Postgres driver returns)
  across three contracts/vendors, asserts every explorer-tree badge and quadrant-panel value is
  neither scientific notation nor `Infinity`, and asserts the "Leverage" badge is the exact expected
  sum (`$127.0M`). Confirmed this test fails (crashes on the pre-fix code path) without the fix and
  passes with it.
- `src/app/(maestro)/source/page.tsx`: redirect target changed from `/source/portfolio` to
  `/source/preview/workspace`.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint` on all four changed/new files
- PASS: `npx jest src/lib/source/data-model/__tests__/ src/app/(maestro)/source/preview/workspace/__tests__/` (33/33)
- Confirmed regression coverage: reverted the two source fixes with the new test present — both new
  tests fail (the pre-fix code path throws) — then restored the fixes and re-ran — both pass.
- PASS: `npx jest src/lib/data-plane` (359/362; the 3 failures are pre-existing
  `Missing ABARVA_AZURE_DATABASE_URL` environment-credential gaps, confirmed identical with and
  without this change — not a regression).
- Live signed-in proof (pre-fix, this session): screenshots of `/source/preview/workspace` showing
  `$InfinityB` on the Leverage exec-tree badge and `$8.453721447016953e+119B`-style figures on
  vendor-category badges, reproduced after a hard cache-busted reload (ruling out stale-bundle
  cache as the cause).
- Live signed-in proof (post-fix, PR #5922 merged as `cf394057b`, ACA revision
  `ca-abarva-web-lab-eastus--mcf394057`, image digest
  `sha256:ca229293c53f9885708a8993267babcddbe7832db9167ac100a0b06539c02341` at 100% traffic,
  confirmed via `az containerapp show`/`revision list`):
  - `https://app.abarva.ai/source` redirects to `/source/preview/workspace` (was `/source/portfolio`).
  - Leverage exec-tree badge: `$863.8M` (was `$InfinityB`). Vendor-category badges: `$348.0M`,
    `$206.0M`, `$247.7M`, `$193.6M`, `$160.8M`, `$173.6M`, `$150.7M` (were `$8.45e+119B`-style).
    Leverage quadrant "Build alternatives and renegotiate": `$491.5M` (was `$4.35e+15B`).
  - Portfolio reconciliation unchanged and correct: 119 contracts, 28 vendors, $1.4805B annual
    value, $1.2817B actual spend, governed as-of 30 Jun 2027.
  - Explorer lens-switching exercised across Context, Explore, Concentration, Renewals, Leverage,
    Opportunities — each renders its own canvas with plausible figures, no fabricated heatmap, no
    fabricated addressable-spend or rule-ID fields, decision strips and quadrant panels all correct.
  - Contract detail API exercised on 3 contracts (CTR-064, CTR-090, CTR-063) — each triggered its
    own `/api/source/workspace/contract/{id}` call (200), financial exposure loaded, operational
    fields absent showed "Not established" (not fabricated zero), document evidence rows showed
    real `source_file_id`/`review_state: unreviewed`, Scope tab showed honest
    Explicit/Reviewed/Vendor-inferred/Unresolved counts (0/0/0/0 where no scope rows exist, not a
    guessed value).
  - MacBook width (1440×900): Explorer usable, aVa panel opens/collapses cleanly reflowing the
    canvas, no horizontal overflow (`document.documentElement.scrollWidth` === `clientWidth`), zero
    console errors across the whole session.
  - Regression: `/source/vendor-portfolio`, `/source/sourcing-opportunities`, and `/source/events`
    (→ `/source/portfolio`, the Door-1 event workflow — "SkyHarbor AMS Outsourcing RFP", step 2 of
    11) all load correctly, unaffected by this change.
  - Not independently re-verified this session: a second tenant's honest-empty-state behavior (no
    second-tenant credential available in this session) — unchanged by this release's diff, so risk
    is low, but this specific check was not re-run live.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — this is a code-only fix plus a redirect-target change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released` — the Leverage
  exec-tree badge and vendor-category badges must show plausible dollar figures (tens/hundreds of
  millions to low billions, not `Infinity` or scientific notation), and `/source` must land
  signed-in users on the Source Workspace. **Done — see QA / Validation.**

## Rollback Plan

Code rollback by reverting the PR. No data mutation — this is pure computation over already-loaded
rows plus a redirect target. Reverting restores `/source` → `/source/portfolio` and the pre-fix
(buggy) explorer aggregates; it does not touch anything the two same-day sibling fixes
(`2026-08-03-source-numeric-string-aggregation-fix`, `2026-08-03-contract-360-numeric-coercion-fix`)
already corrected.

## Audit Evidence

- Live pre-fix screenshots of `/source/preview/workspace` (Context and Leverage tabs) showing the
  `$InfinityB` / scientific-notation figures, captured this session via a signed-in real-Chrome
  session, reproduced after a cache-busted hard reload.
- This PR's diff and CI run.
- `docs/releases/records/2026-08-03-source-numeric-string-aggregation-fix.md` and
  `docs/releases/records/2026-08-03-contract-360-numeric-coercion-fix.md` — the sibling fixes this
  release completes coverage for.
- Post-deploy: live signed-in screenshot of `/source` landing on the workspace, and the explorer
  showing corrected figures.

## Known Gaps

- This release fixes every `+`-based accumulation found in `buildViewModel.ts`/`viewModel.tsx` by
  direct audit of the file, but — like its sibling fixes — does not assert there is no other
  unguarded numeric-string accumulation anywhere else in the app reading through
  `read-adapter.ts`/`azureRead`. A process-wide `pg` NUMERIC type-parser registration (fixing this
  class of bug at the driver boundary instead of per call site) was considered and rejected in favor
  of matching this codebase's established per-call-site `numberFromDb()` pattern from the two sibling
  fixes merged today; a broader sweep or a driver-level fix remains real follow-up work.
- `/source/portfolio` itself is unchanged and still reachable directly; it is not redirected to the
  workspace, to avoid breaking its `?stage=`/`?status=`/`?demo=` deep-link consumers. Whether to
  retire it fully is a separate decision, not made by this release.
- Two pre-existing issues observed during live proof, neither introduced by this release and neither
  fixed here: (1) a contract's "Source confidence" tile shows `NaN%` when `source_confidence` is
  null — `pct()` doesn't guard against a null/undefined input the way `money()` does; (2) Next.js RSC
  prefetch requests for `/tower`, `/source`, and `/strategic-moves` (triggered by top-nav link hover)
  returned `503` during this session while `/intelligence` returned `200` — full-document navigation
  to all of these routes worked correctly, and `/source` was affected identically to two routes this
  PR never touched, so this is not attributable to this change. Both are real follow-up items.
