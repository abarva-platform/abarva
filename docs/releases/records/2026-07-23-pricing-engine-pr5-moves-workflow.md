# 2026-07-23 — Nexus Pricing Engine PR5: Moves Cost & Effort Workflow

## Release ID

`2026-07-23-pricing-engine-pr5-moves-workflow`

## Status

`draft`

## Plain-English Summary

This PR gives PR4's deterministic effort/cost engine its first real
consumer: a persisted, per-Move draft workflow ("estimate") and a five-step
"Cost & Effort" wizard inside the P4 phase workspace. A user can now start a
costing exercise for a Move, pick an archetype, answer the archetype's real
scope/quantity/people-change questions (derived from PR4's own
archetype→activity-pack→driver mapping, never a hardcoded list), review
every assumption in one table, and — once every required input is confirmed
or explicitly marked unknown with an accepted range-policy widening — run
the estimate. Running it calls PR4's real `runEffortEngine`, persists the
resulting line items (replacing any prior run's lines, never accumulating
duplicates), and renders a results view: low/expected/high ROM, effort
totals, cost by activity pack/role, internal-vs-external, one-time-vs-
recurring, change/training/adoption/governance breakdown,
technology/third-party cost, rate-card coverage, and the formula/provenance
trail already carried by each persisted line.

This PR does **not** build the approval workflow, immutable snapshot
creation, or business-case generation gate — that is PR6, and
`snapshot-service.ts` remains the untouched PR6 stub. There is no live ACA
proof in this environment (no live Azure Postgres credentials here, matching
every prior PR in this sequence).

## Layer Impact

- `client-data-lane`: the core of this PR. New Move/tenant-scoped
  `pricing_estimates` / `pricing_estimate_inputs` / `pricing_estimate_line_items`
  tables, a new Move-scoped API surface
  (`/api/v1/programs/:programId/pricing/**`), and a new tenant-gated UI
  surface (the Cost & Effort wizard) inside the P4 phase workspace. Nothing
  here is global/shared platform behavior — every read/write is scoped by
  `(tenant_key, move_id)`.
- `global-control-lane`: the feature-flag registry addition
  (`moves_pricing_engine`) and the small `MovesPhaseStandaloneClient.tsx`
  rail-button wiring are shared app-shell code, but they are inert unless a
  tenant is explicitly opted in (see Feature Flag below) — no behavior
  change for any tenant not enrolled.

## Client Applicability

- All clients: **no** — `moves_pricing_engine` defaults OFF for every
  tenant (`policy: "tenant"`, empty `includeTenants`). No client sees any
  new UI, and no client's existing Move workflow changes at all.
- Specific clients: none enrolled yet — this PR ships the capability;
  enrolling a pilot tenant is a follow-up decision once the workspace is
  ready to validate end-to-end with real data.
- Internal only: the API routes and services are reachable code, but only
  through the flag-gated UI entry point or direct API calls a normal user
  would not make.
- Public/demo only: no.
- **Feature flag: `moves_pricing_engine` (new).** Added to
  `src/lib/features/registry.ts` as a `tenant`-policy flag, default OFF,
  `includeTenants: []`. Rationale: this is a brand-new, multi-PR (PR2-PR7)
  Move-facing surface; the underlying schema/engine is real and tested but
  the wizard itself has not been live-proven with a real tenant yet — this
  matches the repo's own convention for staged Move-facing rollouts (e.g.
  `moves_workforce_economics`, `moves_decision_storytelling`). When the flag
  is off, the "Cost & Effort" rail button does not render at all in
  `MovesPhaseStandaloneClient.tsx` — no dead-code call site is exposed to a
  tenant that hasn't opted in.

## Changes Included

