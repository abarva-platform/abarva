# 2026-10-04-moves-home-v2-portfolio-landing — Moves Home: portfolio landing (flag OFF)

## Release ID

`2026-10-04-moves-home-v2-portfolio-landing`

## Status

`candidate`

## Plain-English Summary

Adds the redesigned Moves Home (portfolio) landing behind a feature flag
(`moves_home_v2`, **off for every tenant**): a human headline, a "Waiting on
you" triage (the specific decision each move is waiting on, oldest first), an
all-moves table with a six-dot phase rail per row, and the reconciled-with-
client-inventory panel. It reads the same portfolio and reconciliation the
current list uses; value and budget numbers come from the governed
`valueAtStake` / reconciliation totals — the component invents none, and the
headline uses a count-based value line rather than a derived dollar figure.

Because the flag is off everywhere, there is **no change to the live product**.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_home_v2`, off for all tenants).

- `4 PRODUCTS` (Moves): presentation only. Same read-model and reconciliation;
  only the landing presentation changes when the flag is on.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_home_v2` (tenant policy, `includeTenants: []`).

## Changes Included

- `src/components/strategic-moves/MovesHome.tsx` — the landing component
  (header, waiting triage, all-moves table + phase rail, reconciliation).
- `src/components/strategic-moves/moves-home-adapter.ts` — pure props assembly
  (headline counts, oldest-first triage).
- `src/components/strategic-moves/moves-home-mapper.ts` — `StrategicMove` → the
  adapter input (status tone, governed value formatting, waiting derivation).
- `src/app/(maestro)/strategic-moves/page.tsx` — flag-gated render.
- `src/lib/features/registry.ts` — registers `moves_home_v2`.
- `.github/workflows/ai-surface-control-catalog.yml` — runs the three new Home
  suites in CI (the strategic-moves `__tests__` dir is listed by exact path).
- Coverage census + Nexus manual refreshed.
- Tests for the component, adapter, and mapper.

## QA / Validation

- `jest` — **PASS**: 15/15 across the three Home suites (`MovesHome`,
  `moves-home-adapter`, `moves-home-mapper`).
- `eslint` — **PASS**: 0 errors on the changed files.
- `tsc --noEmit` — **PASS**: no type errors in the changed files.
- `test-ci-coverage census` — **PASS**: committed census matches after wiring
  the new suites.
- Visual signed-in walk — **NOT RUN**: no signed-in data-backed render off the
  private data plane. Owed once enabled for a tenant.

## Rollout Plan

Merge to `main` via squash PR. Flag off for all tenants → no runtime change on
merge. Ships with the next ACA web image via the repo-owned `aca-main-deploy`
workflow. Enabling for a tenant is a separate controlled change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: set by the main deploy workflow at build time
- ACA runtime invariant: unchanged by this PR; proven at deploy time
- Worker image invariant: n/a
- Feature/env flag update path: `moves_home_v2` via `includeTenants` / env
  override — a separate change, not in this PR
- Live signed-in proof required: Yes — once enabled for a tenant, a signed-in
  walk confirming the headline, waiting triage, table + phase rail, and
  reconciliation render from real data. Not claimed here.

## Rollback Plan

Revert the PR, or leave the flag off (no tenant has it). Pure UI/flag.

## Audit Evidence

- PR URL: (added on open)
- CI run: (added on open)
- Local test/lint/type/census output recorded under QA / Validation.

## Known Gaps

- Filter tabs + search on the all-moves table are static placeholders in this
  pass (interactive filtering is a follow).
- A governed dollar value in the headline (fact-lineage aggregate) is
  intentionally deferred; the headline uses a count-based value line.
- Live signed-in proof owed once enabled for a tenant.
