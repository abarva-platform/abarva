# 2026-07-07-tower-cxo-surface-and-legacy-purge — Tower CXO dashboard goes live, legacy board retired

## Release ID

`2026-07-07-tower-cxo-surface-and-legacy-purge`

## Status

`candidate`

## Plain-English Summary

`/tower` used to render `AiControlTowerPage`, backed by the `ai_control_tower`
Postgres schema. That substrate has zero live writers — it was empty for
Lakeshore and every other tenant checked this session. Meanwhile a fully-built,
fully-tested CXO dashboard (`TowerIndexPage`, backed by the real `cio_tower`
schema — 8 real entities and 140 real facts for Lakeshore) existed in the
codebase but was never wired to any live route.

This release:

1. **Wires `/tower` to the real dashboard.** `TowerIndexPage` now renders at
   `/tower`, fed by `loadCioTowerCxoView` and `listTowerBudgetRollupsForClient`
   — both deterministic reads over `cio_tower.facts`/`entities`/`measure_results`,
   the same substrate the `programLabel()`/`dimension_registry` fixes from PR
   #4516 target. That fix is now actually visible in a browser for the first
   time.
2. **Adds the first Recharts visualizations to Tower.** Three chart components
   (`ValueProvenBarChart`, `BudgetRunChangeChart`, `BenchmarkComparisonChart`)
   render alongside the existing governed tables in the Value, Budget, and
   Benchmark sections. Every value charted is read directly off the
   already-computed view-model rows — no new queries, no fabricated series,
   explicit empty states when a section's real substrate is thin.
3. **Deletes the legacy `AiControlTowerPage` surface entirely** — component,
   read-model, ingest pipeline, and the now-dangling test coverage for all of
   it. A dedicated dependency-mapping investigation (Explore agent) confirmed
   zero live consumers of any deleted file before removal; one file
   (`ai-control-tower/contracts.ts`) was kept because it has a real external
   type consumer.

## Layer Impact

