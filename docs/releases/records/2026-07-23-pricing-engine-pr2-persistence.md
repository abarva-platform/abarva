# 2026-07-23 — Nexus Pricing Engine PR2: Persistence, Versioning, Tenant Isolation

## Release ID

`2026-07-23-pricing-engine-pr2-persistence`

## Status

`released`

## Plain-English Summary

This PR gives the new, independent Nexus Pricing Engine (see
`docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 for the product
decision to build it fresh, alongside — not instead of — the existing
expert-kernel rate-card/effort-estimator system) its first real Postgres
persistence. It creates 19 new `pricing_*` tables across two migrations: the
reference/taxonomy schema that PR1's checked-in CSV reference pack
(`datasets/reference/pricing-engine-v1/`) loads into, plus tenant rate cards,
client pricing profiles, technology-cost defaults, and an immutable
"pricing estimate snapshot" SKELETON table (no full estimate-workflow tables
yet — those are PR4–PR6 scope).

Every versioned/mutable-by-import object (the reference taxonomy as a whole,
rate cards, client profiles) follows one reusable idempotency contract
(`src/lib/pricing/versioning.ts`): a sha256 content hash of the normalized
payload decides whether a re-import is a no-op or produces a new,
immutable version row, with the previous "current" row flipped to
superseded — never updated or deleted in place. Five real database UNIQUE
constraints (not just documentation) enforce the exact idempotency keys
named in the build brief, using a documented `COALESCE`-to-sentinel pattern
everywhere a nullable dimension (a global-scope `tenant_key`, an unset
`level`/`provider_ref`/`location_ref`) would otherwise let Postgres treat two
`NULL`s as distinct and silently allow a duplicate.

`src/lib/pricing/reference-pack-loader.ts` is the first real, tested
consumer of that contract: it reads PR1's actual committed CSVs, re-validates
them against PR1's own `validate-pricing-role-coverage` rules, and proves
(against real data, not a synthetic fixture) that loading the identical pack
twice is a no-op, that a changed pack produces a new taxonomy version, and
that calling the loader twice in a row for the same new content never
produces two "current" versions.

`src/lib/pricing/rate-card-repository.ts` models the rate-card inheritance
hierarchy (global starter -> client override -> Move-scoped exception) as one
table with a `scope_type` enum and a self-referencing `parent_rate_card_id`,
per the brief's explicit instruction (not a rigid 4-table hierarchy), and
proves the 3-tier scope-inheritance walk with a pure, unit-tested merge
function — closest scope wins per priced line, broader scopes fall back
untouched for lines the narrower scope doesn't override.

Nothing in this PR is wired into any API route, UI, or the context/corpus
governance pipeline — it is persistence + typed access + tenant isolation +
versioning + idempotency only, exactly as scoped. No migration has been run
against a live Azure Postgres instance (see Known Gaps).

## Layer Impact

- `client-data-lane`: this PR adds new client-scoped tables
  (`pricing_rate_cards`, `pricing_client_profiles`,
  `pricing_client_profile_values`, `pricing_estimate_snapshots`, and the
  tenant-scoping columns on the reference tables) to the Azure/Postgres data
  plane. No client-facing route, UI, or agent context path reads or writes
  these tables yet — the lane classification reflects the shape of the data
  (tenant-scoped, future client-visible pricing), not any live exposure.
- `internal-admin`: the reference-pack loader, migrations, and typed
  repositories are internal engineering tooling with no operator- or
  client-facing surface in this PR.

## Client Applicability

- All clients: no behavior change (nothing reads/writes these tables from
  any live route yet)
- Specific clients: none
- Internal only: yes — new tables, loader, and repositories are dormant
  until PR3+ wires a consumer
- Public/demo only: no
- Feature flag: none introduced (nothing is live to flag)

## Changes Included

- `supabase/migrations/20260723233000_pricing_reference_schema_v1.sql`
  (new) — reference/model schema: `pricing_taxonomy_versions`,
  `pricing_model_versions`, `pricing_towers`, `pricing_capabilities`,
  `pricing_role_families`, `pricing_seniority_levels`, `pricing_roles`,
  `pricing_role_aliases`, `pricing_provider_level_aliases` (unseeded),
  `pricing_rate_bands`, `pricing_provider_classes`, `pricing_providers`
  (unseeded), `pricing_delivery_locations`. RLS + permissive
  `service_role_full_access` policy on every table; the brief's exact
  `UNIQUE (taxonomy_version, role_code)` idempotency key on `pricing_roles`;
  a `COALESCE`-sentinel unique index on `pricing_role_aliases` for the
  `(tenant_key, normalized_alias, provider_scope)` key.
- `supabase/migrations/20260723234500_pricing_rate_cards_client_profiles_v1.sql`
  (new) — `pricing_rate_cards` (single-table `scope_type` inheritance model),
  `pricing_rate_card_lines`, `pricing_client_profiles`,
  `pricing_client_profile_values`, `pricing_technology_cost_defaults`, and
  the `pricing_estimate_snapshots` immutable skeleton (append-only, no FK to
  a not-yet-existing `pricing_estimates` table, `stale_for_current_scope`
  status included). All five brief §6.4 idempotency keys implemented as real
  UNIQUE indexes.
- `src/lib/pricing/types.ts` (new) — hand-written TypeScript types mirroring
  every new table (this repo has no DB-type-generation convention; the
  closest precedent, `src/lib/programs/types.db.ts`, is also hand-written).
- `src/lib/pricing/versioning.ts` (new) — the single reusable
  hash/compare/bump idempotency service: `computeContentHash`,
  `decideVersionAction`, `findDuplicateKeys`, `coalesceKeyPart`.
- `src/lib/pricing/reference-repository.ts` (new) — typed read access to the
  reference/taxonomy tables, following the direct-`azureRead`-import
  convention (`load-move-business-case-input.ts` / `repository.ts` under
  `src/lib/tower/value-states/`), not the legacy
  `read-adapters/*ReadAdapter.ts` + `postgresCompat.ts` family the PR0 audit
  flags.
- `src/lib/pricing/reference-pack-loader.ts` (new) — parses PR1's CSVs,
  re-validates via PR1's own `validate-pricing-role-coverage`, diffs by
  content hash, and idempotently loads a new taxonomy version. Storage is
  behind an injectable `ReferencePackStorePort` so the full idempotency
  contract is unit-testable without a live database; the default
  implementation uses `azureRead` for reads and a `createTxSession`
  transactional writer for inserts. Not wired into any route/CLI-only
  script/admin UI (PR3 scope).
- `src/lib/pricing/rate-card-repository.ts` (new) — typed reads
  (`getCurrentRateCard`, `listRateCardVersions`, `listRateCardLines`), an
  idempotent `createRateCardVersion` write path (same injectable-port
  pattern as the loader), and the pure `resolveRateCardInheritance` 3-tier
  scope walk.
- `src/lib/pricing/__tests__/versioning.test.ts` (new) — content-hash
  stability/sensitivity, version-decision logic, and one test per brief
  §6.4 idempotency key (role, role alias, rate card, rate line, client
  profile assumption) proving the duplicate-detection logic matches the
  database index's exact comparison semantics.
- `src/lib/pricing/__tests__/reference-repository.test.ts` (new) — query
  shape assertions via a mocked `azureRead`, plus a tenant-isolation proof:
  a simulated two-tenant alias table where `listRoleAliasesForTenant` never
  returns another tenant's row.
- `src/lib/pricing/__tests__/rate-card-repository.test.ts` (new) — the
  3-tier inheritance walk (global -> client -> move_exception, plus a
  location-dimension distinction test), a tenant-isolation proof for
  `getCurrentRateCard`, and the full `createRateCardVersion` idempotency
  contract (first-write, no-op replay, changed-content version bump,
  no-duplicate-current on a double call).
- `src/lib/pricing/__tests__/reference-pack-loader.test.ts` (new) — row
  counts read from PR1's real committed CSVs match `manifest.json`'s
  `row_counts` exactly; the real pack passes
  `validate-pricing-role-coverage`; content-hash stability; and the full
  loader idempotency contract against the real pack plus a mutated-copy
  fixture (proves a changed pack produces a new version with updated row
  counts).
- `src/lib/pricing/__tests__/migrations.test.ts` (new) — reads the two new
  migration files directly off disk and asserts: every new table exists with
  `CREATE TABLE IF NOT EXISTS`; every new table has RLS enabled plus the
  permissive policy; all five idempotency-key unique indexes exist with the
  exact expected column lists; the rate-card `scope_type`/
  `parent_rate_card_id` inheritance shape; the snapshot table's append-only
  shape (no `UPDATE` statement, no FK to `pricing_estimates`,
  `stale_for_current_scope` in the status enum); no PR4-scope or PR6-scope
  table was created; and the repo's own migration-idempotency-audit
  conventions (`IF NOT EXISTS` on every `CREATE TABLE`/`CREATE INDEX`, a
  `DROP POLICY IF EXISTS` for every `CREATE POLICY`).

## QA / Validation

- `npx jest src/lib/pricing/__tests__` — **92/92 passed** (5 suites):
  `versioning.test.ts`, `reference-repository.test.ts`,
  `rate-card-repository.test.ts`, `reference-pack-loader.test.ts`,
  `migrations.test.ts`.
- `node scripts/audit-migrations.mjs` — the two new migration files do not
  appear in the flagged-issues report (274 files audited, 64 flagged; both
  new files clean).
- `npx eslint src/lib/pricing/` — **0 errors, 0 warnings.**
- Scoped TypeScript check: a temporary tsconfig including
  `src/lib/pricing/**/*.ts` + `scripts/pricing/**/*.ts` passed with **zero
  errors** (a full-repo `tsc --noEmit` crashes on this machine — a known,
  pre-existing environment issue predating this PR; see project memory
  `feedback_typecheck_workflow_artifact`).
- `node scripts/release-check.mjs --base origin/main --head HEAD` —
  **passed** (see Audit Evidence).
- No live database was touched: every idempotency/tenant-isolation/
  inheritance test runs against an injected in-memory fake (the
  `ReferencePackStorePort` / `RateCardStorePort` seams, or a mocked
  `azureRead`) — see Known Gaps for what remains to be proven live.

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR1). No deploy, no flag
flip, no Azure Container Apps involvement in this PR. The two new migrations
are added to `supabase/migrations/` but are NOT applied here — per this
repo's governed migration path (`docs/ops/aca-data-build-job-rule.md` /
`npm run db:migrate*`), applying them against the shared Azure Postgres
instance is a separate, explicit operator action outside this PR's scope,
run when a PR3+ consumer is ready to read from these tables.

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker
jobs, traffic, or DNS. Two SQL migration files are added to the repo but not
executed by this PR.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No live migration to roll back — the two new migration files
have not been applied to any live Azure Postgres instance (see Known Gaps),
so reverting the PR removes the migration files, the `src/lib/pricing/`
persistence modules, and their tests with no other side effects. If a future
PR has already run `db:migrate` against a shared instance before this PR is
reverted, roll back by dropping the 19 new `pricing_*` tables in the reverse
dependency order they were created (`pricing_estimate_snapshots` and
`pricing_rate_card_lines`/`pricing_client_profile_values` first, since they
FK into `pricing_rate_cards`/`pricing_client_profiles`/
`pricing_taxonomy_versions`/`pricing_model_versions`, then the parent
tables) — no other table in the repo references any `pricing_*` table, so
this is a self-contained drop.

## Audit Evidence

- `npx jest src/lib/pricing/__tests__` output — 92/92 passed — captured in
  this PR's CI run.
- `node scripts/audit-migrations.mjs` output — captured in this PR's CI run.
- `npx eslint src/lib/pricing/` output — 0 errors, 0 warnings — captured in
  this PR's CI run.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — captured
  in this PR's CI run.
- PR URL: recorded after PR is opened.

## Known Gaps

- **No migration has been run against any live Azure Postgres instance.**
  Per this repo's governance ("Local work can prove parsing, calculation, UI
  behavior, and tests. Live migration, load, row-count, retrieval, and
  citation proof must run through the established ACA governance path"),
  this PR proves the migrations are well-formed and pass local drift/audit
  checks — not that they have been applied, or that a real INSERT against
  Postgres round-trips through the RLS policy, the generated
  `normalized_alias` column, or the partial unique indexes as designed. That
  live proof is a separate, explicit operator action (see Rollout Plan).
- **The idempotency/tenant-isolation/inheritance tests all run against
  injected in-memory fakes or a mocked `azureRead`**, not a live Postgres
  connection — this is a deliberate, documented choice (no live Azure
  Postgres credentials are available in this environment), not an oversight.
  The database-level enforcement (the actual `UNIQUE`/partial-index/RLS
  behavior) is asserted structurally by `migrations.test.ts` reading the
  real migration SQL, and will be proven live only when the migrations run
  against Azure Postgres per the governance path above.
- **`pricing_provider_level_aliases`, `pricing_providers`, and
  `pricing_model_versions` are created but intentionally unseeded** — no
  onboarded tenant provider/alias exists yet, and the future effort/cost
  engine (PR4) has not registered a model version. Both are complete,
  ready-to-use table shapes per the brief's model, not deferred schema.
- **Not yet a governed context/corpus object** — per AGENTS.md's Context &
  Corpus Governance policy, no `docs/governance/dataset-manifests/` entry
  was added, because none of this PR's tables are read by any agent yet (no
  UI/API/context-broker wiring exists until PR3+). PR3 must add a dataset
  manifest before any agent-facing wiring of pricing data.
- **No PR4-scope table was created**: `pricing_archetypes`,
  `pricing_activity_packs`, `pricing_effort_drivers`, `pricing_effort_rules`,
  `pricing_activity_role_mix`, `pricing_archetype_activity_map`,
  `pricing_range_policies`, `pricing_agent_costs` — confirmed absent from
  both new migrations (asserted by `migrations.test.ts`).
- **No PR4–PR6-scope estimate-workflow table was created**:
  `pricing_estimates`, `pricing_estimate_scenarios`,
  `pricing_estimate_inputs`, `pricing_estimate_line_items`,
  `pricing_estimate_approvals` — only the `pricing_estimate_snapshots`
  SKELETON exists, with no FK to any of these (confirmed absent, asserted by
  `migrations.test.ts`).
- **No import from or modification of `expert-kernel/rate-card/` or
  `workforce-economics/`** — the new `pricing_*` schema and
  `src/lib/pricing/` module tree are fully independent, per the explicit
  product decision in `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md`
  §14. Confirmed by inspection: no file under `src/lib/pricing/` imports
  from either path.
- **The full 6-tier rate-card fallback resolver (role/level/provider/
  location matching precedence for an inexact query) is not built** — only
  the 3-tier SCOPE walk (global -> client -> move_exception for an exact
  line key) is implemented and tested, per the brief's explicit PR2/PR4/PR5
  scope split.
- **`createRateCardVersion` and `loadReferencePack`'s default storage
  implementations (the real `azureRead` + `createTxSession` path) are
  exercised by TypeScript/lint only, not by an integration test against a
  live database** — every test in this PR exercises the injected fake port
  instead, per the "no live Azure Postgres credentials available" gap
  above. Once PR3+ or a live migration run gives this environment real
  credentials, an integration test against the actual tables would
  strengthen this further.