- `supabase/migrations/20260724010000_pricing_estimates_moves_workflow_v1.sql`
  (new) — `pricing_estimates`, `pricing_estimate_inputs`,
  `pricing_estimate_line_items`. See the migration's own header for: (a)
  the judgment call to NOT create a separate `pricing_estimate_scenarios`
  table (scenario identity lives on `pricing_estimates` itself via
  `scenario_name` + `scenario_group_id`); (b) why `pricing_estimates` /
  `pricing_estimate_inputs` are mutable drafts (no version-bump machinery
  needed, unlike PR2's append-only rate-card versions); (c) the
  replace-on-rerun contract for `pricing_estimate_line_items` (no
  `is_current`/`version` column — the current row set for an `estimate_id`
  IS the latest run, full stop); (d) the `status` CHECK constraint's
  forward-compatible inclusion of `approved`/`superseded`/
  `stale_for_current_scope` for PR6, never written by any PR5 code.
- `src/lib/pricing/types.ts` (extended) — hand-written
  `PricingEstimateRow` / `PricingEstimateInputRow` /
  `PricingEstimateLineItemRow` types mirroring the new migration, following
  this file's existing hand-written-type convention.
- `src/lib/pricing/moves-workflow/` (new directory):
  - `types.ts` — shared service-layer types (draft CRUD inputs, suggestion
    shape, config shape, execution-result shape).
  - `estimate-repository.ts` — draft CRUD (`createDraftEstimate`,
    `getEstimate`, `updateEstimateHeader`, `listEstimateInputs`,
    `upsertEstimateInputs`) and the replace-on-rerun line-item write path
    (`replaceLineItems`), built on an injectable `EstimateWorkflowStorePort`
    (same pattern as PR2's `rate-card-repository.ts`) so the full contract
    is unit-testable without a live database.
  - `move-context-suggestions.ts` — `listRequiredDriverCodesForArchetype`
    (derives the real per-archetype scope-driver list from PR4's
    archetype→activity-pack→rule mapping) and the suggestion resolvers
    (`resolveSetupSuggestions`, `resolveScopeDriverSuggestions`,
    `resolveClientProfileReferenceSuggestions`) — see Honest Finding below.
  - `validation-gate.ts` — the pure "Run estimate" gate
    (`validateEstimateForRun` = header completeness + every required
    scope-driver input settled: confirmed, or explicitly marked unknown
    with an accepted range-policy confidence tier).
  - `config-service.ts` — `buildEstimateConfig` (archetype list +
    per-archetype required-input schema, tagged with a real `stepHint` of
    `scope`/`people` derived from each driver's owning activity pack's
    real `category` column — never a hardcoded per-archetype list).
  - `execution-service.ts` — `runEstimate`: loads the PR4 pack, resolves
    rates, calls PR4's real `runEffortEngine` (wrapped in
    `assertDeterministicRecomputation`), computes the low/expected/high
    range via PR4's `range-policy.ts`, persists line items
    (replace-on-rerun), and shapes the full results object (see Honesty
    Disclosures below for the internal/external, cash/absorbed-capacity,
    one-time/recurring, and change/adoption breakdown derivations).
  - `index.ts` — barrel; does not import `expert-kernel/rate-card/`,
    `expert-kernel/effort-estimator.ts`,
    `expert-kernel/business-case-compiler.ts`, or `workforce-economics/`.
- `src/app/api/v1/programs/[programId]/pricing/` (new): `_shared.ts`
  (Move-ownership + tenant-key-canonicalization + JSON-shaping helpers),
  `config/route.ts` (GET), `estimates/route.ts` (POST create),
  `estimates/[estimateId]/route.ts` (GET), `estimates/[estimateId]/inputs/route.ts`
  (PATCH — save-after-each-step), `estimates/[estimateId]/validate/route.ts`
  (POST), `estimates/[estimateId]/run/route.ts` (POST). All follow the
  Move-scoped `requireTenancy()` + `getProgramById(ctx, programId)` (404 if
  not visible) + `{error, detail}` convention from
  `phase-capture/route.ts`, **not** the admin-only
  `api/admin/pricing/rate-cards/route.ts` pattern. `/approve` and
  `/clone-scenario` are explicitly NOT built (PR6 scope / not gated on for
  this slice).
- `src/components/strategic-moves/cost-effort/` (new) — the wizard UI:
  `CostEffortWizard.tsx`, `ResultsView.tsx`, `types.ts`, `index.ts`. **Lives
  as a sibling of `phase-workspace/`, not inside it** — see Design Decision
  below.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` (edited)
  — new `"pricing"` `WorkspaceView`, a flag-and-phase-gated "Cost & Effort"
  rail button (only renders on P4, only when `pricingEngineEnabled` is
  true), and the render branch mounting `<CostEffortWizard>`.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
  (edited) — resolves `moves_pricing_engine` via `isFeatureEnabled()` and
  passes `pricingEngineEnabled` down to the client component.
- `src/lib/features/registry.ts` (edited) — new `moves_pricing_engine`
  flag definition (see Feature Flag above).
- Tests (new, see QA/Validation for exact counts):
  `src/lib/pricing/__tests__/pr5-estimates-migration.test.ts`,
  `src/lib/pricing/moves-workflow/__tests__/{estimate-repository,
  move-context-suggestions,validation-gate,config-service,
  execution-service}.test.ts`,
  `src/app/api/v1/programs/[programId]/pricing/__tests__/{config-route,
  estimates-route,estimate-detail-routes}.test.ts`,
  `src/components/strategic-moves/cost-effort/__tests__/CostEffortWizard.test.tsx`,
  plus 3 new cases added to the existing
  `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.

## Design Decision — wizard lives OUTSIDE `phase-workspace/`

The PR0 audit recommended composing the wizard from
`phase-workspace/primitives.tsx` chrome, which this PR does (`Card`,
`Chip`, `KeyValue`, `PhaseWorkspaceStyles`) — but the STATEFUL wizard
component itself (`CostEffortWizard.tsx`) does not live inside
`phase-workspace/`. That directory has its own enforced architectural
contract (`phase-workspace/__tests__/phase-workspace-contract.test.ts`):
every file under it must be "pure props — no React state/effect/context
hooks," decoupled from any runtime. `CostEffortWizard.tsx` is a genuinely
stateful, fetch-driven client component (`useState`/`useEffect` throughout)
— it was initially placed under `phase-workspace/cost-effort/` per the
audit's literal suggestion, which broke that contract test; it was moved to
`src/components/strategic-moves/cost-effort/` (a sibling directory,
matching where other stateful Move components already live — e.g.
`PhaseApproveAndBuild.tsx`, `FileCabinetPanel.tsx`), importing the
phase-workspace primitives/styles from there. This is a case where a
brief's literal file-path suggestion conflicted with a real, enforced
in-repo architectural rule; the rule wins, and the underlying instruction
("reuse the chrome, don't build new wizard chrome from scratch") is still
honored.

## Honest Finding — real Move-context data availability for suggestions

`move-context-suggestions.ts`'s header documents this directly: `ProgramCore`
and the `StrategicMove` view-model were checked (grepped for every PR4
`pricing_effort_drivers.driver_code` name — `integration_count`,
`impacted_user_count`, `rollout_wave_count`, `stakeholder_group_count`,
`data_domain_count`, `application_count`, etc.) and **none exist as
structured fields on the real Move/engagement schema today**.
`timelineHorizon` is free text, not a structured start-date/duration. The
ONE real Move-context field this resolver honestly uses is
`valueAtStake.projected.currency` for the currency suggestion (source chip
"From Move"); every scope-driver quantity suggestion returns `value: null`
with an explicit `gapReason` unless a matching
`pricing_client_profile_values` row exists (source chip "Client profile") —
proven by `move-context-suggestions.test.ts`'s "honest Move-context gap"
test. This function was NOT wired into a dedicated API route in this PR
(no `GET .../suggestions` endpoint) — since every scope-driver suggestion is
currently an honest gap against real data, adding a whole endpoint that
always returns empty/null suggestions would be complexity without present
value; the resolver is built, tested, and ready to be exposed via a trivial
follow-up route once a real suggestion source (Move-schema fields or
populated client profiles) exists. The V1 wizard's step 2/3 render blank,
clearly-labeled "Needs your input" fields for every scope-driver question
instead.

## Honesty Disclosures — derived result breakdowns

PR4's `EffortLineItem` has no "internal vs external," "cash vs absorbed
capacity," or "one-time vs recurring" flag. `execution-service.ts`'s header
comment documents exactly how each derived breakdown is grounded in a real
signal, not fabricated:

- **Internal vs external** and **cash vs absorbed capacity** both reuse the
  real `pricing_roles.internal_external_default` taxonomy column (external
  = cash outlay, internal = absorbed capacity — a disclosed planning
  simplification, not a treasury determination). As of the PR4 seed
  taxonomy, every role is `'internal'` (confirmed via
  `awk -F, '{print $10}' pricing_roles.csv | sort -u` → only `internal`
  present) — both breakdowns will show 100% internal/absorbed against
  today's data. That is an honest reflection of the current reference
  pack, not a bug in this PR.
- **One-time vs recurring**: PR4's engine only models one-time project
  delivery effort. The one exception — `ai_accelerated` scenario
  `pricing_agent_costs` lines — is split using the ORIGINAL
  `PricingAgentCostRow.unit` string (e.g. `"USD/month"` vs a one-time unit),
  matched back by `rule_code === agent_cost_code`.
- **Change/training/adoption/governance/transition breakdown**: buckets the
  real `AP-SHARED-*` activity-pack codes by their own real names (Change &
  Stakeholder Engagement / Communications → "Change & stakeholder
  engagement"; Training → "Training"; Adoption Support → "Adoption
  support"; Architecture/Risk/Financial/Vendor governance packs →
  "Governance"; Transition & Knowledge Transfer + AMS transition packs →
  "Transition") — a labeling convention over already-computed real cost
  lines, not a new data source.
- **Technology/third-party breakdown**: the sum of every line's
  `manualCostCents` — `manual_cost_line` is the only PR4 operation
  representing non-labor cost.

## Known Scoping Calls (deferred, not silently omitted)

- **Rate-card selection**: step 1 auto-selects the tenant's current
  `ENTERPRISE` rate-card version (via `getCurrentRateCard`) rather than
  presenting a full multi-card picker. A full rate-card picker UI is
  deferred; the config route already returns `defaultRateCard` so a future
  picker is additive, not a rework.
- **Bulk role/location mix editing** (named in the brief's "Advanced mode"
  simplicity rules): explicitly NOT built in this UI pass. The wizard's
  Advanced section (step 4) only exposes the four range-policy judgment
  tiers; a note in the UI itself says bulk role/location mix editing is
  deferred.
- **`/approve` and `/clone-scenario` routes**: not built — `/approve` is
  PR6 scope (the approval/snapshot workflow); `/clone-scenario` is not
  central to this slice per the brief's own note.

## QA / Validation

- `npx jest src/lib/pricing` — **320/320 passed**, 31 suites (243 PR1-4
  baseline + 77 new PR5 tests: migration structure 33,
  estimate-repository 10, move-context-suggestions 8, validation-gate 17,
  config-service 5, execution-service 4).
- `npx jest "src/app/api/v1/programs/[programId]/pricing"` — **18/18
  passed**, 3 suites (config route, estimates POST route, estimate-detail
  routes: GET/PATCH/validate/run).
- `npx jest src/components/strategic-moves/cost-effort` — **6/6 passed**
  (config load, step gating, real per-archetype driver rendering,
  From-Move source chip, accessible-name/role check, narrow-viewport
  smoke check).
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — **52/52 passed** (49 prior + 3 new: flag-off hides the rail button,
  flag-on + P4 shows it and opens the wizard, flag-on + non-P4 still hides
  it).
- `npx jest src/components/strategic-moves/phase-workspace/__tests__/phase-workspace-contract.test.ts`
  — **3/3 passed** (re-confirmed clean after moving the wizard OUT of
  `phase-workspace/` — see Design Decision above; this test caught the
  violation when the wizard was first placed inside that directory).
- **Replace-on-rerun (literal proof)**:
  `estimate-repository.test.ts`'s "running the estimate AGAIN replaces the
  prior line items" test runs `replaceLineItems` twice against the same
  `estimate_id` with different line-item sets (first run 1 row/$8,000
  labor, second run 2 rows/$9,000+$1,000), asserts the second run's result
  set has exactly 2 rows (not 3), that the stale $8,000 value is gone, and
  that `pricing_estimates.last_run_id` reflects the SECOND run's id. A
  companion test confirms replacing with an EMPTY set still clears prior
  rows. `execution-service.test.ts` additionally proves `runEstimate` calls
  `replaceLineItems` exactly once per run with the estimate's real
  tenant/id.
- **Validation gate (literal proof)**:
  `validation-gate.test.ts` proves: blocks on a never-provided key, blocks
  on a key with no value, blocks on a key with a value but no
  confirmation/override, passes once every key is confirmed, passes when a
  key is explicitly marked unknown with an override reason + confidence
  tier (and NOT settled with only one of the two), collects one blocking
  reason PER missing key, and `validateEstimateForRun` blocks on an
  incomplete header (e.g. missing currency) even when every driver input is
  confirmed. `execution-service.test.ts` proves `runEstimate` itself throws
  `EstimateNotReadyError` (never silently proceeds) when the gate fails,
  and that `replaceLineItems` is NEVER called in that case.
- Determinism: `execution-service.ts`'s `runEstimate` wraps the
  `runEffortEngine` call in PR4's own `assertDeterministicRecomputation`
  (runs it twice, deep-compares) before persisting anything — reused
  unchanged from PR4, not reimplemented.
- `npx eslint` on every file touched by this PR — **0 errors, 0 warnings**
  (one unescaped-apostrophe JSX error and one unused-const-as-type-only
  warning were found and fixed during this pass).
- Full-project `tsc --noEmit -p tsconfig.json` (with
  `NODE_OPTIONS=--max-old-space-size=8192` — the default heap OOMs on this
  large a repo regardless of this PR, a known pre-existing environment
  issue per project memory) — **zero NEW errors**. The only 4 errors present
  are pre-existing, unrelated to this PR (`Cannot redeclare block-scoped
  variable` cross-file noise in a pre-existing test file, confirmed present
  identically on the pre-PR5 branch tip via `git stash`).
- A bare, whole-repo `npx jest` sweep (not the authoritative command per
  AGENTS.md — it picks up Playwright `*.spec.ts` files under `tests/e2e/`
  and other pre-existing hygiene-check failures unrelated to pricing) shows
  344 failing suites / 752 failing tests; **zero of them mention pricing,
  moves-workflow, or cost-effort** (confirmed by grep), and the SAME
  Clerk-ESM-transform failure class was reproduced on the pre-PR5 branch
  tip via `git stash` — i.e. none of this is caused by this PR.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (Azure deployment lane check, legacy-tenant-input audit, Release Control
  Gate, Deploy Authority Gate, Pilot Data Loader Gate all green). Run
  against the real working-tree diff (staged + unstaged + untracked files,
  which the check script itself unions), so this reflects this PR's actual
  file set even though nothing is committed yet.

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR1-PR4). No deploy, no ACA
involvement. The migration adds 3 new, empty tables — no data is written
until a real signed-in user opens the (flag-gated, currently empty-
`includeTenants`) Cost & Effort workspace. `moves_pricing_engine` stays OFF
for every tenant at merge time; enabling it for a first pilot tenant is a
separate, later decision (edit `includeTenants` in
`src/lib/features/registry.ts`, no code change, no redeploy of anything
beyond the normal ACA main-deploy pipeline).

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, environment variables, worker jobs, traffic, or
DNS. The one runtime-observable change (the feature flag definition) ships
inert (default OFF, empty allowlist) until a follow-up PR/config change
enrolls a tenant.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: `src/lib/features/registry.ts`
  `moves_pricing_engine.includeTenants` (code change, normal PR + deploy —
  no live env var required for V1; an `ABARVA_FEATURE_MOVES_PRICING_ENGINE_TENANTS`
  env allowlist is also honored automatically by
  `is-feature-enabled.ts`'s existing generic mechanism, no extra wiring
  needed).
