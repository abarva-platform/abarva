-- Nexus Pricing Engine — PR5: the Moves Cost & Effort estimate-workflow
-- tables PR2 explicitly deferred and PR4 still left uncreated (brief §8.3/
-- §8.4): `pricing_estimates`, `pricing_estimate_inputs`,
-- `pricing_estimate_line_items`. Companion migration to
-- 20260723233000_pricing_reference_schema_v1.sql,
-- 20260723234500_pricing_rate_cards_client_profiles_v1.sql, and
-- 20260723235500_pricing_effort_engine_v1.sql — read those three files'
-- headers first for the shared RLS / tenant-key / idempotency conventions
-- this migration also follows exactly (no new convention is introduced
-- here).
--
-- ## Why no `pricing_estimate_scenarios` table (brief §8.3 judgment call)
--
-- The brief's §8.3 table list names `pricing_estimate_scenarios` alongside
-- `pricing_estimates`. Once `pricing_estimates` itself carries scenario
-- identity (`scenario_name`, `scenario_key`) there is no independent
-- "scenario" concept a separate table would model — a scenario variant IS
-- an estimate row. The real case the brief is reaching for (§7.9/§9.2 step 1
-- "Scenario name", "multiple scenarios under one Move") is handled here by
-- `scenario_group_id`: every scenario variant a user creates for the same
-- Move+question ("traditional" vs "AI-accelerated" vs "vendor-led" for the
-- SAME underlying scope) shares one `scenario_group_id`, so the UI can list
-- "all scenarios for this costing exercise" with one query
-- (`WHERE scenario_group_id = $1`) without a join table. A fresh "Cost &
-- Effort" session for a Move starts a new `scenario_group_id`; "add another
-- scenario" in the wizard reuses the current one. This is a deliberate
-- decision, not an oversight — see the PR5 release record for the
-- alternative considered (a separate join table) and why it was rejected as
-- unnecessary indirection for a 1:1 concept.
--
-- ## Draft mutability (brief's explicit call-out)
--
-- `pricing_estimates` and `pricing_estimate_inputs` are MUTABLE drafts — a
-- user progressing through the 5-step wizard updates the SAME row
-- (`updated_at` tracks the edit), unlike the append-only
-- `pricing_rate_cards` / `pricing_estimate_snapshots` version-bump
-- convention. No content-hash/version-bump idempotency machinery is needed
-- on these two tables for that reason. `pricing_estimate_line_items` is
-- different: it is the ENGINE'S calculated output, and re-running the
-- engine against edited inputs must REPLACE the prior run's lines, never
-- append duplicates or accumulate stale rows from an earlier input set —
-- `src/lib/pricing/moves-workflow/estimate-repository.ts`'s
-- `replaceLineItems` implements this as a single transaction
-- (`DELETE ... WHERE estimate_id = $1` then bulk `INSERT`), proven by
-- `__tests__/estimate-repository.test.ts` running the same estimate twice
-- and asserting no duplicate/stale rows survive.
--
-- ## Forward-compatibility with PR6 (do not re-litigate here)
--
-- `pricing_estimates.status` includes `approved`, `superseded`, and
-- `stale_for_current_scope` in its CHECK constraint for forward
-- compatibility with PR6's approval workflow, matching
-- `pricing_estimate_snapshots.status`'s existing enum shape exactly — PR5's
-- OWN code only ever writes `draft` or `ready_for_review` (see
-- `src/lib/pricing/moves-workflow/validation-gate.ts` and the `/validate`
-- route; nothing in this PR calls `approve`/supersede/stale-mark). This
-- migration does not implement, and does not need, any snapshot/approval
-- logic — `src/lib/pricing/effort-engine/snapshot-service.ts` remains the
-- untouched PR6 stub.
--
-- ## Conventions followed (see PRICING_ENGINE_CURRENT_STATE.md §4, §10)
--
-- - RLS: every table gets `ENABLE ROW LEVEL SECURITY` plus one permissive
--   `service_role_full_access` policy (`USING (true) WITH CHECK (true)`).
--   Real tenant scoping stays at the application query layer (`requireTenancy()`
--   + a `tenant_key`/`move_id` WHERE clause), matching the rest of this repo.
-- - `tenant_key TEXT NOT NULL` on every table below, canonical hyphenated
--   form (`canonicalTenantKey()`), canonicalized at the API write boundary —
--   never assumed equal to the app-session `ClientKey`.
-- - `move_id UUID NOT NULL` is a SOFT reference (no FK) to `engagements.id`,
--   matching `pricing_rate_cards.move_id` / `pricing_estimate_snapshots.move_id`'s
--   existing precedent: this PR sequence's independent-schema decision
--   (PRICING_ENGINE_CURRENT_STATE.md §14) keeps `pricing_*` free of a
--   cross-schema FK/migration-ordering coupling to `engagements`. Validity of
--   `move_id` against a real, tenant-visible Move is an application-layer
--   concern (`getProgramById(ctx, moveId)` in every PR5 API route), not a
--   database constraint here.
-- - `archetype_code` / `activity_pack_code` / `rule_code` / `role_code`
--   columns below are soft references (TEXT, not FK) into the PR4 reference
--   pack, for the same independent-version-axis reason PR4's own migration
--   documents for `pricing_activity_packs.tower_code` etc.

