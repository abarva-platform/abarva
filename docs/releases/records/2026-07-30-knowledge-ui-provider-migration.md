# Knowledge UI Provider Migration — PR B

## Release ID

`2026-07-30-knowledge-ui-provider-migration`

## Status

`candidate`

## Plain-English Summary

PR A (`2026-07-30-knowledge-provider-reconciliation`) built `KnowledgeUiViewModelAssembler`, a real
data-composition layer sitting on top of the already-merged `KnowledgeConsumptionProvider`, but left
every UI component under `src/components/knowledge/**` (non-vnext, PR #5772's ~52-component Airline
Knowledge UI build) still wired to a duplicate, self-invented `GovernedKnowledgeProvider` that
withheld all data unconditionally. This release does the actual plumbing swap: every one of those
components now reads through the real `KnowledgeUiViewModelAssembler` / `ConsumptionRuntime`
instead, using the same visual/interaction design the original build shipped. The duplicate
provider (`src/lib/knowledge/providers/`) is deleted entirely once every consumer moved off it.

This release also reconciles the nine airline-specific business-problem lens ids/labels
(`understand, irops, crew, baggage, loyalty, revenue, mro, airport, ai`) against the real approved
HTML prototype, which PR A could not access and had partially placeholder'd (`network_scheduling`,
`safety_compliance` were never real lens names).

The route (`/home/knowledge`) is bound to the **fixture** `ConsumptionRuntime`
(`fixture-airline-demo-new`), not any production tenant data path. This is a deliberate scope
boundary: PR B's job is proving the assembler/provider plumbing swap works end-to-end against the
real `KnowledgeConsumptionProvider` interface shape — the fixture provider is a complete, real
implementation of that same interface, so this fully validates the migration without touching
production tenant data access for `airline-demo-new`. Binding this route to the real HTTP
consumption path (the same server-enforced admin-canary channel other Knowledge routes already use)
is explicitly out of scope for this release; it is a separate, later activation step.

## Layer Impact

- **Lane:** `global-control-lane` (shared UI component library + one internal, non-nav-linked
  design-review route; no tenant-scoped schema/data changes).
- **Layer:** Application/UI layer only. Every file under `src/components/knowledge/**` (non-vnext)
  was rewired; `src/app/(maestro)/home/knowledge/page.tsx` doc comments updated (route scope
  unchanged: still hardcoded, still not linked from nav, still no new auth gate). Small reconciliation
  fix inside `src/lib/knowledge/view-model/` (lens ids/labels only — no readiness-derivation logic
  changed). `src/lib/knowledge/providers/` (the duplicate provider) deleted.
- **No data-plane changes.** No migrations, no Postgres/Azure calls, no Cube changes, no tenant
  registry changes, no auth/middleware changes. `airline-demo-new` remains unactivated as a
  production tenant — the route reads only from the synthetic `fixture-airline-demo-new` namespace.

## Client Applicability

- **All clients:** No.
- **Specific clients:** None — `airline-demo-new` is not a registered `CANONICAL_TENANT_KEY`; this
  route is not linked from any nav and has no auth gate distinguishing it from any other signed-in
  session (unchanged from before this release).
- **Internal only:** Yes, in effect — reachable only by a signed-in session that knows the direct
  URL, same as before this release.
- **Public/demo only:** N/A.
- **Feature flag:** None needed — no behavior change for any registered tenant.

## Changes Included

