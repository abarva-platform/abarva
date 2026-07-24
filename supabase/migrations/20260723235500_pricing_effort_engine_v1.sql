-- Nexus Pricing Engine — PR4: effort/cost engine reference schema (brief §8.1
-- tables PR2 explicitly deferred: pricing_archetypes, pricing_activity_packs,
-- pricing_effort_drivers, pricing_effort_rules, pricing_activity_role_mix,
-- pricing_archetype_activity_map, pricing_range_policies, pricing_agent_costs).
--
-- Companion migration to 20260723233000_pricing_reference_schema_v1.sql and
-- 20260723234500_pricing_rate_cards_client_profiles_v1.sql — read those two
-- files' headers first for the shared RLS / tenant-key / idempotency
-- conventions this migration also follows exactly (no new convention is
-- introduced here).
--
-- ## Versioning choice: reuse `pricing_model_versions`, do not add a new
-- version-registry table
--
-- PR2's reference-schema migration already created `pricing_model_versions`
-- ("lightweight registry for the future effort/cost engine (PR4 populates
-- real rows)") purely as a forward-compatible FK target for
-- `pricing_estimate_snapshots.model_version`. Every table below carries a
-- `model_version INTEGER NOT NULL REFERENCES pricing_model_versions
-- (version)` column, exactly mirroring the reference-schema migration's own
-- `taxonomy_version` pattern for PR1's taxonomy tables. This is a deliberate
-- decision to reuse the already-stubbed registry rather than create a
-- second, parallel version-registry table for the same purpose — the whole
-- PR4 reference pack (archetypes, activity packs, drivers, rules, role mix,
-- archetype map, range policies, agent costs) version-flips together as one
-- unit, just like the PR1 taxonomy pack does, via
-- `src/lib/pricing/effort-engine/pack-loader.ts` (PR4's analogue of PR2's
-- `reference-pack-loader.ts`).
--
-- ## Conventions followed (see PRICING_ENGINE_CURRENT_STATE.md §4, §10)
--
-- - RLS: every table gets `ENABLE ROW LEVEL SECURITY` plus one permissive
--   `service_role_full_access` policy (`USING (true) WITH CHECK (true)`).
--   Real tenant scoping stays at the application query layer, matching the
--   rest of this repo.
-- - `tenant_key TEXT NULL` on every table per the repo-wide uniform rule —
--   always NULL in practice here: every PR4 object is global starter
--   planning-assumption content (hand-authored, not tenant-specific), the
--   same posture as PR1's taxonomy tables. A future PR could let a tenant
--   override a specific effort rule or role mix by adding a tenant-scoped
--   row; nothing in this migration or PR4's loader populates one.
-- - Idempotency: every table carries `content_hash TEXT NOT NULL` and a
--   `UNIQUE (model_version, <natural_code>)` index, matching PR1/PR2's
--   `taxonomy_version`-scoped uniqueness pattern — a byte-identical re-load
--   of the CSV pack is a detectable no-op via
--   `src/lib/pricing/versioning.ts`'s existing hash/compare/bump contract,
--   reused unchanged.
--
-- ## Honesty / provenance
--
-- Every row in every table below is tagged `source_artifact =
-- 'hand-authored-pr4'` by the loader (matching PR1's own
-- `hand-authored-pr1` precedent for its 8 hand-authored capabilities/9
-- hand-authored roles) — see `datasets/reference/pricing-engine-v1/
-- manifest.json`'s PR4 section for the full disclosure that this content is
-- directional planning-estimation assumptions authored from general
-- enterprise IT delivery/consulting domain knowledge, not a researched
-- benchmark or workbook extraction, and is expected to be tuned against real
-- delivery data over time.
--
-- ## Effort-rule operation set (brief §7.3) — closed, typed, no eval
--
-- `pricing_effort_rules.operation` is constrained by a CHECK to exactly the
-- 11 named operations the brief allows. `parameters` is JSONB whose shape is
-- operation-specific and validated at the APPLICATION layer by
-- `src/lib/pricing/effort-engine/rule-interpreter.ts`'s discriminated-union
-- evaluator — never `eval`, a formula-string parser, or dynamic SQL (brief
-- §2.7). The CHECK constraint below is the database-level backstop; the
-- interpreter is the real gate.
--
-- ## Portfolio/shared-cost classification (brief §7.7)
--
-- `pricing_effort_rules.classification` carries the rule's PLANNING DEFAULT
-- classification (`initiative_specific | shared_program | reused |
-- already_funded | out_of_scope`). This is a default, not a binding fact —
-- a real Move's actual classification (e.g. "is this Move's enterprise
-- architecture review board cost shared across the whole portfolio or
-- dedicated to this Move alone") is a Move-specific finance/PMO decision,
-- so `src/lib/pricing/effort-engine/effort-engine.ts` accepts an optional
-- per-activity-pack override at calculation time; this column only seeds a
-- sensible starting point.