BEGIN;

-- ---------------------------------------------------------------------------
-- pricing_estimates — one row per Move + scenario-name costing draft (brief
-- §8.3). See file header for the scenario-group / no-separate-scenarios-
-- table decision.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_estimates (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key                TEXT NOT NULL,
  -- Soft reference to engagements.id (Move ≡ Program ≡ engagements row) —
  -- see file header.
  move_id                   UUID NOT NULL,
  -- Groups scenario variants authored together for the same Move costing
  -- exercise (see file header). Defaults to a fresh UUID so a caller that
  -- doesn't care about grouping still gets a valid, unique value.
  scenario_group_id         UUID NOT NULL DEFAULT gen_random_uuid(),
  scenario_name             TEXT NOT NULL,
  -- Matches effort-engine.ts's ScenarioKey exactly.
  scenario_key              TEXT NOT NULL DEFAULT 'traditional' CHECK (scenario_key IN (
                               'traditional', 'ai_accelerated', 'vendor_led', 'client_led', 'custom'
                             )),
  -- Soft reference to pricing_archetypes.archetype_code (e.g. 'ARCH-01').
  archetype_code            TEXT NOT NULL,
  -- The PR4 effort-engine reference-pack version this draft targets. Set at
  -- creation from getCurrentModelVersion() and re-validated (not silently
  -- re-pinned) on every /run call — a model-version drift between draft
  -- creation and run time is a caller-visible condition, not a silent swap.
  model_version              INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  currency                   TEXT NOT NULL DEFAULT 'USD',
  target_start_date          DATE NULL,
  target_duration_weeks      INTEGER NULL CHECK (target_duration_weeks IS NULL OR target_duration_weeks > 0),
  -- The tenant rate-card VERSION row (pricing_rate_cards.id) selected for
  -- this estimate. Nullable while still in early draft (step 1 not yet
  -- saved); required by the validation gate before a run.
  selected_rate_card_id      UUID NULL REFERENCES pricing_rate_cards (id),
  status                     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                               'draft', 'ready_for_review', 'approved', 'superseded', 'stale_for_current_scope'
                             )),
  -- Provenance of the most recent /run call, if any. NULL until the first
  -- successful run. last_run_id lets a client-side poller / results view
  -- confirm it is looking at the run it just triggered, not a stale one.
  last_run_id                UUID NULL,
  last_run_at                TIMESTAMPTZ NULL,
  created_by                 TEXT NULL,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A scenario name is unique within its group (prevents two "Traditional"
-- rows under the same costing exercise) — not globally unique across the
-- whole Move, since nothing stops a user starting a second, unrelated
-- costing exercise (new scenario_group_id) later with the same name.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_estimates_group_scenario_name
  ON pricing_estimates (scenario_group_id, scenario_name);
