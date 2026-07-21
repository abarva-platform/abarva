# 2026-07-21-source-shell-vendor-response-coverage — SOURCE-SHELL-005: real per-vendor coverage in the Responses step body

## Release ID

`2026-07-21-source-shell-vendor-response-coverage`

## Status

`candidate` — PR open, not yet merged.

## Plain-English Summary

Continuing the mockup-anchored comparison against the user's Source Event Shell redesign
(`Source Event Shell (1).html`): the mockup's Responses stage showed each vendor's response
completeness (Halcyon MS/Northgate Global "complete", Vantage Digital "partial", Cormorant IT
"awaiting") directly in the step body, not just a bare upload prompt. Two other candidate gaps
from the same comparison pass (a `shouldcost`-flavored step body at Evaluation, and a
`bridge`-flavored step body at Executive Decision) were investigated and **retracted** — the
mockup's actual rendered step bodies for those two are plain upload/decide prompts with an
"evidence expected" chip, identical in shape to what's already live. Only the Responses vendor
tracker held up under direct verification.

This closes it honestly, not as a pixel copy: the mockup's card shows generic
"requirements answered" and file chips (`response.pdf`, `pricing.xlsx`); the real data model
(`buildResponseCoverageInsight` → `VendorCoverageView`, already live in the Intelligence tab)
tracks per-vendor **value-lever** coverage (addressed/partial/dodged/not-answered), not
per-document upload status. Rather than fabricate a file-tracking cross-reference that doesn't
exist, this surfaces the real lever-coverage data — same underlying computation the
Intelligence tab already shows, now also inline in the Steps tab where the mockup put it, so
there is one source of truth for "which vendor addressed what," not two.

This is `SOURCE-SHELL-005` — a new item discovered during the mockup-anchored audit, tracked
in `docs/backlog/source-product-backlog.md`.

## Layer Impact

- `global-control-lane`: `SourceAnalyticsCanvas.tsx` only (`StepDetail`, new
  `VendorResponseCoverageList`). No schema, no API route, no new data source — reuses the
  already-computed `response_coverage` insight.

## Client Applicability

- All clients: yes — no gate, no flag. Only renders when a stage's active step's
  `factTemplateCode` is exactly `RESPONSE_COVERAGE_V1` (currently only Responses) and the
  insight is genuinely live.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - `StepDetail` now receives `stepInsight` (already computed on `view.intelligence.stepInsight`
    — no new data fetch).
  - In the `step.type === 'provide'` branch: when `step.factTemplateCode ===
    'RESPONSE_COVERAGE_V1'` and the insight is `kind: 'response_coverage'` with `isModel:
    false` and real `vendors` data, renders the new `VendorResponseCoverageList` below the
    existing upload widget.
  - New `VendorResponseCoverageList`: one row per vendor, real `addressed`/`partial` counts
    over `totalLevers`, status derived as Complete (`addressed === totalLevers`) / Partial
    (`addressed + partial > 0`) / Awaiting (neither) — no fabricated fields.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx`
  (new).
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — no errors reference either changed/added file (5 pre-existing, unrelated
  errors in `src/components/home/*` — missing `@xyflow/react`/`@dagrejs/dagre` type
  declarations — confirmed present on a clean `origin/main` checkout via `git stash` +
  re-run, before this diff existed).
- `pass` — `npx eslint` on both changed/added files — 0 errors.
- `pass` — 3 new functional tests: (1) a fixture-integrity guard confirming
  `SAMPLE_RESPONSES_STAGE`'s real task still uses `factTemplateCode: 'RESPONSE_COVERAGE_V1'`
  (fails loudly if renamed, rather than the real test below silently asserting nothing); (2)
  renders the real `SourceAnalyticsCanvas` with the real `SAMPLE_RESPONSES_STAGE` fixture and
  a real live `response_coverage` insight, asserts the actual rendered per-vendor rows and
  derived status (Complete/Partial/Awaiting) match the real counts; (3) confirms nothing extra
  renders when the insight is still the honest MODEL (no real vendor data yet) — never fakes
  live data.
- `pass` — full `SourceAnalyticsCanvas.__tests__` sweep: 51/53 passed. The 2 failures
  (`StrategyStage.test.tsx`, `SourceAnalyticsCanvas.thread.test.tsx`) confirmed pre-existing
  and unrelated — same failures on a clean `origin/main` checkout throughout this session's
  work — zero regressions from this change.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI addition to an existing,
already-shipped workspace, reusing already-computed data — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, but expected to be limited — no event in the currently
  available tenant data has live `response_coverage` data yet (would require real vendor
  response ingestion post-Scope), so a live click-through will likely show the honest
  no-extra-content MODEL state rather than the populated vendor list. Both are correct,
  intended behavior.

## Rollback Plan

Revert the merge commit. Reverting removes the inline vendor-coverage list — the underlying
insight computation and the Intelligence-tab rendering of it are unaffected either way.

## Audit Evidence

- PR: to be added once opened.
- Test/typecheck/lint logs: see QA / Validation.

## Known Gaps

- Live signed-in proof will likely only show the MODEL (empty) state given current tenant
  data — will be appended honestly, not overstated, once performed.
- Does not replicate the mockup's file-chip / document-completeness treatment
  (`response.pdf`/`pricing.xlsx`, "148 requirements answered") — that would require a
  genuinely different data source (per-document upload tracking cross-referenced by vendor)
  not currently computed anywhere in this codebase. Flagged here rather than silently
  approximated.