- Live signed-in proof required: no — flag is OFF for every tenant at
  merge time, so there is nothing live to prove yet. A future PR enrolling
  a pilot tenant must produce that proof before claiming the workspace
  `live-proven`.

## Rollback Plan

Revert the PR. The three new tables would need `DROP TABLE` for a full
schema rollback (no down-migration is included, matching this repo's
forward-only convention); since the flag ships OFF and no tenant is
enrolled, no real draft/estimate data would exist in any live environment at
merge time, so dropping the tables loses nothing. No live data was written
by this PR in this environment (no live database credentials available
here, matching every prior PR in this sequence).

## Audit Evidence

- `npx jest src/lib/pricing` — 320/320 passed, 31 suites (captured this
  session).
- `npx jest "src/app/api/v1/programs/[programId]/pricing"` — 18/18 passed,
  3 suites (captured this session).
- `npx jest src/components/strategic-moves/cost-effort` — 6/6 passed
  (captured this session).
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 52/52 passed (captured this session).
- `npx jest src/components/strategic-moves/phase-workspace/__tests__/phase-workspace-contract.test.ts`
  — 3/3 passed (captured this session, after the Design Decision move).
- `npx eslint` on every PR5-touched file — 0 errors, 0 warnings (captured
  this session).
- Full-project `tsc --noEmit` (8GB heap) — 4 pre-existing errors, 0 new
  (captured this session; cross-checked against pre-PR5 branch tip via
  `git stash`).