CREATE INDEX IF NOT EXISTS idx_pricing_estimates_move
  ON pricing_estimates (move_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_estimates_tenant
  ON pricing_estimates (tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_estimates_scenario_group
  ON pricing_estimates (scenario_group_id);

ALTER TABLE pricing_estimates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_estimates;
CREATE POLICY "service_role_full_access" ON pricing_estimates
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_estimate_inputs — one row per confirmed/proposed input value for
-- an estimate (brief §6.4/§8.4 exact field list). MUTABLE draft row — see
-- file header. `UNIQUE (estimate_id, input_key)` is this table's upsert key:
-- saving a step re-writes the same row for a key already seen, never
-- inserts a duplicate.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_estimate_inputs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id         UUID NOT NULL REFERENCES pricing_estimates (id) ON DELETE CASCADE,
  -- e.g. a pricing_effort_drivers.driver_code ('integration_count'), a
  -- module-multiplier key ('complexityFactor:AP-TECH-APP-02'), or a named
  -- assumption ('offshore_ratio_default'). Deliberately not constrained to a
  -- closed enum — the set of askable inputs is derived at the application
  -- layer from the PR4 reference pack for the estimate's archetype, not
  -- fixed at the schema layer.
  input_key           TEXT NOT NULL,
  value                JSONB NOT NULL,
  unit                TEXT NULL,
  required             BOOLEAN NOT NULL DEFAULT false,
  source_type          TEXT NOT NULL CHECK (source_type IN (
                          'move_context', 'client_profile', 'global_default', 'client_input', 'override'
                        )),
  source_ref           TEXT NULL,
  confidence           TEXT NULL CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),
  confirmed_by         TEXT NULL,
  confirmed_at         TIMESTAMPTZ NULL,
  override_reason      TEXT NULL,
  -- Which model_version's driver/assumption vocabulary this key was
  -- resolved against, when applicable (a free-form assumption key not tied
  -- to a specific effort-engine driver may leave this null).
  model_version        INTEGER NULL REFERENCES pricing_model_versions (version),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_estimate_inputs_estimate_key
  ON pricing_estimate_inputs (estimate_id, input_key);
CREATE INDEX IF NOT EXISTS idx_pricing_estimate_inputs_estimate
  ON pricing_estimate_inputs (estimate_id);

ALTER TABLE pricing_estimate_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_estimate_inputs;
CREATE POLICY "service_role_full_access" ON pricing_estimate_inputs
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_estimate_line_items — the effort-engine's calculated output,
-- persisted (brief §8.4/§9.4): one row per `EffortLineItem` from PR4's
-- `EffortEngineOutput.lineItems`, carrying the full formula-provenance
-- fields (driver, rule, role, rate, model version, formula trace) the
-- results/drilldown UI needs. REPLACE-ON-RERUN (see file header): this
-- table has no version/is_current column by design — the CURRENT set of
-- rows for an estimate_id IS the latest run, full stop. A new run's write
-- path deletes every existing row for the estimate_id and inserts the new
-- set, inside one transaction (`estimate-repository.ts`'s
-- `replaceLineItems`), tagged with `run_id` so a caller can double check
-- every row it just read shares the same run_id as
-- `pricing_estimates.last_run_id`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_estimate_line_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id            UUID NOT NULL REFERENCES pricing_estimates (id) ON DELETE CASCADE,
  tenant_key             TEXT NOT NULL, -- denormalized from the owning estimate, for query convenience
  run_id                 UUID NOT NULL, -- groups every line item written by the same /run call
  archetype_code         TEXT NOT NULL,
  activity_pack_code     TEXT NOT NULL,
  activity_pack_name     TEXT NOT NULL,
  category               TEXT NOT NULL CHECK (category IN ('technical', 'shared_nontechnical')),
  rule_code              TEXT NOT NULL,
  operation              TEXT NOT NULL,
  driver_code            TEXT NULL,
  driver_quantity        NUMERIC NULL,
  model_version          INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  scenario_key           TEXT NOT NULL,
  classification         TEXT NOT NULL CHECK (classification IN (
                            'initiative_specific', 'shared_program', 'reused', 'already_funded', 'out_of_scope'
                          )),
  shared_cost_ref        TEXT NULL,
  role_code              TEXT NULL,
  allocation_pct         NUMERIC(5, 2) NULL,
  raw_hours              NUMERIC NULL,
  complexity_factor      NUMERIC NULL,
  novelty_factor         NUMERIC NULL,
  assurance_factor       NUMERIC NULL,
  scenario_factor        NUMERIC NULL,
  expected_hours         NUMERIC NULL,
  role_hours             NUMERIC NULL,
  rate_resolved_from_scope TEXT NULL,
  rate_hourly_cents      BIGINT NULL,
  rate_currency          TEXT NULL,
  rate_card_version_id   UUID NULL REFERENCES pricing_rate_cards (id),
  labor_cost_cents       BIGINT NULL,
  manual_cost_cents      BIGINT NULL,
  gap_reason             TEXT NULL,
  override_rationale     TEXT NULL,
  formula_trace          TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_estimate_line_items_estimate
  ON pricing_estimate_line_items (estimate_id);
CREATE INDEX IF NOT EXISTS idx_pricing_estimate_line_items_run
  ON pricing_estimate_line_items (estimate_id, run_id);
CREATE INDEX IF NOT EXISTS idx_pricing_estimate_line_items_tenant
  ON pricing_estimate_line_items (tenant_key);

ALTER TABLE pricing_estimate_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_estimate_line_items;
CREATE POLICY "service_role_full_access" ON pricing_estimate_line_items
  USING (true) WITH CHECK (true);
-- No version/is_current column, and application code exposes no UPDATE path
-- for a line item — a re-run always DELETEs the estimate's existing rows
-- then INSERTs the new set (replace-on-rerun, see file header), never an
-- in-place mutation of a single line.

COMMIT;
