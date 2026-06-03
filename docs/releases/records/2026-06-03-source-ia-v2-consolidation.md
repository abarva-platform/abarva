# 2026-06-03-source-ia-v2-consolidation — Source IA: four home surfaces → two

## Release ID

`2026-06-03-source-ia-v2-consolidation`

## Status

`candidate`

## Plain-English Summary

Source had four overlapping "home" views of the same event set. `/source` dropped you on the busiest, lowest-clarity page (`/source/events`), and the sub-nav offered Queue + Events + Portfolio as three peer tabs. This change consolidates Source to **two surfaces**: **Decisions** (the Decision Queue — what to decide today, the act-mode landing) and **Portfolio** (the event table — analyze mode). `/source` now lands on Decisions, the standalone Events surface folds into Portfolio, and the sub-nav drops to two tabs.

Gated by `NEXT_PUBLIC_SOURCE_IA_V2` (default ON). Setting it to `0` restores the prior four-surface behavior on the next deploy.

## Layer Impact

- **global-control-lane**: navigation/routing for all clients. Two route redirects (`/source` → Decisions, `/source/events` → Portfolio) and the sub-nav tab set, both behind the flag. No schema/RLS/data change.

## Client Applicability

- All clients (flag default ON).
- Feature flag: `NEXT_PUBLIC_SOURCE_IA_V2` — ON by default; `=0` reverts.

## Changes Included

- New `src/lib/source/source-ia-v2.ts` — `isSourceIaV2()`, the single switch (public-prefixed so the client sub-nav and server redirects read one source of truth).
- `src/app/(maestro)/source/page.tsx` — lands on `/source/queue` (Decisions) under v2, else `/source/events`.
- `src/app/(maestro)/source/events/page.tsx` — redirects to `/source/portfolio` under v2 (the M0 canonical-metrics consumer remains for the flag-off path).
- `src/components/source/SourceSubNav.tsx` — two-tab set (`Decisions` + `Portfolio`) under v2; event-detail paths light Portfolio; legacy three-tab set retained for rollback.
- `tests/unit/source-subnav-active-state.test.ts` — rewritten to cover both IA states.

## QA / Validation

- `jest tests/unit/source-subnav-active-state.test.ts` (a `test:nav` file) → **13/13 pass**, both flag states.
- `tsc --noEmit` clean on touched files · `eslint` clean.
- **Not verified by the author in a signed-in browser** (auth barrier). Relies on CI's "Routes and disclaimers", cross-browser smoke, and axe checks, plus a post-deploy authenticated check by the owner. Kill-switch (`NEXT_PUBLIC_SOURCE_IA_V2=0`) reverts if anything renders wrong.

## Rollout Plan

Merge → Vercel deploy → IA v2 is live (flag default ON). Owner verifies the Decisions landing + 2-tab nav signed-in.

## Rollback Plan

Set `NEXT_PUBLIC_SOURCE_IA_V2=0` in Vercel env and redeploy (≈1 min) — restores the four-surface behavior with no code revert. Or revert the PR.

## Audit Evidence

- Audit source: `reports/2026-06-03-source-simplicity-audit/` — Tier-1 consolidation (`03-clutter-inventory.md` S1/S2), target IA (`07-target-state-sketches.md` §A), execution plan M1b (`10-execution-plan.md`).
- PR URL: _to be filled on push_

## Known Gaps

- URL purity deferred: `/source/queue` remains the canonical Decisions URL (with `/source` redirecting to it) rather than `/source` rendering the Queue directly — a cosmetic follow-up; landing behavior already matches the target.
- Author could not visually verify rendering (sign-in barrier); owner verification + the env kill-switch cover this.