- `grep` confirmation that no file under `src/lib/pricing/moves-workflow/`,
  the new API routes, the new UI directory, or the new migration contains
  an actual `import`/`require` of `expert-kernel/rate-card/`,
  `expert-kernel/effort-estimator.ts`,
  `expert-kernel/business-case-compiler.ts`, or `workforce-economics` —
  confirmed clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (captured this session; see QA/Validation for gate-by-gate detail).
- PR URL: recorded after PR is opened.

## Known Gaps

- **No live ACA/Azure Postgres proof.** Same limitation as PR1-PR4 — no
  live database credentials in this environment. All persistence-layer
  tests run against an injected in-memory fake `EstimateWorkflowStorePort`
  or mocked module boundaries, never a real connection.
- **Move-context suggestions are honest gaps today, not yet populated.**
  See "Honest Finding" above — the resolver function exists and is tested,
  but the real Move/engagement schema does not yet expose the scope-driver
  quantities it would need to prepopulate from. No dedicated
  `GET .../suggestions` route was built this PR (see rationale above).
- **Rate-card selection is single-card (`ENTERPRISE`), not a full picker**
  — see Known Scoping Calls above.
- **Bulk role/location mix editing is not built** — see Known Scoping
  Calls above.
- **The four range-policy judgment tiers (scope maturity, evidence
  quality, delivery novelty, quantity uncertainty) remain caller/user
  judgment calls**, not derived from live signals — this is an
  already-documented PR4 gap (its own release record's Known Gaps),
  unchanged by this PR; only rate-card coverage (the fifth dimension) is
  derived from a real computed source (PR3's coverage report).
- **No approval/snapshot workflow** — `/approve`, immutable
  `pricing_estimate_snapshots` population, and business-case integration
  are explicitly PR6 scope; `snapshot-service.ts` remains an untouched,
  throwing stub.
- Pre-existing, unrelated to this PR: the same handful of modified
  `reports/`, `.github/workflows/ai-cost-daily.yml`, and `scripts/ai-cost/*`
  files noted in PR4's own release record were still present in this
  worktree's git status at the start of this PR's work; not touched by
  this PR.
