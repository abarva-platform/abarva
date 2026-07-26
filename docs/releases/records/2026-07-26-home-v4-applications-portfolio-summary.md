# 2026-07-26-home-v4-applications-portfolio-summary — a real Applications & Systems landing experience

## Release ID

`2026-07-26-home-v4-applications-portfolio-summary`

## Status

`candidate` — verified locally against real fixture content, not yet merged.

## Plain-English Summary

Third slice of the V4 Knowledge experience productization work (PR4 of the home-v4 pivot). The
`apps` dimension already had a real, filterable application inventory grid
(`HomeV4ApplicationsGrid`, built earlier this session) — but it rendered as one more block inside
the generic per-dimension template, with no summary of the portfolio it's showing. This gives it a
real landing-experience header: a portfolio summary strip computed from the exact same `full_rows`
already loaded for the grid, no new data plumbing.

Five real stats, each stating its own coverage rather than silently treating a missing field as
zero: total application count; total annual run cost (with an explicit "N of M apps" note when some
applications lack cost data); percentage with a named owner on file; the real criticality mix
(whatever values a tenant's source data actually uses — no invented "P0/P1/P2" relabeling); and the
top real hosting values (no fabricated "cloud vs on-prem" binary — several real hosting values like
`vendor_hosted`/`custom`/`package` don't cleanly split into that binary, so they're shown as the
source data actually names them).

## Layer Impact

- `internal-admin` lane: this changes only the V4 book-mode `apps` dimension's rendering
  (`HomeV4ApplicationsGrid`, reached via `/home/v4-preview`). No tenant currently has an approved V4
  pack, so no client-facing surface is affected.

## Client Applicability

- Internal only. No client-visible surface changes.

## Changes Included

- `src/components/home/v4/HomeV4ApplicationsGrid.tsx`: new `countBy()` helper and
  `HomeV4ApplicationsPortfolioSummary` component, rendered above the existing filterable grid.
- `src/components/home/v4/__tests__/HomeV4ApplicationsGrid.portfolio-summary.test.tsx` (new): 6
  tests against the real `first-capital` fixture (260 real applications) — real total count, real
  cost total with honest coverage note, real owner-coverage percentage, real criticality values
  present verbatim (no relabeling), and confirms no fabricated cloud/on-prem binary appears.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- `pass` — new test suite: 6/6 passing, against real fixture content (260 real applications, not
  synthetic).
- `pass` — full V4 component test suite: 13/13 passing (this suite plus the chapter-navigation
  suite from the prior PR).
- Live signed-in browser verification against `/home/v4-preview` was not possible from this
  environment (same platform-admin-session gap as the two prior PRs in this series) — verification
  instead used the real fixture content directly, the same JSON `/home/v4-preview` serves.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live signed-in verification on `/home/v4-preview`, once a platform-admin session is available.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, deferred (same outstanding gap as the two prior PRs in this
  series) — not skipped, explicitly documented.

## Rollback Plan

Revert the PR. No schema or data change; the summary component derives everything from `full_rows`,
already loaded by the existing grid.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (6/6 passing) against real fixture content.

## Known Gaps

- Live signed-in browser verification is deferred, same as the two prior PRs in this series.
- This is the third and, for now, final slice of the initial PR4 pass (chapter navigation → real
  relationship graph → Applications & Systems portfolio summary). Further productization (e.g. a
  similarly dedicated landing treatment for other data-rich dimensions, or a fuller
  dependency-lifecycle view) is separate, not-yet-scoped follow-up work.
