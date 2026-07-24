# 2026-07-23 — Nexus Pricing Engine PR7: Cross-Module Hardening + Build Closure

## Release ID

`2026-07-23-pricing-engine-pr7-hardening`

## Status

`draft`

## Plain-English Summary

This is the seventh and final PR in the Nexus Pricing Engine build (PR0-PR7).
Every prior PR (PR1-PR6) proved its OWN module against an injected in-memory
fake; this PR ties those modules together and proves the FULL pipeline works
across module boundaries — a real client rate-card CSV import (PR3) feeding
PR4's real deterministic effort/cost engine (via PR5's real `runEstimate`),
producing a PR6 immutable, approved snapshot — for all 8 launch archetypes,
plus the specific historical-stability, cross-tenant-isolation, and
missing-rate-coverage guarantees the build brief calls out by name. It also
closes one genuine, previously-undetected gap this hardening pass found (see
"Real Bug Found and Fixed" below), and runs a full duplicate-current-row
audit across every versioned `pricing_*` table.

**No live ACA/Azure Postgres action was taken or attempted in this PR**,
consistent with every PR in this sequence and with this repo's own
governance (AGENTS.md; brief §2.10: "Local work can prove parsing,
calculation, UI behavior, and tests. Live migration, load, row-count,
retrieval, and citation proof must run through the established ACA
governance path."). See "What Remains Out of Scope" below for the explicit,
later, separately-authorized actions this build always deferred.

## Real Bug Found and Fixed

**Brief §12's "missing all fallbacks blocks the estimate" was NOT actually
enforced before this PR.** PR4's engine already refuses to fabricate a zero
cost for a role with no resolvable rate (`resolveRoleRate`'s `missing`
branch leaves `hourlyRateCents: null`, and `cost-engine.ts#aggregateTotals`
tracks that as `gapCount` rather than summing a phantom `$0` into the
total) — that half of the brief's requirement was already correct. But
**nothing stopped an estimate whose totals carried `gapCount > 0` from being
approved into a permanent, immutable `pricing_estimate_snapshots` row.**
`runEstimate`'s "validation gate" (`validateEstimateForRun`) checks only
header completeness and scope-driver-input settlement — it never inspected
the ENGINE's own resolved-rate gaps; a non-zero `gapCount` surfaced only as
a `topUncertaintyDrivers` disclosure string, never a block. This meant a
Move with a genuinely unpriced role could be approved and locked in with an
honest-but-incomplete total, silently.

**Fix** (`src/lib/pricing/effort-engine/snapshot-service.ts`): a new
`UnresolvedRateGapError`, thrown by `createEstimateSnapshot` whenever
`candidate.totals.gapCount > 0`, checked immediately after the existing
`approval_rationale_required` guard and before the segregation-of-duties
check — before anything is written. `/run` and the draft workflow are
UNCHANGED (a user must still be able to see and work through a gap while
drafting); only **approval** — the one point a cost figure becomes a
financial commitment — now refuses outright. The
`POST .../pricing/estimates/:estimateId/approve` route
(`src/app/api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve/route.ts`)
now catches this error and returns `409 { error: "unresolved_rate_gap",
gapCount }`, the same status-code family as the existing `estimate_not_ready`
/ `self_approval_violation` outcomes.

This is additive and safe to ship: `moves_pricing_engine` remains OFF for
every tenant (empty `includeTenants`, unchanged from PR5), so no live
approval flow is affected today; the fix only changes behavior for the first
tenant ever enrolled, and it changes it toward MORE correctness, not less.

## Layer Impact

- `internal-admin` / `client-data-lane`: the bulk of this PR is new,
  additive test coverage under `src/lib/pricing/__tests__/`,
  `src/lib/pricing/effort-engine/__tests__/`,
  `src/lib/pricing/moves-workflow/__tests__/`, and a new shared test harness
  (`src/lib/pricing/__fixtures__/pr7-e2e-harness.ts`) — no runtime behavior
  change from these files themselves.
- `client-data-lane`: the one real behavior change —
  `UnresolvedRateGapError` in `snapshot-service.ts` and the corresponding
  409 branch in the `/approve` route — affects ONLY the still-flag-gated
  (OFF) Moves Cost & Effort approval path.
- `global-control-lane`: none. No feature flag was added or changed;
  `moves_pricing_engine` remains exactly as PR5 left it.

## Client Applicability

- All clients: **no** — `moves_pricing_engine` stays OFF for every tenant
  (`includeTenants: []`, unchanged from PR5/PR6). The one behavior change
  (blocking approval on an unresolved rate gap) is reachable only through
  that still-gated workspace.
- Specific clients: none enrolled.
- Internal only: yes — the test/harness additions are internal engineering
  artifacts.
- Public/demo only: no.
- Feature flag: unchanged (`moves_pricing_engine`, default OFF).

## Changes Included

- `src/lib/pricing/effort-engine/snapshot-service.ts` (edited) —
  `UnresolvedRateGapError` class + the new gate inside `createEstimateSnapshot`
  (see "Real Bug Found and Fixed").
- `src/app/api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve/route.ts`
  (edited) — imports and catches `UnresolvedRateGapError`, returns
  `409 unresolved_rate_gap`.
- `src/lib/pricing/effort-engine/__tests__/snapshot-service.test.ts` (edited)
  — 3 new cases: rejects approval with a gap (nothing written), the error
  carries the exact `gapCount`, and `gapCount: 0` still approves cleanly.
- `src/app/api/v1/programs/[programId]/pricing/__tests__/approve-route.test.ts`
  (edited) — 1 new case: the route's `409 unresolved_rate_gap` outcome.
- `src/lib/pricing/__fixtures__/pr7-e2e-harness.ts` (new) — the shared
  cross-module test harness every new PR7 end-to-end test builds on. Fakes
  ONLY the direct DB-read boundary (`reference-repository.ts` /
  `rate-card-repository.ts` reads, `effort-engine/model-registry.ts#readEffortEnginePack`,
  and `moves-workflow/estimate-repository.ts` as a whole module) — every
  OTHER function (PR3's real governed-load pipeline, PR4's real
  `runEffortEngine`, PR5's real `runEstimate`, PR6's real
  `createEstimateSnapshot`/`getApprovedSnapshotForMove`) runs unmocked. See
  that file's header for the full design rationale.
- `src/lib/pricing/__tests__/pr7-end-to-end-pipeline.test.ts` (new, 10
  tests) — the flagship cross-module proof: for EACH of the 8 launch
  archetypes named in brief §12 (mapped to PR4's real `ARCH-01`..`ARCH-08`
  codes — see QA/Validation for the confirmed mapping), a full
  import→estimate→validate→run→approve→snapshot pipeline against real
  reference data; plus the "old approved snapshot survives rate-card
  supersession" test and the "cross-tenant isolation, end-to-end" test.
- `src/lib/pricing/effort-engine/__tests__/pr7-missing-rate-fallback.test.ts`
  (new, 2 tests) — a synthetically-constructed zero-rate-coverage role
  (all 326 real roles have coverage, per PR3's own finding, so this is
  hand-built as the brief instructs) proving (a) the engine leaves that
  line's cost `null`, never a fabricated `0`, and (b) `createEstimateSnapshot`
  now rejects a real engine run's totals that carry this gap.
- `src/lib/pricing/effort-engine/__tests__/pr7-role-mix-cross-reference.test.ts`
  (new, 3 tests) — every `pricing_activity_role_mix.csv` `role_code`
  resolves to a real, non-retired `pricing_roles.csv` role — a genuine gap
  no prior PR's test suite covered (PR4's generator script only checks this
  at generation time, not against the committed CSVs on every test run).