BEGIN;

-- ---------------------------------------------------------------------------
-- pricing_archetypes — the 8 archetypes named in brief §7.6.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_archetypes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version     INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  archetype_code    TEXT NOT NULL,
  archetype_name    TEXT NOT NULL,
  description       TEXT NULL,
  source_artifact   TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  tenant_key        TEXT NULL, -- always NULL; archetypes are global planning taxonomy
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_archetypes_version_code
  ON pricing_archetypes (model_version, archetype_code);

ALTER TABLE pricing_archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_archetypes;
CREATE POLICY "service_role_full_access" ON pricing_archetypes
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_activity_packs — technical (archetype-specific) and
-- shared_nontechnical (brief §7.5, mapped to many archetypes via
-- pricing_archetype_activity_map below) activity packs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_activity_packs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version        INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  activity_pack_code   TEXT NOT NULL,
  activity_pack_name   TEXT NOT NULL,
  category             TEXT NOT NULL CHECK (category IN ('technical', 'shared_nontechnical')),
  -- Soft references (TEXT, not FK) into PR1's taxonomy tables — deliberately
  -- not a hard FK: PR1's taxonomy is keyed by `taxonomy_version`, PR4's
  -- reference pack by `model_version`; the two version axes are independent
  -- by design (a new effort-model version does not require re-importing the
  -- taxonomy, and vice versa), so a cross-table FK would wrongly couple them.
  tower_code           TEXT NULL,
  capability_code      TEXT NULL,
  description          TEXT NULL,
  source_artifact      TEXT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; activity packs are global planning taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_activity_packs_version_code
  ON pricing_activity_packs (model_version, activity_pack_code);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_packs_category
  ON pricing_activity_packs (model_version, category);

ALTER TABLE pricing_activity_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_activity_packs;
CREATE POLICY "service_role_full_access" ON pricing_activity_packs
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_effort_drivers — the GLOBAL scope-driver vocabulary (brief §9.6),
-- e.g. integration_count, impacted_user_count, rollout_wave_count. Deliberately
-- NOT scoped per activity_pack_code: the same named driver (e.g.
-- "integration_count") is consumed by many different activity packs across
-- many archetypes, so the driver's identity/definition lives here once;
-- which packs consume which drivers is expressed by
-- `pricing_effort_rules.driver_code` referencing this table, not by a
-- separate per-pack driver row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_effort_drivers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version     INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  driver_code       TEXT NOT NULL,
  driver_name       TEXT NOT NULL,
  unit_label        TEXT NOT NULL,
  description       TEXT NULL,
  source_artifact   TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  tenant_key        TEXT NULL, -- always NULL; driver vocabulary is global
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_effort_drivers_version_code
  ON pricing_effort_drivers (model_version, driver_code);

