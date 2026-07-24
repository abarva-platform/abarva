-- Nexus Pricing Engine — PR2: reference/model schema (brief §8.1).
--
-- New, INDEPENDENT `pricing_*` schema (see docs/architecture/
-- PRICING_ENGINE_CURRENT_STATE.md §14 — explicit product decision to build
-- fresh rather than fold into expert-kernel/rate-card or
-- workforce-economics.ts). This migration creates the reference/model tables
-- that PR1's checked-in CSV reference pack
-- (datasets/reference/pricing-engine-v1/) loads into via
-- src/lib/pricing/reference-pack-loader.ts (PR2). No PR4-scope tables
-- (pricing_archetypes, pricing_activity_packs, pricing_effort_drivers,
-- pricing_effort_rules, pricing_activity_role_mix,
-- pricing_archetype_activity_map, pricing_range_policies,
-- pricing_agent_costs) are created here — those are explicitly out of PR2
-- scope per the PR2 execution prompt.
--
-- ## Conventions followed (see PRICING_ENGINE_CURRENT_STATE.md §4, §10)
--
-- - RLS: every table gets `ENABLE ROW LEVEL SECURITY` plus one permissive
--   `service_role_full_access` policy (`USING (true) WITH CHECK (true)`),
--   matching the rest of this repo (e.g.
--   20260722150000_source_artifact_acceptances.sql). Real tenant scoping is
--   enforced at the APPLICATION query layer
--   (src/lib/pricing/*-repository.ts), not per-row RLS — this repo has not
--   yet done the broader per-user-RLS pilot-readiness work, and this table
--   family intentionally stays consistent with that standing convention
--   rather than introducing a stricter model in isolation.
-- - Tenant key: every table below carries a `tenant_key TEXT` column, stored
--   in the CANONICAL hyphenated form (e.g. `apex-retail`, not `apexretail`)
--   returned by `canonicalTenantKey()` in src/lib/tenant/aliases.ts — NEVER
--   the app-session `ClientKey` form. See PRICING_ENGINE_CURRENT_STATE.md
--   §10 for the app-alias-vs-canonical gotcha this guards against.
--   Reference/taxonomy data (towers, capabilities, role families, roles,
--   seniority levels, rate bands, provider classes, delivery locations) is
--   GLOBAL by nature — `tenant_key` stays NULL for every row PR1's reference
--   pack produces. The column exists on every table per the brief's uniform
--   rule, but is only ever non-NULL on the tenant-scoped alias/provider
--   tables (pricing_role_aliases, pricing_provider_level_aliases,
--   pricing_providers) once a future PR onboards a tenant-specific alias or
--   named provider.
-- - Idempotency (brief §6.4): real UNIQUE constraints, not just
--   documentation. `pricing_roles` carries the brief's exact key,
--   `UNIQUE (taxonomy_version, role_code)`. `pricing_role_aliases` uses the
--   COALESCE trick (documented at its index) so a NULL (global) tenant_key
--   does not collide with a tenant-scoped alias sharing the same label —
--   Postgres treats two NULLs as distinct in a plain UNIQUE constraint, so a
--   literal placeholder sentinel is COALESCE'd in for the comparison.
-- - Versioning: `pricing_taxonomy_versions` is the version registry — one
--   row per reference-pack import, `is_current` marks the active version
--   (at most one, enforced by a partial unique index), `content_hash` is the
--   sha256 of the normalized whole-pack row set (see
--   src/lib/pricing/versioning.ts) so a byte-identical re-import is a
--   detectable no-op before any row is written. Every reference table below
--   carries `taxonomy_version INTEGER` (not its own version/is_current —
--   the whole pack version-flips together; an individual row's version
--   identity is inherited from its taxonomy_version, per the brief's role
--   idempotency key naming the column `taxonomy_version` directly).
--
-- ## Forward-compatible, deliberately unseeded tables
--
-- `pricing_provider_level_aliases` and `pricing_providers` are created here
-- per the brief's model even though PR1's reference pack produced zero rows
-- for either (manifest.json's `deferred_reference_objects` — no onboarded
-- providers/tenant rate cards exist yet). They stay empty until a future PR
-- onboards real providers/tenant-scoped provider aliases.
--
-- `pricing_model_versions` is a lightweight version-registry table for the
-- future deterministic effort/cost engine (PR4) — created now only so
-- PR2's `pricing_estimate_snapshots` skeleton (see the companion migration
-- 20260723234500_pricing_rate_cards_client_profiles_v1.sql) has a real FK
-- target for `model_version`. PR4 populates real rows; PR2 leaves it empty.

BEGIN;

-- ---------------------------------------------------------------------------
-- pricing_taxonomy_versions — one row per reference-pack import.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_taxonomy_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version          INTEGER NOT NULL,
  generated_from   TEXT NOT NULL,
  -- sha256 of the source workbook (manifest.json's generated_from.source_sha256)
  -- when known; 'unknown' for a pack whose source file is not re-derivable.
  source_sha256    TEXT NOT NULL,
  -- sha256 of the normalized whole-pack row set actually loaded (see
  -- src/lib/pricing/versioning.ts computeContentHash) — this is the value
  -- idempotency checks against, distinct from source_sha256 above.
  content_hash     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'superseded')),
  is_current       BOOLEAN NOT NULL DEFAULT true,
  tenant_key       TEXT NULL, -- always NULL; taxonomy is global, never tenant-scoped
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_taxonomy_versions_version
  ON pricing_taxonomy_versions (version);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_taxonomy_versions_content_hash
  ON pricing_taxonomy_versions (content_hash);
-- At most one current version at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_taxonomy_versions_one_current
  ON pricing_taxonomy_versions ((true)) WHERE is_current;

ALTER TABLE pricing_taxonomy_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_taxonomy_versions;
CREATE POLICY "service_role_full_access" ON pricing_taxonomy_versions
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_model_versions — lightweight registry for the future effort/cost
-- engine (PR4 populates real rows). Created now purely as an FK target for
-- pricing_estimate_snapshots.model_version.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_model_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version      INTEGER NOT NULL,
  description  TEXT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'active', 'superseded')),
  is_current   BOOLEAN NOT NULL DEFAULT false,
  tenant_key   TEXT NULL, -- always NULL; the effort/cost model itself is global
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_model_versions_version
  ON pricing_model_versions (version);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_model_versions_one_current
  ON pricing_model_versions ((true)) WHERE is_current;

ALTER TABLE pricing_model_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_model_versions;
CREATE POLICY "service_role_full_access" ON pricing_model_versions
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_towers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_towers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version  INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  tower_code        TEXT NOT NULL,
  tower_name        TEXT NOT NULL,
  scope             TEXT NULL,
  source_artifact   TEXT NULL,
  source_row        INTEGER NULL,
  source_label      TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  tenant_key        TEXT NULL, -- always NULL; towers are global taxonomy
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_towers_version_code
  ON pricing_towers (taxonomy_version, tower_code);

ALTER TABLE pricing_towers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_towers;
CREATE POLICY "service_role_full_access" ON pricing_towers
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_capabilities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_capabilities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version   INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  capability_code    TEXT NOT NULL,
  tower_code         TEXT NOT NULL,
  capability_name    TEXT NOT NULL,
  scarcity_tier      TEXT NULL,
  agent_amenability  INTEGER NULL,
  source_artifact    TEXT NULL,
  source_row         INTEGER NULL,
  source_label       TEXT NULL,
  status             TEXT NOT NULL DEFAULT 'active',
  tenant_key         TEXT NULL, -- always NULL; capabilities are global taxonomy
  content_hash       TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_capabilities_version_code
  ON pricing_capabilities (taxonomy_version, capability_code);
CREATE INDEX IF NOT EXISTS idx_pricing_capabilities_tower
  ON pricing_capabilities (taxonomy_version, tower_code);

ALTER TABLE pricing_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_capabilities;
CREATE POLICY "service_role_full_access" ON pricing_capabilities
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_role_families
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_role_families (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version     INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  role_family_code     TEXT NOT NULL,
  tower_code           TEXT NOT NULL,
  capability_code      TEXT NOT NULL,
  family_name          TEXT NOT NULL,
  source_artifact      TEXT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; role families are global taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_role_families_version_code
  ON pricing_role_families (taxonomy_version, role_family_code);
CREATE INDEX IF NOT EXISTS idx_pricing_role_families_capability
  ON pricing_role_families (taxonomy_version, capability_code);

ALTER TABLE pricing_role_families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_role_families;
CREATE POLICY "service_role_full_access" ON pricing_role_families
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_seniority_levels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_seniority_levels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version  INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  level_code        TEXT NOT NULL,
  level_name        TEXT NOT NULL,
  rank              INTEGER NOT NULL, -- 1 = most senior (Partner)
  years_exp         TEXT NULL,
  expectation       TEXT NULL,
  source_artifact   TEXT NULL,
  source_row        INTEGER NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  tenant_key        TEXT NULL, -- always NULL; seniority ladder is global taxonomy
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_seniority_levels_version_code
  ON pricing_seniority_levels (taxonomy_version, level_code);

ALTER TABLE pricing_seniority_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_seniority_levels;
CREATE POLICY "service_role_full_access" ON pricing_seniority_levels
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_roles — brief §6.4's named idempotency key:
-- UNIQUE (taxonomy_version, role_code).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_roles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version            INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  role_code                   TEXT NOT NULL,
  canonical_name              TEXT NOT NULL,
  tower_code                  TEXT NOT NULL,
  capability_code             TEXT NOT NULL,
  role_family_code            TEXT NOT NULL,
  role_type                   TEXT NOT NULL,
  allowed_level_min           TEXT NOT NULL, -- level_name, least senior end of range
  allowed_level_max           TEXT NOT NULL, -- level_name, most senior end of range
  default_rate_band_code      TEXT NULL,
  internal_external_default   TEXT NULL,
  billable_default            BOOLEAN NOT NULL DEFAULT true,
  source_artifact             TEXT NULL,
  source_row                  INTEGER NULL,
  source_label                TEXT NULL,
  status                      TEXT NOT NULL DEFAULT 'active',
  tenant_key                  TEXT NULL, -- always NULL; roles are global taxonomy
  content_hash                TEXT NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The exact idempotency key named in brief §6.4.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_roles_taxonomy_version_role_code
  ON pricing_roles (taxonomy_version, role_code);
CREATE INDEX IF NOT EXISTS idx_pricing_roles_family
  ON pricing_roles (taxonomy_version, role_family_code);

ALTER TABLE pricing_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_roles;
CREATE POLICY "service_role_full_access" ON pricing_roles
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_role_aliases — brief §6.4's named idempotency key:
-- UNIQUE (tenant_key, normalized_alias, provider_scope), with tenant_key
-- null/'global' for PR2's global-only reference pack.
--
-- `normalized_alias` is a generated column (lower/trim of alias_label) so the
-- uniqueness comparison is enforced at the database layer, not only by
-- callers remembering to normalize before insert.
--
-- COALESCE trick: Postgres treats two NULLs as distinct values in a plain
-- UNIQUE constraint/index, so `tenant_key IS NULL` rows would never collide
-- with each other under a naive `UNIQUE (tenant_key, normalized_alias,
-- provider_scope)` — defeating the very case we need to guard (two global
-- aliases with the same label). The functional unique index below
-- COALESCEs tenant_key and provider_scope to literal sentinels
-- ('__global__' / '__any_provider__') so NULLs compare equal to each other,
-- while a real, distinct tenant_key still yields a distinct index key from
-- the global sentinel — i.e. a future tenant-scoped alias naturally does not
-- collide with the global one, because its tenant_key differs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_role_aliases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version  INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  alias_code        TEXT NOT NULL,
  role_code         TEXT NOT NULL,
  alias_label       TEXT NOT NULL,
  normalized_alias  TEXT GENERATED ALWAYS AS (lower(trim(alias_label))) STORED,
  alias_type        TEXT NOT NULL,
  -- NULL = global alias (PR1's reference pack). A future tenant-specific
  -- alias stores its canonical hyphenated tenant_key here.
  tenant_key        TEXT NULL,
  -- NULL = alias applies regardless of provider. Reserved for a future
  -- provider-scoped alias; not populated by PR1/PR2.
  provider_scope    TEXT NULL,
  source_artifact   TEXT NULL,
  source_row        INTEGER NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_role_aliases_code
  ON pricing_role_aliases (taxonomy_version, alias_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_role_aliases_scoped_label
  ON pricing_role_aliases (
    COALESCE(tenant_key, '__global__'),
    normalized_alias,
    COALESCE(provider_scope, '__any_provider__')
  );
CREATE INDEX IF NOT EXISTS idx_pricing_role_aliases_role
  ON pricing_role_aliases (taxonomy_version, role_code);

ALTER TABLE pricing_role_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_role_aliases;
CREATE POLICY "service_role_full_access" ON pricing_role_aliases
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_provider_level_aliases — per brief §4.4's model list. PR1's
-- reference pack produced zero rows for this object (no onboarded
-- providers/tenant rate cards exist yet); the table is created complete and
-- ready, intentionally left unseeded until a future PR has a real
-- provider/tenant alias to load.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_provider_level_aliases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key            TEXT NULL, -- NULL = global provider-level alias
  provider_class_code   TEXT NOT NULL,
  level_code            TEXT NOT NULL,
  alias_label           TEXT NOT NULL,
  normalized_alias      TEXT GENERATED ALWAYS AS (lower(trim(alias_label))) STORED,
  status                TEXT NOT NULL DEFAULT 'active',
  version               INTEGER NOT NULL DEFAULT 1,
  is_current            BOOLEAN NOT NULL DEFAULT true,
  content_hash          TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_provider_level_aliases_scoped
  ON pricing_provider_level_aliases (
    COALESCE(tenant_key, '__global__'),
    provider_class_code,
    level_code,
    normalized_alias
  );

ALTER TABLE pricing_provider_level_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_provider_level_aliases;
CREATE POLICY "service_role_full_access" ON pricing_provider_level_aliases
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_rate_bands
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_rate_bands (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version         INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  rate_band_code           TEXT NOT NULL,
  role_code                TEXT NOT NULL,
  level_code               TEXT NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  rate_basis               TEXT NOT NULL,
  rate_unit                TEXT NOT NULL,
  loaded_rate               NUMERIC(14, 4) NULL,
  scarcity_adj_rate         NUMERIC(14, 4) NULL,
  indicative_bill_rate      NUMERIC(14, 4) NULL,
  valid_from                DATE NOT NULL,
  source                    TEXT NULL,
  confidence                TEXT NULL,
  approval_status           TEXT NULL,
  status                    TEXT NOT NULL DEFAULT 'active',
  tenant_key                TEXT NULL, -- always NULL; PR1's rate bands are the global researched benchmark
  content_hash               TEXT NOT NULL,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_bands_version_code
  ON pricing_rate_bands (taxonomy_version, rate_band_code);
CREATE INDEX IF NOT EXISTS idx_pricing_rate_bands_role_level
  ON pricing_rate_bands (taxonomy_version, role_code, level_code);

ALTER TABLE pricing_rate_bands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_rate_bands;
CREATE POLICY "service_role_full_access" ON pricing_rate_bands
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_provider_classes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_provider_classes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version     INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  provider_class_code  TEXT NOT NULL,
  class_name           TEXT NOT NULL,
  archetype_label      TEXT NULL,
  tier_multiplier      NUMERIC(8, 4) NOT NULL,
  source_artifact      TEXT NULL,
  source_row           INTEGER NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  tenant_key           TEXT NULL, -- always NULL; provider classes are global taxonomy
  content_hash         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_provider_classes_version_code
  ON pricing_provider_classes (taxonomy_version, provider_class_code);

ALTER TABLE pricing_provider_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_provider_classes;
CREATE POLICY "service_role_full_access" ON pricing_provider_classes
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_providers — named-provider table, distinct from provider CLASSES
-- above. Per brief §4.4/manifest.json's deferred_reference_objects: PR1
-- produced no named-provider rows either; the table is created complete and
-- ready, intentionally left unseeded until a real provider is onboarded.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_providers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key            TEXT NULL, -- NULL = a globally available named provider
  provider_code         TEXT NOT NULL,
  provider_name         TEXT NOT NULL,
  provider_class_code   TEXT NULL,
  status                TEXT NOT NULL DEFAULT 'active',
  version               INTEGER NOT NULL DEFAULT 1,
  is_current            BOOLEAN NOT NULL DEFAULT true,
  content_hash          TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_providers_scoped_code
  ON pricing_providers (COALESCE(tenant_key, '__global__'), provider_code);

ALTER TABLE pricing_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_providers;
CREATE POLICY "service_role_full_access" ON pricing_providers
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_delivery_locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_delivery_locations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_version       INTEGER NOT NULL REFERENCES pricing_taxonomy_versions (version),
  location_code          TEXT NOT NULL,
  region_name            TEXT NOT NULL,
  shore_category         TEXT NOT NULL,
  salary_multiplier      NUMERIC(8, 4) NOT NULL,
  rate_multiplier        NUMERIC(8, 4) NOT NULL,
  scarcity_multiplier    NUMERIC(8, 4) NOT NULL,
  cost_of_living_index   NUMERIC(8, 4) NULL,
  source_artifact        TEXT NULL,
  source_row             INTEGER NULL,
  status                 TEXT NOT NULL DEFAULT 'active',
  tenant_key             TEXT NULL, -- always NULL; delivery locations are global taxonomy
  content_hash           TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_delivery_locations_version_code
  ON pricing_delivery_locations (taxonomy_version, location_code);

ALTER TABLE pricing_delivery_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_delivery_locations;
CREATE POLICY "service_role_full_access" ON pricing_delivery_locations
  USING (true) WITH CHECK (true);

COMMIT;