- `src/lib/pricing/__tests__/pr7-role-coverage-validator-meta.test.ts` (new,
  1 test) — runs `validate:pricing-role-coverage` as a real subprocess
  (`npx tsx scripts/pricing/validate-pricing-role-coverage.ts`) and asserts
  a clean exit, rather than re-deriving PR1's own validator logic.
- `src/lib/pricing/__tests__/pr7-duplicate-current-row-audit.test.ts` (new,
  8 tests) — every versioned table (rate cards, client profiles,
  technology-cost defaults, the reference taxonomy) audited for
  exactly-one-`is_current`-row under both a sequential identical-content
  replay AND a rapid interleaved-write race (two concurrent writers whose
  reads both happen before either write — modeling the real partial unique
  index's role as backstop, per the codebase's own documented judgment).
- `src/lib/pricing/effort-engine/__tests__/pr7-cross-scenario-determinism.test.ts`
  (new, 2 tests) — extends PR4's per-archetype determinism proof: (a) the
  same scenario run twice with the scope-driver/rate inputs round-tripped
  through JSON serialization between runs, and (b) the same scenario run via
  a `jest.resetModules()`-forced fresh, independently-imported module
  instance — the closest a single Jest process can get to "two separate
  process boundaries."
- `src/lib/pricing/moves-workflow/__tests__/pr7-suggestion-confirmation-gate-contract.test.ts`
  (new, 1 test) — proves the actual CONFIRMATION GATE (not just the
  suggestion resolver) blocks a genuinely-resolved suggestion (a real
  client-profile match) until the user explicitly confirms it — testing the
  contract PR5's honest finding says has no real Move-fact source to
  exercise yet, per this PR7 prompt's explicit instruction to test the gate
  logic itself rather than fabricate Move data.