Release lane: `global-control-lane` (shared product surface — Tower is not
tenant-gated; this changes what every tenant's `/tower` route serves).

- **Route layer**: `/tower` now renders different content for every tenant
  that visits it. This is the single most externally-visible change in this
  release.
- **Component layer**: `AiControlTowerPage.tsx`, `TowerLensTabs.tsx`, and the
  `ai-control-tower` read-model/ingest cluster are deleted, not deprecated.
- **Visualization layer**: first production use of Recharts in Tower
  (Intelligence's Quality lens landed the first use in the app, PR #4528,
  same session).

## Client Applicability

- All clients: yes — every tenant's `/tower` route now serves `TowerIndexPage`
  instead of `AiControlTowerPage`.
- Specific clients: Lakeshore is the only tenant with confirmed real
  `cio_tower` data this session; other tenants will see the same honest empty
  states `TowerIndexPage` already renders when `cxoView`/`budgetRollups` come
  back empty — no fabricated data for tenants without loaded facts.
- Internal only: no
- Public/demo only: no
- Feature flag: none — this is an unconditional route change, not a flagged
  rollout. (Considered flag-gating to match Intelligence's Quality-lens
  precedent, but `/tower`'s prior content was already broken/empty for every
  tenant, so there's no working behavior to protect behind a flag.)

## Changes Included

25 files. Additions: `src/components/tower/charts/TowerCxoCharts.tsx` +
smoke test. Rewrite: `src/app/(maestro)/tower/page.tsx`. Deletions:
`src/components/tower/AiControlTowerPage.tsx`,
`src/components/tower/TowerLensTabs.tsx`,
`src/lib/ai-control-tower/{read-model,atlas-context-pack,load-plan,persistence}.ts`

- their tests, `src/lib/tower/control-tower-lens-projection.ts` + test,
  `src/lib/tower/ingest/ai-control-tower/`. Edits:
  `src/components/tower/TowerIndexPage.tsx` (chart wiring +
  `budgetRollups` prop threading), `src/lib/tower/ingest/registry.ts`
  (removed dangling `aiControlTowerSource` entry), 5 test files trimmed/rewritten
  to drop coverage of the deleted component while preserving coverage of
  still-live sibling logic (`tower-lens-tabs-view.ts`,
  `programme-gate-status-view.ts`, `AtlasRail.tsx` timeout contract).

## QA / Validation

- `npx eslint <every touched file>` — 0 errors (pre-existing unrelated
  warnings only, same set as before this change).
- Real `npm run build` (genuine `npm install`, not symlinked) —
  `✓ Compiled successfully`, no typecheck failure.
- `npx jest` across all Tower-adjacent test directories: 1323/1332 passing,
  9 pre-existing failures.
- **Regression check**: ran the identical test command against untouched
  `origin/main` in a separate worktree for a true baseline — **16** failures
  there (across 92 suites, 1365 tests) vs **9** here (across 91 suites, 1332
  tests — fewer total tests because dead test blocks were removed, not
  because coverage was cut). Every failing test on this branch was
  individually checked against its actual file dependencies; none touch a
  file this release modified or deleted. Net improvement, zero regressions.
- Dependency-mapping investigation (dedicated Explore agent, ~57 tool calls)
  confirmed zero live consumers of every deleted file before deletion; full
  findings preserved in session transcript.
- Chart components smoke-tested directly
  (`TowerCxoCharts.smoke.test.tsx`): all three render without crashing given
  real-shaped mock data, and correctly return `null` (no empty chart shell)
  for empty input.

## Rollout Plan

Standard ACA rollout on merge: GitHub Actions "ACA main deploy" builds from
the merge SHA, deploys to `ca-abarva-web-lab-eastus`, shifts 100% traffic on
health check. No migration, no feature flag, no data reload required — this
is a pure code change reading already-loaded `cio_tower` data.

**Required after deploy**: live signed-in browser verification of
`https://app.abarva.ai/tower` for Lakeshore — confirm program names render
clean (the PR #4516 acceptance test, finally testable now that the surface
serving that fix is live), confirm the new charts render with real data, and
narrate the CIO acceptance story this session built the design brief for.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*` (existing,
  unmodified)
- Shared runtime mutators: none added
- Approved image digest: assigned at deploy time via `az acr build` from
  merge SHA
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, unchanged
- Worker image invariant: n/a
- Feature/env flag update path: n/a — no flag
- Live signed-in proof required: **yes, explicitly required before this can
  be called done** — see Rollout Plan above.

## Rollback Plan

Revert the merge commit; redeploy the previous image via the same ACA
rollout path. No migration to unwind. If `TowerIndexPage` turns out to have
a live-only issue not caught by tests, the fastest safe rollback is reverting
this commit specifically (it's a single, self-contained change) rather than
a broader rollback.

## Audit Evidence

- PR URL: (to be filled in when opened)
- Baseline comparison: side-by-side jest run against `origin/main` in a
  disposable worktree, captured in session transcript.
- Dependency-mapping agent findings: full structured report in session
  transcript, covering every deleted file's call sites and consumers.

## Known Gaps

- **SkyHarbor/Meridian tenant applicability is unconfirmed empirically.**
  `loadCioTowerCxoView`/`listTowerBudgetRollupsForClient` are generic,
  parameterized by `tenantKey` with no Lakeshore-specific logic — if those
  tenants have real `cio_tower.facts`/`entities`/`measure_results` rows
  loaded, the new charts will render real data for them with zero further
  code changes. A VNet DB probe attempting to confirm which tenants actually
  have `cio_tower` data loaded failed 3 times on Log Analytics ingestion
  lag/job command-override issues; not chased further this round. Someone
  should re-run this check before claiming the new dashboard works for any
  tenant beyond Lakeshore.
- The CIO-narrative acceptance test (narrating the Tower story live to a
  Lakeshore CIO persona) is still pending — it requires the live deploy to
  be verified healthy first.
- Widening Tower's projection scope beyond budget/value facts (vendor
  concentration, AI initiatives, apps/systems depth) remains a separate,
  explicitly-deferred piece of work requiring its own Azure data-write
  approval (tracked from earlier in this session, unrelated to this release).
