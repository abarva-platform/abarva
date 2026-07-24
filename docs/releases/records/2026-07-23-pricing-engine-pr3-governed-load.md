# 2026-07-23 — Nexus Pricing Engine PR3: Governed Load — Client Rate Cards, Pricing Profiles, Coverage, Governed Projection

## Release ID

`2026-07-23-pricing-engine-pr3-governed-load`

## Status

`draft`

## Plain-English Summary

This PR gives tenants a governed way to upload their own committed rate
cards and pricing assumptions into the Nexus Pricing Engine, instead of
relying only on the shared 326-role/908-rate-band global taxonomy PR1/PR2
loaded (see `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 for the
direction decision this build follows).

It adds four downloadable client CSV templates
(`datasets/templates/pricing-engine-v1/`) and a brand-new, independent
governed-load pipeline under `src/lib/pricing/governed-load/` — structurally
modeled on `src/lib/context-ingestion/`'s parse → validate → preview →
approve → commit shape, but as its own pipeline, per
`rate-card-templates.ts`'s own header comment that rate cards are
deliberately not enterprise-context facts. **This PR does NOT import
`template-registry.ts`, `buildValidatedAgentContextBundle`,
`expert-kernel/rate-card/`, or `workforce-economics/` anywhere** — confirmed
by grep (see Audit Evidence).

Concretely, this PR adds:

- CSV parsing with row-level error collection (a bad row never blocks the
  rest of the file from being checked).
- Semantic validation against the live taxonomy (does `role_or_band_ref`
  resolve to a real role or rate band? does `level` resolve to a real
  seniority level? are there duplicate rows by PR2's rate-card-line
  idempotency key within the same upload?).
- A diff-preview step (added/changed/unchanged/removed) that must run
  before any commit — the import API route never writes to the database,
  only the approve route does.
- An approve/commit path that calls PR2's own `createRateCardVersion` /
  a new, parallel `createClientProfileVersion` (built this PR, since PR2
  never wrote a client-profile write path) — reusing PR2's idempotency
  contract unchanged (same content hash ⇒ no-op; changed content ⇒ new
  version + supersede the prior current row).
- A coverage report: for a tenant, how many of the 326 canonical roles are
  priced directly by the tenant's own rate card, how many fall back to the
  global rate-band default, and how many are genuinely unresolvable —
  proven against the REAL PR1/PR2 committed CSV data, not a synthetic
  approximation (see QA / Validation for the actual numbers observed).
- A governed projection function returning ONLY safe summary fields
  (rate-card identity/effective period, coverage %, unresolved-gap count,
  approved profile version, model/taxonomy/rate-card version numbers) —
  explicitly never the full rate lines. This is NOT wired into any agent
  context path in this PR (no consumer exists yet — see Known Gaps).
- Three admin API routes for client rate cards (list, import/preview,
  approve/commit) under `src/app/api/admin/pricing/rate-cards/`, following
  this repo's existing `requireTenancy()` + `tenancyErrorResponse()` +
  `canonicalTenantKey()` convention (copied from
  `src/app/api/admin/context-layer/loader/commit/route.ts`, the closest
  existing structural analog to a governed parse→validate→preview→approve
  pipeline). Mirrored routes for client pricing profiles were added for
  symmetry, beyond the brief's explicit route list, since the pipeline
  fully supports both objects.
- Lighter, optional pipelines for client role aliases and client
  technology-cost defaults (both tables already exist from PR2) — library
  functions only, no dedicated API route in this PR.

**No live ACA proof is included or claimed.** Per this repo's governance,
local work proves parsing/validation/commit logic and passing tests; live
load/retrieval proof against a real Azure Postgres instance requires the
ACA governance path, which is out of scope for local execution in this
environment (no live database credentials are available here). See Known
Gaps.

## Layer Impact

- `internal-admin` (lane): the three new/mirrored admin API route families
  under `src/app/api/admin/pricing/` are Clerk-gated (via `requireTenancy()`)
  admin-only surfaces. There is no client-facing product surface yet — the
  Moves Cost & Effort wizard UI that will actually let a client-side user
  interact with this is PR5 scope.
- `client-data-lane` (lane): the new/extended tables this PR writes to
  (`pricing_rate_cards`, `pricing_rate_card_lines`, `pricing_client_profiles`,
  `pricing_client_profile_values`, `pricing_role_aliases`,
  `pricing_technology_cost_defaults` — all created by PR2's migrations, not
  new tables here) are tenant-scoped client data. No migration is added or
  changed by this PR.

## Client Applicability

- All clients: no behavior change for any live product surface — nothing in
  this PR is reachable from any UI yet.
- Specific clients: none.
- Internal only: yes — new admin API routes and library pipeline, no
  client-facing route.
- Public/demo only: no.
- Feature flag: none introduced (nothing is live to flag).

## Changes Included

- `datasets/templates/pricing-engine-v1/` (new) — `client_rate_card.template.csv`,
  `client_pricing_profile.template.csv`, `client_role_aliases.template.csv`,
  `client_technology_costs.template.csv`, and a `README.md` documenting every
  column, a worked example row per template, and the "you do not need to
  populate all 326 roles" fallback behavior — following this repo's existing
  downloadable-template-pack convention (`datasets/templates/
  enterprise-it-landscape-v1/`, `tower-outcome-evidence-v1/`).
- `src/lib/pricing/rate-card-repository.ts` (extended, PR2 file) —
  `CreateRateCardVersionInput`/`RateCardStorePort.insertNewVersion` gained
  optional `approvedBy`/`approvalRationale` fields, threaded through to the
  already-existing `approved_by`/`approved_at`/`approval_rationale` columns
  on `pricing_rate_cards` (PR2 created the columns but never populated
  them). Purely additive — the hash/version-decision idempotency logic is
  untouched, and PR2's own `rate-card-repository.test.ts` (92-test PR2 suite)
  still passes unmodified.
- `src/lib/pricing/governed-load/` (new) —
  - `types.ts`, `constants.ts`, `identity-keys.ts` — shared shapes and the
    rate-card-line / client-profile-assumption identity-key helpers,
    mirroring PR2's private/inline key logic so this pipeline's
    duplicate-detection and diffing match the database's real unique
    indexes exactly.
  - `csv-parse.ts` — pure schema-level parsing (papaparse) for all four
    templates, collecting every row's errors independently.
  - `semantic-validation.ts` — pure functions checking role/level/rate-band
    resolution and within-upload duplicates, given an injected reference
    snapshot (no I/O — fully unit-testable with hand-built fixtures).
  - `reference-lookup.ts` — the one DB-read seam bridging PR2's
    `reference-repository.ts` into the snapshot shape validation/coverage
    need; also adds `getCurrentModelVersion` (PR2 created
    `pricing_model_versions` but no reader existed yet).
  - `rate-card-diff.ts` — pure added/changed/unchanged/removed diff, keyed
    by PR2's rate-card-line identity.
  - `rate-card-import.ts` — orchestrates parse → validate → diff
    (`previewClientRateCardImport`, never writes) and approve/commit
    (`commitClientRateCardImport`, calls PR2's `createRateCardVersion`
    unmodified).
  - `coverage-report.ts` — `computeCoverageFromSnapshot` (pure) +
    `buildRateCardCoverageReport` (DB-backed): classifies every canonical
    role as direct/inherited/missing.
  - `governed-projection.ts` — `buildGovernedPricingProjection`: safe
    summary only, documented as not-yet-wired to any agent context path.
  - `client-profile-repository.ts` (new repository — PR2 never built one)
    — `createClientProfileVersion` on the same hash/compare/bump contract
    as PR2's rate-card/reference-pack idempotency.
  - `client-profile-import.ts`, `role-alias-import.ts`,
    `technology-cost-import.ts` — the analogous preview/commit pipelines
    for the three other client upload templates.
  - `index.ts` — barrel export.
  - `__tests__/` — 45 tests (see QA / Validation).
- `src/app/api/admin/pricing/rate-cards/route.ts` (new, GET),
  `rate-cards/import/route.ts` (new, POST preview-only),
  `rate-cards/[id]/approve/route.ts` (new, POST commit) — the three brief
  §10 endpoints this PR's scope covers. `/clone` and any
  `/moves/:moveId/pricing/...` estimate endpoints are explicitly deferred
  (PR4/PR5 scope).
- `src/app/api/admin/pricing/client-profiles/route.ts`,
  `client-profiles/import/route.ts`, `client-profiles/[id]/approve/route.ts`
  (new) — mirrored routes for client pricing profiles, added for symmetry
  since the underlying pipeline is complete; not in the brief's explicit
  route list.
- Route-level tests under each route's `__tests__/` directory, following
  this repo's existing convention (mock `@/lib/auth/tenancy`, drive the
  route with a real `NextRequest`) — see
  `src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts` for
  the precedent this PR's route tests copy.

## QA / Validation

- `npx jest src/lib/pricing/governed-load` — **45/45 passed** (10 suites):
  csv-parse, semantic-validation, rate-card-diff, coverage-report,
  governed-projection, client-profile-repository, client-profile-import,
  role-alias-import, technology-cost-import, and the mandatory end-to-end
  scenario (`rate-card-import.e2e.test.ts`).
- `npx jest src/app/api/admin/pricing` — **8/8 passed** (3 suites: rate-cards
  list, rate-cards import, rate-cards approve).
- `npx jest src/lib/pricing` (PR2 + PR3 combined) — **145/145 passed**, 18
  suites — confirms the PR2 idempotency/tenant-isolation/inheritance tests
  are unaffected by this PR's additive changes to `rate-card-repository.ts`.
- **End-to-end scenario result (the mandatory brief scenario), actual
  numbers observed**: parsed a 5-row CSV (3 valid roles, 1 unresolvable role
  ref `ROL-999`, 1 duplicate of row 1) → exactly 2 validation errors at rows
  4 (`unresolved_role_or_band_ref`) and 5 (`duplicate_row`), 3 valid rows →
  fixed to 5 valid unique rows → preview showed 5 added, 0 changed, 0
  unchanged → approved → `{action: "new_version", version: 1,
  previousVersion: null}` → re-uploaded identical content → preview showed
  5 unchanged, 0 added/changed → commit → `{action: "noop", version: 1}`
  (no new row) → changed one rate (400 → 475) → preview showed exactly 1
  changed (before 400 / after 475), 4 unchanged → approved →
  `{action: "new_version", version: 2, previousVersion: 1}` → confirmed
  exactly one `is_current` row afterward and it is version 2; version 1's
  tracked `isCurrent` flag is `false`.
- **Coverage report — real numbers against PR1/PR2's actual committed CSVs**
  (326 roles, 908 rate bands, confirmed via `datasets/reference/
  pricing-engine-v1/manifest.json`): with no client rate card at all,
  **0 direct / 326 inherited / 0 missing** (every one of the 326 real roles
  resolves via its own `default_rate_band_code` today — verified, not
  assumed). With a client upload covering 10 of the 326 roles: **10 direct /
  316 inherited / 0 missing**. A synthetic "one role with no rate band"
  fixture separately confirms the `missing` bucket is surfaced (not hidden)
  when a genuine gap exists.
- `npx eslint src/lib/pricing/ src/app/api/admin/pricing/` — **0 errors, 0
  warnings**.
- Scoped TypeScript check: a temporary tsconfig including
  `src/lib/pricing/**/*.ts`, `src/app/api/admin/pricing/**/*.ts`, and
  `scripts/pricing/**/*.ts` passed with **zero errors** (full-repo `tsc
  --noEmit` is a known pre-existing environment issue on this machine, per
  project memory `feedback_typecheck_workflow_artifact` — not attempted).
- `node scripts/release-check.mjs --base origin/main --head HEAD` —
  **passed** (see Audit Evidence).
- **A real bug was found and fixed during this PR's own test-writing**: the
  technology-cost-default write path computed its whole-set content hash
  from camelCase in-memory field names at write time but would have
  recomputed it from snake_case DB column names at read time — two
  different hash inputs for identical data, which would have silently
  broken the no-op idempotency check the first time this code ran against a
  real database (never caught by a fake store that stored the wrong-shape
  hash uncritically). Fixed via one shared `toHashRow` normalization helper
  used on both the write and read side; a test
  (`technology-cost-import.test.ts`) now asserts a changed value correctly
  produces version 2, proving the write/read shapes agree.
- No live database was touched by any test — every idempotency/tenant/diff/
  coverage test runs against an injected in-memory fake store or a mocked
  `@/lib/data-plane/azureRead` / repository function, except the coverage
  tests, which read the real, checked-in PR1 CSV files directly off disk
  (no database).

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR1 + PR2). No deploy, no
flag flip, no Azure Container Apps involvement, no migration change in this
PR — all six tables this pipeline reads/writes already exist from PR2's two
migrations. The admin API routes become reachable in whatever environment
next deploys this code, but there is no UI wired to call them yet (that is
PR5), so there is no realistic operator-facing change in behavior until a
future PR adds the Moves Cost & Effort wizard.

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker
jobs, traffic, or DNS. No migration is added or changed.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: no — no client-facing surface exists yet
  to prove live; the admin API routes are new but unreachable from any live
  UI in this PR.

## Rollback Plan

Revert the PR. No live migration to roll back (none added). No live data
was written by this PR (no migration ran, no operator has used these routes
against a real tenant yet). If a future PR has already used these routes
against a live Azure Postgres instance before this PR is reverted, the
affected `pricing_rate_cards`/`pricing_client_profiles` rows this pipeline
created would remain (append-only, per PR2's convention) — reverting this
PR removes the routes/pipeline code, not any already-written rows; a
separate, explicit data cleanup would be a distinct operator action if ever
needed.

## Audit Evidence

- `npx jest src/lib/pricing/governed-load` — 45/45 passed (captured this
  session).
- `npx jest src/app/api/admin/pricing` — 8/8 passed (captured this session).
- `npx jest src/lib/pricing` — 145/145 passed, 18 suites (captured this
  session; confirms no PR2 regression).
- `npx eslint src/lib/pricing/ src/app/api/admin/pricing/` — 0 errors, 0
  warnings (captured this session).
- Scoped `tsc` run against a temporary config covering this PR's files —
  zero errors (captured this session; temp config not committed).
- `grep` confirmation that no file under `src/lib/pricing/` or
  `src/app/api/admin/pricing/` contains an actual `import`/`require` of
  `template-registry`, `buildValidatedAgentContextBundle`,
  `expert-kernel/rate-card`, or `workforce-economics` — only explanatory
  comments reference those names, to document why they are NOT used.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed
  (captured this session).
- PR URL: recorded after PR is opened.

## Known Gaps

- **No live ACA/Azure Postgres proof.** Every test in this PR runs against
  an injected in-memory fake store, a mocked `azureRead`/repository
  function, or the real PR1 CSV files read directly off disk — never a
  live database connection (none is available in this environment). This
  proves parsing, validation, diffing, the idempotency contract, and the
  coverage/projection logic are correct in isolation; it does NOT prove
  that a real `INSERT` against Azure Postgres round-trips through the RLS
  policy, the partial unique indexes, or the transactional session writer
  as designed. That live proof is a required follow-up once this is
  deployed and an operator runs a real upload against a live tenant,
  per this repo's governance on migration/load proof needing the ACA path.
- **The approve endpoint has no persisted preview-session id to reference.**
  `POST /rate-cards/:id/approve` and `POST /client-profiles/:id/approve`
  expect the caller to resubmit the exact `linesToCommit`/`valuesToCommit`
  array the `import` endpoint returned in its preview, rather than
  referencing an ephemeral server-side session by id. This is a deliberate
  PR3 scope decision (building a preview-session table is new
  infrastructure beyond "governed load"), not an oversight — PR2's
  idempotency contract (same content hash ⇒ no-op) is the backstop against
  a stale or tampered resubmission producing a spurious new version. A
  future PR could add a persisted session id if operators need to approve
  asynchronously from a different browser session than the one that ran
  the preview.
- **Role-alias and technology-cost pipelines have no dedicated API route**
  in this PR — only library functions
  (`role-alias-import.ts`/`technology-cost-import.ts`), per the brief's
  explicit route list naming only rate-card endpoints. Wiring these into
  routes is straightforward (they follow the identical pattern as the
  rate-card/profile routes) but was left out to keep this PR's reachable
  surface matching the brief exactly.
- **The governed projection has no consumer yet.** `buildGovernedPricingProjection`
  is built and tested but not called from any agent context path, API
  route, or UI — it exists so a future PR (PR6, per brief §9.7) has a ready,
  safe shape to bind a Move's business-case context to, without that future
  PR needing to design the safe-summary boundary from scratch.
- **PR4's effort/cost calculation engine, PR5's Moves wizard UI, and PR6's
  approval/snapshot business-case gate are explicitly not built here**, per
  the execution prompt's scope boundary.
- Pre-existing, unrelated to this PR: `reports/data-standard/legacy-purge/
  blocked-loader-paths.json` and `summary.json` show a modified
  `generatedAt` timestamp in this worktree from before this PR's work began
  (not touched by this PR; not committed as part of it).