- `src/lib/pricing/__tests__/pr7-governance-reassertion.test.ts` (new, 2
  tests) — re-asserts, against REAL data flowing through the real pipeline
  (not PR3/PR6's own all-mocked fixtures), that `buildGovernedPricingProjection`
  and `buildBusinessCasePricingSummary` never surface raw rate-card lines or
  the granular labor/manual/hours breakdown, plus an explicit end-to-end
  check that `approved_by` / `approval_rationale` / `content_hash` /
  `version` are genuinely populated (not merely present, unused, schema
  columns) on a real rate-card commit and a real snapshot approval.

## QA / Validation

- **Final total test count across the whole pricing build** (this session,
  current tree state):
  - `npx jest src/lib/pricing` — **382/382 passed**, 42 suites (350 PR1-6
    baseline + 32 new/added PR7 assertions: 29 from 8 new PR7 files + 3 new
    cases added to `snapshot-service.test.ts`).
  - `npx jest` on the 4 `src/app/api/v1/programs/[programId]/pricing/__tests__/*`
    route-test files — **24/24 passed** (18 PR5/PR6 baseline + 1 new
    `unresolved_rate_gap` case in `approve-route.test.ts`, plus the other 3
    route files' existing counts).
  - `npx jest` on `src/app/api/admin/pricing/**` — **8/8 passed** (unchanged
    from PR3, re-confirmed clean).
  - `npx jest src/components/strategic-moves/cost-effort` — **6/6 passed**
    (unchanged from PR5, re-confirmed clean).
  - `npx jest` on `MovesPhaseStandaloneClient.test.tsx` — **52/52 passed**
    (unchanged from PR5, re-confirmed clean — includes the 3 pricing-wizard
    rail-button cases among 49 pre-existing nav cases).
  - `npx jest` on `phase-workspace/__tests__/phase-workspace-contract.test.ts`
    — **3/3 passed** (re-confirmed the Cost & Effort wizard still lives
    OUTSIDE `phase-workspace/`, per PR5's Design Decision).
  - **Grand total: 382 + 24 + 8 + 6 + 52 = 472 passing tests** across the
    entire pricing build's test tree (the `phase-workspace-contract` 3 are a
    general architecture-contract check, not pricing-specific, so kept out
    of that headline total, matching PR5's own reporting convention).
- **8-archetype end-to-end pipeline result**: all 8 launch archetypes named
  in brief §12 map cleanly to PR4's real archetype codes — confirmed, not
  assumed: `ARCH-01` AI/automation use case → "AI document/workflow
  automation"; `ARCH-02` Data and analytics product → "Data
  product/lakehouse"; `ARCH-03` Application implementation/modernization →
  "Application modernization"; `ARCH-04` Cloud/platform/integration
  initiative → "Cloud/integration platform"; `ARCH-05` Process and
  operating-model transformation → same name; `ARCH-06` Managed-services/
  sourcing transition → "Managed-services transition"; `ARCH-07` ERP
  implementation/upgrade → same name; `ARCH-08` Legacy/mainframe
  modernization → "Mainframe modernization." All 8 ran the full
  import→estimate→validate→run→approve→snapshot pipeline with a REAL,
  freshly-committed client rate card covering every role that archetype's
  activity packs reference, producing `gapCount: 0`, a valid
  `low <= expected <= high` range, a non-empty, provenance-carrying
  (`formula_trace`) line-item set, and a real approved snapshot whose
  `getApprovedSnapshotForMove` lookup resolves `{status: "approved"}`
  immediately afterward.
- **"Old approved snapshot survives rate-card supersession" result**: this
  test PASSED. Approved a snapshot against rate-card version 1, then
  superseded the client rate card with materially different rates (version
  2, a genuinely new `card_version_id`), then re-fetched the ORIGINAL
  snapshot and deep-equaled its stored `totals` against a pre-change capture
  — byte-identical. A fresh re-run of the SAME estimate after the rate
  change produced a DIFFERENT `totalLaborCostCents` (proving the isolation
  is real, not merely untested), while the original snapshot's totals
  remained untouched even after that re-run. No bug found here — PR2's
  append-only/`is_current`-flip discipline and PR6's append-only snapshot
  discipline compose correctly.
- **"Missing all fallbacks blocks the estimate" result**: this test found
  and closed a REAL gap — see "Real Bug Found and Fixed" above. The
  engine-level half ("refuses to fabricate zero") was already correct; the
  estimate-level half ("blocks the estimate") was NOT enforced before this
  PR and now is, at the approval boundary specifically.
- **Duplicate-current-row audit result**: all 4 versioned table types
  (rate cards, client profiles, technology-cost defaults, the reference
  taxonomy) pass both the sequential-identical-content no-op case and the
  rapid-interleaved-write race case — exactly one `is_current` row survives
  in every scenario, for every table.
- **Cross-tenant isolation, end-to-end**: tenant A approves a snapshot for
  move id `"shared-move-id"`; tenant B's `getApprovedSnapshotForMove` call
  for the LITERAL SAME move id string returns `{status: "none"}`, never
  tenant A's data; tenant A's own lookup is unaffected. `getCurrentRateCard`
  for tenant B against tenant A's card code returns `null`.
- **Taxonomy cross-reference**: every `pricing_activity_role_mix.csv`
  `role_code` (126 rows) resolves to a real, non-retired
  `pricing_roles.csv` role — confirmed against the real committed CSVs, not
  the generator script's in-memory literals.
- **Governance re-assertion**: `buildGovernedPricingProjection` and
  `buildBusinessCasePricingSummary`, run against REAL pipeline output (not
  hand-shaped fixtures), both contain zero raw-line-shaped keys; `approved_by`
  / `approval_rationale` / `content_hash` / `version` are all genuinely
  populated (non-null, non-empty) on both a real rate-card commit and a real
  snapshot approval.
- `npx eslint src/lib/pricing/ src/app/api/v1/programs/[programId]/pricing/ src/app/api/admin/pricing/`
  — **0 errors, 0 warnings** (two issues found and fixed during this pass:
  an unused variable and a `require()`-style import flagged by
  `@typescript-eslint/no-require-imports`, replaced with a dynamic
  `import()` inside the cross-module-instance determinism test).
- Full-project `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`
  (matching PR5/PR6's own precedent for getting a full-repo check to run
  without OOMing) — **zero NEW errors**. The only 4 errors present are the
  SAME pre-existing, unrelated ones PR5/PR6 already documented
  (`Cannot redeclare block-scoped variable` in
  `src/app/api/v1/programs/[programId]/__tests__/route.test.ts`), confirmed
  via `git diff --quiet` that this PR does not touch that file.
- `git diff --quiet origin/main -- src/lib/programs/expert-kernel/ src/lib/workforce-economics/`
  — exit 0, confirmed **across the ENTIRE PR0-PR7 stack against origin/main**
  (not just this PR's own diff) — both directories remain byte-identical to
  `main`, per the PR0 "coexist, don't replace" direction decision.
- `git diff --quiet -- src/app/api/v1/moves/board-grade-business-case/route.ts`
  — exit 0, re-confirmed this PR did not touch the live business-case
  generator route either.
- `node scripts/release-check.mjs --base origin/main --head HEAD` —
  **passed** (Azure deployment lane check, legacy-tenant-input audit,
  Release Control Gate, Deploy Authority Gate, Pilot Data Loader Gate all
  green).
- No live database, ACA, or Azure command of any kind was run in this PR —
  see "What Remains Out of Scope" below.

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR1-PR6). No deploy, no ACA
involvement, no migration change in this PR (no schema change at all).
`moves_pricing_engine` stays OFF for every tenant at merge time — unchanged.
The one behavior change (`UnresolvedRateGapError` blocking approval on an
unresolved rate gap) is additive and only affects the still-gated Cost &
Effort approval path; no currently-enrolled tenant exists to be affected
(none is enrolled).

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, environment variables, worker jobs, traffic, or
DNS. No migration is added or changed.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: unchanged from PR5 (`moves_pricing_engine`)
  — this PR adds no new flag and enrolls no tenant.
- Live signed-in proof required: no — flag is OFF for every tenant at merge
  time, so there is nothing live to prove yet.

## Rollback Plan

Revert the PR. No migration to roll back (none added or changed). No live
data was written by this PR in this environment (no live database
credentials available here, matching every prior PR in this sequence). The
`UnresolvedRateGapError` behavior change is contained to
`snapshot-service.ts` and the one `/approve` route — reverting removes it
cleanly with no other side effects, since no tenant has ever used the
approval path in a live environment.

## Audit Evidence

- `npx jest src/lib/pricing` — 382/382 passed, 42 suites (captured this
  session).
- `npx jest` on the 4 pricing route-test files under
  `src/app/api/v1/programs/[programId]/pricing/__tests__/` — 24/24 passed
  (captured this session).
- `npx jest` on `src/app/api/admin/pricing/**` — 8/8 passed (captured this
  session).
- `npx jest src/components/strategic-moves/cost-effort` — 6/6 passed
  (captured this session).
- `npx jest` on `MovesPhaseStandaloneClient.test.tsx` — 52/52 passed
  (captured this session).
- `npx jest` on `phase-workspace-contract.test.ts` — 3/3 passed (captured
  this session).
- `npx eslint src/lib/pricing/ src/app/api/v1/programs/[programId]/pricing/ src/app/api/admin/pricing/`
  — 0 errors, 0 warnings (captured this session).
- Full-project `tsc --noEmit` (8GB heap) — 4 pre-existing errors, 0 new
  (captured this session; cross-checked via `git diff --quiet` that the
  affected file is untouched by this PR).
- `git diff --quiet origin/main -- src/lib/programs/expert-kernel/ src/lib/workforce-economics/`
  — exit 0, whole-build confirmation (captured this session).
- `git diff --quiet -- src/app/api/v1/moves/board-grade-business-case/route.ts`
  — exit 0 (captured this session).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (captured this session).
- This record references all seven prior release records in this build:
  `docs/releases/records/2026-07-23-pricing-engine-pr0-audit.md`,
  `2026-07-23-pricing-engine-pr1-taxonomy.md`,
  `2026-07-23-pricing-engine-pr2-persistence.md`,
  `2026-07-23-pricing-engine-pr3-governed-load.md`,
  `2026-07-23-pricing-engine-pr4-effort-engine.md`,
  `2026-07-23-pricing-engine-pr5-moves-workflow.md`,
  `2026-07-23-pricing-engine-pr6-approval-snapshot.md`.
- PR URL: recorded after PR is opened.

## What Remains Out of Scope (separate, later, explicitly-authorized actions)

These are correctly OUT of scope for this — or any — code PR in this
sequence, per this repo's own governance (AGENTS.md's ACA/ACR/deploy-
authority rules; brief §2.10's "local work proves parsing/calculation/UI/
tests, not live migration/load/retrieval/citation proof"). None of the
following is a gap this build failed to close — each is a deliberate
boundary this whole 8-PR sequence has consistently and correctly respected:

1. **Live ACA migration deploy of the 4 new `pricing_*` migrations** to a
   real Azure Postgres instance. All four migrations
   (`20260723233000_pricing_reference_schema_v1.sql`,
   `20260723234500_pricing_rate_cards_client_profiles_v1.sql`,
   `20260723235500_pricing_effort_engine_v1.sql`,
   `20260724010000_pricing_estimates_moves_workflow_v1.sql`, plus the PR6
   companion `20260724020000_pricing_estimate_snapshots_pr6_estimate_link.sql`)
   remain unapplied to any live environment in this build — this requires
   the repo's governed migration path (`npm run db:migrate*` /
   `docs/ops/aca-data-build-job-rule.md`), run by an authorized operator
   against the real Azure Postgres instance, which no PR in this sequence
   has had credentials for.
2. **Live retrieval/citation proof** — that a real `INSERT` against Azure
   Postgres round-trips through the RLS policies, partial unique indexes,
   and transactional session writer exactly as every unit/integration test
   in this build assumes. Every test in this entire 8-PR sequence runs
   against an injected in-memory fake, a mocked `azureRead`/repository
   function, or the real committed CSVs read directly off disk — never a
   live database connection.
3. **Actually flipping `moves_pricing_engine` on for any real tenant.** The
   flag remains OFF for every tenant, `includeTenants: []`, exactly as PR5
   introduced it. Enrolling a first pilot tenant is a separate, later
   product decision that must produce its own live-signed-in proof before
   claiming the workspace `live-proven`, per AGENTS.md's runtime invariant
   rule.
4. **Whether/how `board-grade-business-case/route.ts` should eventually
   consume an approved `pricing_estimate_snapshots` row** — PR6's
   deliberate, explicitly-reasoned non-decision (see that PR's release
   record and `snapshot-service.ts`'s own file header). `getApprovedSnapshotForMove`
   and `buildBusinessCasePricingSummary` are built, tested (again, in this
   PR, against real pipeline output), and ready — but wiring either of them
   into the live, currently-shipping business-case generator is a real
   product decision that changes behavior for every existing Move today,
   and needs its own explicit sign-off and its own PR, not a side effect of
   this hardening pass. Confirmed once more (see QA/Validation) that
   `board-grade-business-case/route.ts` and all of `expert-kernel/` remain
   byte-identical to `origin/main` across the entire PR0-PR7 build.

## Known Gaps

- **No live ACA/Azure Postgres proof** — see "What Remains Out of Scope"
  above; this is the same, consistently-documented limitation every PR in
  this sequence has stated, not new to this PR.
- **The rate-card `/approve` admin route re-validates only row SHAPE, not
  semantic taxonomy resolution, on resubmission** — a PR3-documented,
  deliberate scope decision (that route's own header comment: "this route
  re-validates nothing about WHICH lines are being approved beyond what
  `createRateCardVersion` itself does... PR2's idempotency contract is the
  backstop"). This PR7 hardening pass confirmed there is only ONE call site
  for `commitClientRateCardImport`/`createRateCardVersion` outside test
  code (that same admin route) — so there is no "admin vs UI" validation-
  path DRIFT to find, because no second write path exists yet. Noted here
  for completeness, not treated as a new PR7 gap.
- **The four range-policy judgment tiers** (scope maturity, evidence
  quality, delivery novelty, quantity uncertainty) remain caller/user
  judgment calls, unchanged from PR4/PR5 — this PR did not attempt to derive
  them from live signals, which was never this PR's scope.
- **Move-context suggestions remain honest gaps against the real Move
  schema** — unchanged from PR5's own finding, re-confirmed by this PR7's
  confirmation-gate contract test (which deliberately exercises the ONE real
  suggestion source that does resolve today — a client pricing-profile
  match — rather than fabricating Move data that doesn't exist).
- Pre-existing, unrelated to this PR: `reports/data-standard/legacy-purge/blocked-loader-paths.json`
  and `summary.json` show the same modified `generatedAt`-style timestamp
  noise in this worktree that every prior PR in this sequence has noted at
  session start; not touched by this PR; not staged as part of it.
