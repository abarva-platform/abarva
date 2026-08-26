# 2026-08-26-tower-first-viewport-truth — Tower opens on the Command Center, with real freshness

## Release ID

`2026-08-26-tower-first-viewport-truth`

## Status

`candidate`

## Plain-English Summary

Two problems with the first thing an executive sees on the Control Tower.

**The header stated a freshness it had not earned.** It showed two dates side by side. One was a
`new Date()` evaluated while the page rendered, so it reported "refreshed today" on every load
forever, whatever the age of the underlying data. The other was a string literal frozen in the
source. Neither came from the data. Meanwhile the posture row already carries `as_of_period` and
`refresh_timestamp`, the query already selects and orders by them, and both were dropped at the
mapping layer and never reached the screen. This release carries the real values through and
renders them. When the source records no period or build time, the header now says so — "As-of date
not recorded" — instead of substituting a plausible-looking date.

**The Command Center did not open the page.** Reconciliation and projection diagnostics rendered
above it, so the first viewport was an audit worksheet and the actual cockpit began below the fold.
Those panels are unchanged and still render in full, immediately beneath the Command Center.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 3 (canonical model):** unchanged. No metric, value, projection, or serving view is
  redefined. `as_of_period` and `refresh_timestamp` already existed on the posture row; this only
  stops discarding them.
- **Layer 4 (products — Tower):** the header reports provenance-derived freshness instead of
  fabricated freshness, and the route's render order puts the Command Center first. No value
  changes.

## Client Applicability

- All clients: yes — every tenant rendering `/tower`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — map `as_of_period` / `refresh_timestamp` out of the
  posture row.
- `src/lib/tower/current-layer-view-model.ts`, `src/lib/tower/command-center/types.ts`,
  `src/lib/tower/command-center/view-model.ts` — carry both fields to the summary.
- `src/components/tower/command-center/TowerCommandCenter.tsx` — replace the frozen literal and the
  render-time date with `freshnessLabel()`, which degrades to an explicit "not recorded" string.
- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`,
  `src/app/(maestro)/tower/page.tsx` — remove the now-dead `refreshedOn` prop so a render-time date
  cannot be reintroduced through it.
- `src/app/(maestro)/tower/page.tsx` — render the Command Center before the reconciliation and
  projection panels.
- `src/lib/tower/__tests__/tower-freshness-provenance.test.ts` — new regression suite.
- Three component test files updated for the removed prop.

## QA / Validation

- New regression suite → 7/7 pass. It asserts the absence of `new Date()` in the route and of any
  hardcoded date literal in the header, so a reintroduction fails the build rather than shipping.
- `jest src/lib/tower/__tests__ src/components/tower src/__tests__/integration/tower`
  → 1109 pass / 23 fail. Baseline measured on clean `origin/main` by stashing: 1102 pass / 23 fail.
  Identical failure set; the +7 are this change's own. No regressions.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean. Note: the first attempt surfaced two real
  type errors that the jest run did not, in a fixture and a partial-type test. Both are fixed;
  jest-green is not type-clean on this repo.
- `eslint` on every changed file → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the repo-owned ACA main deploy workflow builds and deploys. No migration,
no data build, no flag change, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command in this release.
- Approved image digest: assigned by the deploy workflow at build time.
- ACA runtime invariant: must be re-proven post-deploy before this record may claim `live-proven`.
- Worker image invariant: unaffected.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes — a signed-in `/tower` capture showing the Command Center in
  the first viewport and a provenance-derived date in the header.

## Rollback Plan

Revert the squash commit; the deploy workflow ships the prior digest. Code-only, immediate, no
schema or data change. Note that reverting restores both fabricated dates.

## Audit Evidence

- The diff.
- New-suite output and the before/after counts above.
- Post-deploy: ACA runtime invariant proof and a signed-in `/tower` capture.

## Known Gaps

- Not yet live-proven; this record is `candidate`.
- **The header now depends on data that may be null.** If the posture rows carry no `as_of_period`
  or `refresh_timestamp`, the surface will honestly say "not recorded" — which is correct, and may
  also be the first visible sign that the pipeline is not stamping freshness. That is a data-plane
  question this release deliberately does not paper over.
- The generic `AI value posture` headline, the `total evidence actions` count, and the evidence
  trust ribbon are **not** addressed here. They require authored executive content and a ranking
  policy; see `docs/design/tower-executive-cockpit-spec.md`.
- Tower route IA (`/tower`, `/tower/command`, `/tower/legacy`, tenant subsurfaces) is unchanged.
- 23 pre-existing failures remain in the legacy `cio_tower` / v3 runtime-view suites, untouched and
  unrelated.