- `src/components/knowledge/**` (non-vnext, ~52 files) — every component rewired from
  `GovernedKnowledgeProvider`/`useKnowledgeApp().provider` onto `KnowledgeUiViewModelAssembler`/
  `useKnowledgeApp().assembler` + the real `ConsumptionRuntime`. Notable structural changes forced by
  real contract shapes (documented inline in each file): `AbarvaViewsPanel` now renders one
  interpretation, not an array (real contract is singular); `Benchmarks`/`Patterns` panels lost the
  cohort-median/rating fields the duplicate invented (no real equivalent); `GoalsPanel`,
  `PurposePanel`, `ContradictionsList`, `TrajectoryChart`, `DecisionReadinessQuadrant` render static,
  honest `PROJECTION_UNAVAILABLE` banners (no real projection exists, or — for the readiness
  quadrant's "value at stake" — it is explicitly Tower's domain per AGENTS.md, not Knowledge's).
  `state/GatedSection.tsx`, `state/StateBanner.tsx`, `state/gate-utils.ts` rebuilt around the real
  11-value `ComponentReadinessState` enum, each state carrying its own honest copy (sourced from the
  envelope's own `unavailableReason`, never a re-derived string).
- `src/components/knowledge/knowledge-app-context.tsx` — holds `runtime`/`assembler`/`tenantKey` in
  place of `provider`/`providerCtx`; all UI-chrome state (mode, lens, dock, explore/relationships
  selections, drawer, handoff) unchanged.
- `src/components/knowledge/KnowledgeAppMount.tsx` — constructs `createFixtureRuntime("fixture-airline-demo-new", "normal")` in place of `createUnreconciledGovernedKnowledgeProvider()`.
- `src/app/(maestro)/home/knowledge/page.tsx` — doc comments updated to describe the real binding;
  route scope/gating unchanged.
- `src/lib/knowledge/view-model/types.ts`, `lenses.ts`, `__tests__/lenses.test.ts` — the nine airline
  lens ids/labels reconciled against the real approved prototype (`understand, irops, crew, baggage,
  loyalty, revenue, mro, airport, ai`), replacing PR A's two placeholder ids
  (`network_scheduling`, `safety_compliance`, never real lens names).
- `src/lib/knowledge/providers/**` — deleted (5 source files + 1 test file): `types.ts`,
  `governed-knowledge-provider.ts`, `design-harness-provider.ts`, `read-models.ts`,
  `__tests__/design-harness-provider.test.ts`.
- `src/components/knowledge/__tests__/*.test.tsx`, `gate-utils.test.ts` — all 5 test files rewritten
  against the real fixture `ConsumptionRuntime` and the 11-value readiness enum, replacing assertions
  built against the deleted duplicate's stub provider.
- `tests/e2e/knowledge-airline-demo-new-smoke.spec.ts` — assertions updated for the new mixed reality
  (some sections render real fixture content now; some still render honest empty states) instead of
  the old "everything is withheld" assumption.
- This release record.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p tsconfig.json` — passes clean, exit
  code 0, full tree.
- `npx eslint src/components/knowledge src/lib/knowledge/view-model` — zero errors, zero warnings.
- `npx jest src/components/knowledge src/lib/knowledge/view-model src/lib/knowledge/consumption-contracts src/lib/knowledge/consumption-client`
  — 12 test suites, 128 tests, all passing (0 failing).
- `npm run build` (production, `next build`) — succeeds; `/home/knowledge` compiles as a dynamic
  route alongside the rest of the app tree.
- `tests/e2e/knowledge-airline-demo-new-smoke.spec.ts` — **not run to completion in this
  environment.** This worktree has no `.env.local` / Clerk keys configured at all (not even a
  placeholder), so `next start` 500s on every route, including the public homepage, with
  `@clerk/nextjs: Missing publishableKey` — an environment-configuration gap, not a code defect
  introduced by this release (confirmed: `npm run build` itself succeeds, and the 500 happens at the
  Clerk middleware layer before any Knowledge route code runs). This mirrors the same sandbox
  limitation PR #5772 documented (its own smoke spec's header comment). The spec's assertions were
  updated to match this release's actual behavior and are ready to run in an environment with real
  Clerk credentials; that signed-in run has not been captured here. Status: **blocked, not run** —
  not claimed as passing.
- Manual review: repo-wide grep confirmed no file outside the deleted `src/lib/knowledge/providers/`
  directory imports from it (two harmless doc-comment mentions of the historical path remain, in
  `page.tsx` and `knowledge-app-context.tsx`).

## Rollout Plan

1. Merge PR to `main` (squash), stacked on PR A (`feat/knowledge-provider-reconciliation`) — merge
   that first.
2. No ACA image behavior changes for any registered tenant as a result of this release: the route is
   not linked from nav, gated by no new flag, and reads only fixture data.
3. A later, separately-authorized PR is required before `/home/knowledge` (or any route) reads real
   `airline-demo-new` tenant data — that is an explicit tenant/provider activation decision, not a
   byproduct of this UI migration.

## Deployment Authority

Not applicable — this release does not affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, or DNS. No registered tenant's runtime
behavior changes.

## Rollback Plan

- **Code revert:** Revert this PR's commit(s). Since `/home/knowledge` is not linked from nav and has
  no registered-tenant traffic, this is a low-blast-radius revert.
- No migration rollback required (no schema changes).
- No feature flag to unset.

## Audit Evidence

- PR: opened against `feat/knowledge-provider-reconciliation` (PR A), not `main` — stacked; link
  recorded in the PR itself once opened.
- `reports/airline-knowledge-provider-reconciliation-2026-07-30/` — the reconciliation record this
  migration implements (10 planning documents from PR A).
- TypeScript/ESLint/Jest/build command output as described above (re-runnable by any reviewer).

## Known Gaps

- **Signed-in browser proof not captured** — see QA/Validation. Blocked by this environment's missing
  Clerk configuration, not by this release's code. The updated e2e spec is ready to run once Clerk
  credentials are available.
- **Real (non-fixture) tenant data is explicitly out of scope** — see Plain-English Summary and
  Rollout Plan. `airline-demo-new` remains unactivated; this release only proves the plumbing swap
  against the fixture implementation of the real provider interface.
- **Several sections still render `PROJECTION_UNAVAILABLE` by design, not as a defect**: Goals,
  Purpose statements, Contradictions, 6 of 8 Explore inventory kinds (`dataProducts`, `integrations`,
  `infrastructure`, `programs`, `risks`, `measures`), metric trajectories, and the decision-readiness
  quadrant's value-at-stake — none of these have a real consumption-contract projection today (or, for
  the quadrant, belong to Tower's domain per AGENTS.md). Closing these requires contract/registry work
  (data-plane lane) or a governed Tower-to-Knowledge handoff reference, both out of this UI-migration
  PR's scope. See `reports/airline-knowledge-provider-reconciliation-2026-07-30/COMPONENT_TO_QUERY_MAPPING.md`.
- **`compare/TrajectoryChart.tsx` remains orphaned** (not mounted anywhere in the shell) — confirmed
  unchanged from before this migration by repo-wide grep; this release only removed its dependency on
  the deleted duplicate provider, it did not wire it in (no assembler equivalent for
  `getMetricTrajectory` exists to wire it to).
