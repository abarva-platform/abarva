# 2026-07-07-source-portfolio-realign — Redesigned Source Portfolio home ("Your sourcing book")

## Release ID

`2026-07-07-source-portfolio-realign`

## Status

`candidate`

## Plain-English Summary

Realigns the Source Portfolio home page (`/source/portfolio`) to the standalone
"Your sourcing book" design, matching the redesigned Source stage canvas
(analytics tokens: serif headings, paper ground, hairlines, teal aVa accent).

The redesign ships DARK behind the existing `source_analytics` feature flag,
which is OFF for every tenant except the Lakeshore value-analytics pilot. When
the flag is ON the route renders the new book; when OFF the current portfolio
table is byte-for-byte untouched.

The redesign is a UI realign only — deterministic and honest. Every headline
number is derived from the real portfolio derivations, or renders an honest
empty/placeholder state. No live figure is fabricated:

- Active events, spend under management, and each event's projected value band
  (real point value ±20%, stamped `v2 pending`) come from the real
  `SourcingEventSummary` derivations.
- Renewals · 90 days and the "Renewals on the clock" rail have NO renewal-date
  substrate today, so they render honest empty states rather than sample numbers.
- Value captured YTD reads only from real `realizedValueUsd`; since that is 0
  for every persisted row today, the card resolves to an honest em-dash empty,
  never `$0`.
- The aVa proactive nudge is driven only from real renewal data; with none
  available the card is omitted entirely rather than fabricated.

## Layer Impact

- `global-control-lane` (app/control-plane, feature-gated): the `/source/portfolio`
  route now branches on the `source_analytics` flag to render either the new
  book component or the existing table. The branch is inert for all tenants
  where the flag is OFF, so shared behavior is unchanged unless the tenant is
  enrolled. No data-plane, schema, or migration changes.

## Client Applicability

State exactly who receives the change.

- All clients: No change (flag OFF → existing portfolio table renders unchanged).
- Specific clients: Lakeshore (the only `source_analytics`-enrolled tenant) sees
  the redesigned "Your sourcing book" home.
- Internal only: N/A.
- Public/demo only: N/A.
- Feature flag: `source_analytics` (policy `tenant`, `includeTenants: ["lakeshore"]`;
  env allowlist `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`).

## Changes Included

- `src/app/(maestro)/source/portfolio/page.tsx` — gate on `source_analytics`;
  render `SourcePortfolioBookPage` when ON, existing `SourcePortfolioPage` when OFF.
- `src/components/source/SourcePortfolioBookPage.tsx` (new) — the redesigned
  home: header, 4 stat cards, two-column body (events-in-flight cards with an
  11-dot stage rail + right rail with renewals/aVa nudge). Styled with the
  analytics-canvas tokens.
- `src/lib/source/portfolio-book-view.ts` (new) — pure, deterministic
  view-model builder that maps real events to the redesign and encodes the
  honesty contract (empty states where no substrate backing exists).
- `src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx`
  (new) — 4 render tests covering header + 4 stat cards + flight card with stage
  rail from a fixture, and honest empty states from an empty fixture.

No migrations, no data-plane changes, no schema changes.

## QA / Validation

- Unit/render tests: `npx jest SourcePortfolioBookPage.honesty.test.tsx` — 4/4 pass.
  Covers real-derivation rendering (active count, $12.0M spend, projected band
  with `v2 pending` caveat, `Stage 4 of 11` rail) and honest empty states
  (renewals `—`, value-captured `—` not `$0`, omitted aVa nudge, no fabricated
  `$` figure on an empty portfolio).
- Lint: `npx eslint` on the 4 changed/added files — clean (exit 0).
- Types: `npx tsc --noEmit` — none of the changed/added files report errors
  (repo has ~339 pre-existing unrelated tsc errors; this change introduces none).

## Rollout Plan

Merge to main (squash). No runtime rollout required to change behavior: the code
is inert for all tenants because `source_analytics` is OFF except Lakeshore, and
Lakeshore is already the enrolled analytics pilot. The redesign becomes visible
on the next Azure Container Apps deploy of main via the repo-owned deploy
workflow. No migration to apply. Flip additional tenants only via the flag's
`includeTenants` list or the `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS` env
allowlist.

## Deployment Authority

- Repo-owned deploy workflow: Only the repo-owned ACA main deploy workflow may
  ship this; no traffic-shifting from this PR.
- Shared runtime mutators: None. No worker, job, DNS, env, or traffic changes.
- Approved image digest: N/A — no runtime image invariant changed by this PR.
- ACA runtime invariant: Unchanged; digest-pinned ACA web image policy is untouched.
- Worker image invariant: Unchanged.
- Feature/env flag update path: `source_analytics` via
  `src/lib/features/registry.ts` `includeTenants` or
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: Yes — verify `/source/portfolio` for Lakeshore
  (flag ON) renders the book, and for a non-enrolled tenant (flag OFF) renders
  the unchanged table, after the main ACA deploy.

## Rollback Plan

Revert the squash-merge commit. The change is additive and flag-gated, so
reverting fully restores the current portfolio table. No migration rollback is
needed (no schema/data changes). As an interim mitigation, removing `lakeshore`
from the `source_analytics` `includeTenants` list immediately reverts every
tenant to the existing table without a code revert.

## Audit Evidence

- PR URL: (added on open).
- CI: `npm run release:check`, eslint, and the honesty Jest suite runs.
- Test output: `SourcePortfolioBookPage.honesty.test.tsx` 4/4 pass.
- Live signed-in proof: pending post-deploy `/source/portfolio` check for
  Lakeshore (flag ON) and a non-enrolled tenant (flag OFF).

## Known Gaps

- Renewal clock (Renewals · 90 days card, "Renewals on the clock" rail) and the
  aVa proactive renewal nudge have no substrate backing today (no renewal-date
  column on `source_events`). They render honest empty states and will populate
  only when a renewal/contract-baseline substrate is wired. Substrate gap logged.
- Value captured YTD reads real `realizedValueUsd`, which is 0 for all persisted
  rows today, so the card is empty until realized value is recorded.
- Contract term / N-yr and Full-event-vs-Door-1 have no first-class substrate
  field; term is omitted and the kind badge is classified honestly from the
  event archetype/name (optimization/renewal signal → Door 1, else Full event).
- Live signed-in proof pending the next main ACA deploy.