ALTER TABLE pricing_effort_drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_effort_drivers;
CREATE POLICY "service_role_full_access" ON pricing_effort_drivers
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_effort_rules — the closed, typed operation set (brief §7.3). See
-- file header for the "no eval" discipline this CHECK constraint backstops.
-- `parameters` shape per operation (validated by rule-interpreter.ts):
--   fixed_hours                    -> {"hours": number}
--   per_unit_hours                 -> {"unitHours": number}
--   tiered_unit_hours              -> {"tiers": [{"uptoQuantity": number|null, "unitHours": number}, ...]}
--   percentage_of_selected_labor   -> {"percentage": number,
--                                       "selectionScope"?: "technical_packs_in_archetype",
--                                       "selectedActivityPackCodes"?: string[]}
--   hours_per_week                 -> {"hoursPerWeek": number}
--   hours_per_wave                 -> {"hoursPerWave": number}
--   hours_per_stakeholder_group    -> {"hoursPerGroup": number}
--   hours_per_course               -> {"hoursPerCourse": number}
--   hours_per_training_session     -> {"hoursPerSession": number}
--   hours_per_supplier_month       -> {"hoursPerSupplierMonth": number}
--   manual_cost_line               -> {"costCents": integer, "rationale": string}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_effort_rules (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version        INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  activity_pack_code   TEXT NOT NULL,
  rule_code            TEXT NOT NULL,
  operation            TEXT NOT NULL CHECK (operation IN (
                          'fixed_hours',
                          'per_unit_hours',
                          'tiered_unit_hours',
                          'percentage_of_selected_labor',
                          'hours_per_week',
                          'hours_per_wave',
                          'hours_per_stakeholder_group',
                          'hours_per_course',
                          'hours_per_training_session',
                          'hours_per_supplier_month',
                          'manual_cost_line'
                        )),
  -- NULL for fixed_hours / percentage_of_selected_labor / manual_cost_line
  -- (these operations do not consume a scope-driver quantity).
  driver_code          TEXT NULL,
  parameters           JSONB NOT NULL,
  classification       TEXT NOT NULL DEFAULT 'initiative_specific' CHECK (classification IN (
                          'initiative_specific', 'shared_program', 'reused',
                          'already_funded', 'out_of_scope'
                        )),
  sequence             INTEGER NOT NULL DEFAULT 1,
  source_artifact      TEXT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; effort rules are global planning taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_effort_rules_version_pack_code
  ON pricing_effort_rules (model_version, activity_pack_code, rule_code);
CREATE INDEX IF NOT EXISTS idx_pricing_effort_rules_pack
  ON pricing_effort_rules (model_version, activity_pack_code);
CREATE INDEX IF NOT EXISTS idx_pricing_effort_rules_driver
  ON pricing_effort_rules (model_version, driver_code) WHERE driver_code IS NOT NULL;

ALTER TABLE pricing_effort_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_effort_rules;
CREATE POLICY "service_role_full_access" ON pricing_effort_rules
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_activity_role_mix — which real pricing_roles.role_code staff each
-- activity pack, at what allocation % of the pack's expected hours.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_activity_role_mix (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version        INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  activity_pack_code   TEXT NOT NULL,
  -- Soft reference (TEXT) to pricing_roles.role_code — same independent-
  -- version-axis reasoning as pricing_activity_packs.tower_code above.
  role_code            TEXT NOT NULL,
  allocation_pct       NUMERIC(5, 2) NOT NULL CHECK (allocation_pct > 0 AND allocation_pct <= 100),
  level_hint           TEXT NULL, -- optional pricing_seniority_levels.level_code hint
  source_artifact      TEXT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; role mix is global planning taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_activity_role_mix_version_pack_role
  ON pricing_activity_role_mix (model_version, activity_pack_code, role_code);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_role_mix_pack
  ON pricing_activity_role_mix (model_version, activity_pack_code);

ALTER TABLE pricing_activity_role_mix ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_activity_role_mix;
CREATE POLICY "service_role_full_access" ON pricing_activity_role_mix
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_archetype_activity_map — which activity packs apply to which
-- archetypes (brief §7.6). `applicability = 'excluded'` is a DOCUMENTED
-- judgment call (see `notes`), not a silent omission — every archetype x
-- shared-pack combination gets an explicit row (required/conditional/
-- excluded), never a missing row meaning "unknown".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_archetype_activity_map (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version        INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  archetype_code       TEXT NOT NULL,
  activity_pack_code   TEXT NOT NULL,
  applicability        TEXT NOT NULL DEFAULT 'required' CHECK (applicability IN (
                          'required', 'conditional', 'excluded'
                        )),
  notes                TEXT NULL,
  source_artifact      TEXT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; archetype/activity mapping is global planning taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_archetype_activity_map_version_pair
  ON pricing_archetype_activity_map (model_version, archetype_code, activity_pack_code);
CREATE INDEX IF NOT EXISTS idx_pricing_archetype_activity_map_archetype
  ON pricing_archetype_activity_map (model_version, archetype_code);

ALTER TABLE pricing_archetype_activity_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_archetype_activity_map;
CREATE POLICY "service_role_full_access" ON pricing_archetype_activity_map
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_range_policies — deterministic low/expected/high spread policy
-- (brief §7.8). NO ML, no Monte Carlo, per the brief's explicit V0
-- exclusion: a named tier is selected by a deterministic point score (scope
-- maturity + evidence quality + delivery novelty + quantity uncertainty +
-- rate-card coverage, each 0-2 points, see
-- src/lib/pricing/effort-engine/range-policy.ts), and that tier's
-- low/high multiplier band is applied to the expected cost. The CHECK
-- constraint below guarantees low <= 1 <= high structurally, which combined
-- with range-policy.ts's scoring guarantees low <= expected <= high for
-- every calculation (also proven by a test, not just by construction).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_range_policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version     INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  policy_code       TEXT NOT NULL,
  policy_name       TEXT NOT NULL,
  min_score         INTEGER NOT NULL,
  max_score         INTEGER NOT NULL,
  low_multiplier    NUMERIC(6, 4) NOT NULL,
  high_multiplier   NUMERIC(6, 4) NOT NULL,
  description       TEXT NULL,
  source_artifact   TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  tenant_key        TEXT NULL, -- always NULL; range policy bands are global planning taxonomy
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pricing_range_policies_score_order CHECK (min_score <= max_score),
  CONSTRAINT pricing_range_policies_multiplier_order CHECK (
    low_multiplier > 0 AND low_multiplier <= 1 AND high_multiplier >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_range_policies_version_code
  ON pricing_range_policies (model_version, policy_code);

ALTER TABLE pricing_range_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_range_policies;
CREATE POLICY "service_role_full_access" ON pricing_range_policies
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_agent_costs — AI-acceleration scenario cost assumptions (brief
-- §7.9): the explicit, disclosed platform/compute cost lines an
-- AI-accelerated scenario ADDS (never a silent netting against labor
-- savings). `applies_to_archetype_code` is nullable — a cost that applies
-- broadly (e.g. a coding-copilot seat license) is not archetype-specific.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_agent_costs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version               INTEGER NOT NULL REFERENCES pricing_model_versions (version),
  agent_cost_code             TEXT NOT NULL,
  cost_key                    TEXT NOT NULL,
  applies_to_archetype_code   TEXT NULL,
  cost_value                  NUMERIC(14, 4) NOT NULL,
  unit                        TEXT NOT NULL,
  description                 TEXT NULL,
  source_artifact             TEXT NULL,
  status                      TEXT NOT NULL DEFAULT 'active',
  tenant_key                  TEXT NULL, -- always NULL; agent-cost assumptions are global planning taxonomy
  content_hash                TEXT NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_agent_costs_version_code
  ON pricing_agent_costs (model_version, agent_cost_code);
CREATE INDEX IF NOT EXISTS idx_pricing_agent_costs_archetype
  ON pricing_agent_costs (model_version, applies_to_archetype_code)
  WHERE applies_to_archetype_code IS NOT NULL;

ALTER TABLE pricing_agent_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_agent_costs;
CREATE POLICY "service_role_full_access" ON pricing_agent_costs
  USING (true) WITH CHECK (true);

COMMIT;
