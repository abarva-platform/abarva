-- Nexus Pricing Engine — PR2: rate cards, client profiles, and the
-- immutable pricing-estimate-snapshot SKELETON (brief §8.2 + §8.3).
--
-- Companion migration to 20260723233000_pricing_reference_schema_v1.sql
-- (read that file's header first for the shared RLS/tenant-key/versioning
-- conventions this migration also follows).
--
-- ## Rate card inheritance (brief §5.1)
--
-- Modeled as ONE table (`pricing_rate_cards`) with a `scope_type` enum
-- (`global` | `client` | `move_exception`) plus a self-referencing
-- `parent_rate_card_id`, rather than a rigid 4-table hierarchy — per the
-- PR2 execution prompt's explicit instruction. A client card's
-- `parent_rate_card_id` points at the global starter card it overrides; a
-- move-exception card's `parent_rate_card_id` points at the client card it
-- overrides. `src/lib/pricing/rate-card-repository.ts` walks this chain in
-- application code (global -> client -> move_exception, closest-scope-wins
-- per line) — this migration only shapes the data, it enforces no
-- inheritance logic itself.
--
-- `move_id` is a SOFT reference (plain UUID column, no FK) to
-- `engagements.id` — this PR sequence's product decision (PRICING_ENGINE_
-- CURRENT_STATE.md §14) is to keep the new pricing_* schema independent of
-- the existing Moves/programs schema; a real FK would create a migration-
-- ordering and cross-schema-cascade coupling this PR does not need yet.
-- Validity of `move_id` against a real engagement is an application-layer
-- concern (PR5+), not a database constraint here.
--
-- ## Immutable snapshot skeleton (brief §8.3)
--
-- `pricing_estimate_snapshots` is explicitly a SKELETON: the full estimate
-- workflow tables (`pricing_estimates`, `pricing_estimate_scenarios`,
-- `pricing_estimate_inputs`, `pricing_estimate_line_items`,
-- `pricing_estimate_approvals`) are PR4–PR6 scope and are deliberately NOT
-- created here — building empty shells for them now would be schema churn
-- without a consumer. This table has no FK to a `pricing_estimates` row
-- because none exists yet; it references the owning Move/tenant directly
-- (`tenant_key` + `move_id`, same soft-reference convention as
-- `pricing_rate_cards.move_id` above) so it can exist standalone until PR6
-- wires the real estimate workflow into it. Append-only: no UPDATE/DELETE
-- path, matching the `source_artifact_acceptances` precedent
-- (20260722150000_source_artifact_acceptances.sql) — a re-snapshot is a new
-- row, "latest wins" by `(move_id, created_at DESC)`, never an in-place
-- mutation of an approved snapshot.

BEGIN;

-- ---------------------------------------------------------------------------
-- pricing_rate_cards — brief §6.4's named idempotency key:
-- UNIQUE (scope_type, tenant_key, card_code, version), tenant_key
-- COALESCE'd for global scope (same NULL-collision reasoning documented at
-- pricing_role_aliases in the companion reference-schema migration).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_rate_cards (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type             TEXT NOT NULL CHECK (scope_type IN ('global', 'client', 'move_exception')),
  -- NULL only for scope_type = 'global'. Canonical hyphenated form
  -- (canonicalTenantKey()) for 'client' / 'move_exception' scope.
  tenant_key             TEXT NULL,
  -- Only populated for scope_type = 'move_exception'. Soft reference to
  -- engagements.id — see file header.
  move_id                UUID NULL,
  card_code              TEXT NOT NULL,
  parent_rate_card_id    UUID NULL REFERENCES pricing_rate_cards (id),
  version                INTEGER NOT NULL,
  is_current             BOOLEAN NOT NULL DEFAULT true,
  content_hash           TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'approved', 'superseded')),
  approved_by            TEXT NULL,
  approved_at            TIMESTAMPTZ NULL,
  approval_rationale     TEXT NULL,
  effective_from         DATE NULL,
  effective_to           DATE NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pricing_rate_cards_scope_tenant_consistency CHECK (
    (scope_type = 'global' AND tenant_key IS NULL AND move_id IS NULL) OR
    (scope_type = 'client' AND tenant_key IS NOT NULL AND move_id IS NULL) OR
    (scope_type = 'move_exception' AND tenant_key IS NOT NULL AND move_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_cards_scope_code_version
  ON pricing_rate_cards (scope_type, COALESCE(tenant_key, '__global__'), card_code, version);
-- At most one is_current = true per (scope_type, tenant_key, card_code) —
-- proves "no duplicate current rows on double-import" at the DB layer too.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_cards_one_current
  ON pricing_rate_cards (scope_type, COALESCE(tenant_key, '__global__'), card_code)
  WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_pricing_rate_cards_tenant
  ON pricing_rate_cards (tenant_key) WHERE tenant_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pricing_rate_cards_move
  ON pricing_rate_cards (move_id) WHERE move_id IS NOT NULL;

ALTER TABLE pricing_rate_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_rate_cards;
CREATE POLICY "service_role_full_access" ON pricing_rate_cards
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_rate_card_lines — brief §6.4's named idempotency key:
-- UNIQUE (card_version_id, role_or_band_ref, level, provider_ref,
-- location_ref, rate_basis, unit, valid_from). Nullable dimensions
-- (level/provider_ref/location_ref) use the same COALESCE-to-sentinel
-- pattern as pricing_role_aliases for the same NULL-collision reason.
--
-- No version/is_current/content_hash columns on this table: a rate-card
-- LINE's version identity is inherited from its owning `pricing_rate_cards`
-- row (`card_version_id`) — each card version is itself an immutable,
-- append-only row (see pricing_rate_cards.version above), so a line never
-- needs its own version marker. `content_hash` is still carried, purely to
-- let the loader diff an individual line's payload during a card-version
-- build without re-hashing the whole card.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_rate_card_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_version_id   UUID NOT NULL REFERENCES pricing_rate_cards (id) ON DELETE CASCADE,
  -- role_code (pricing_roles) or rate_band_code (pricing_rate_bands) —
  -- deliberately not a hard FK to either: PR2's rate-card lines may be
  -- authored at role grain or at rate-band grain depending on the source,
  -- and a hard FK would force a premature choice between the two grains.
  role_or_band_ref  TEXT NOT NULL,
  level             TEXT NULL,
  provider_ref      TEXT NULL,
  location_ref      TEXT NULL,
  rate_basis        TEXT NOT NULL,
  unit              TEXT NOT NULL,
  rate_value        NUMERIC(14, 4) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  valid_from        DATE NOT NULL,
  valid_to          DATE NULL,
  tenant_key        TEXT NULL, -- denormalized from the owning card, for query convenience
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_rate_card_lines_identity
  ON pricing_rate_card_lines (
    card_version_id,
    role_or_band_ref,
    COALESCE(level, '__any_level__'),
    COALESCE(provider_ref, '__any_provider__'),
    COALESCE(location_ref, '__any_location__'),
    rate_basis,
    unit,
    valid_from
  );
CREATE INDEX IF NOT EXISTS idx_pricing_rate_card_lines_card
  ON pricing_rate_card_lines (card_version_id);

ALTER TABLE pricing_rate_card_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_rate_card_lines;
CREATE POLICY "service_role_full_access" ON pricing_rate_card_lines
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_client_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_client_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key           TEXT NOT NULL, -- client profiles are always tenant-scoped, never global
  profile_version      INTEGER NOT NULL,
  is_current           BOOLEAN NOT NULL DEFAULT true,
  content_hash         TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'approved', 'superseded')),
  approved_by          TEXT NULL,
  approved_at          TIMESTAMPTZ NULL,
  approval_rationale   TEXT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_client_profiles_tenant_version
  ON pricing_client_profiles (tenant_key, profile_version);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_client_profiles_one_current
  ON pricing_client_profiles (tenant_key) WHERE is_current;

ALTER TABLE pricing_client_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_client_profiles;
CREATE POLICY "service_role_full_access" ON pricing_client_profiles
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_client_profile_values — brief §6.4's named idempotency key:
-- UNIQUE (tenant_key, profile_version, assumption_key).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_client_profile_values (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES pricing_client_profiles (id) ON DELETE CASCADE,
  tenant_key        TEXT NOT NULL,   -- denormalized from the parent profile
  profile_version   INTEGER NOT NULL, -- denormalized from the parent profile
  assumption_key    TEXT NOT NULL,   -- e.g. 'offshore_ratio_default', 'discount_tier'
  assumption_value  JSONB NOT NULL,
  content_hash      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_client_profile_values_key
  ON pricing_client_profile_values (tenant_key, profile_version, assumption_key);
CREATE INDEX IF NOT EXISTS idx_pricing_client_profile_values_profile
  ON pricing_client_profile_values (profile_id);

ALTER TABLE pricing_client_profile_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_client_profile_values;
CREATE POLICY "service_role_full_access" ON pricing_client_profile_values
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_technology_cost_defaults
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_technology_cost_defaults (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key    TEXT NULL, -- NULL = global default; a tenant_key row overrides it
  version       INTEGER NOT NULL,
  is_current    BOOLEAN NOT NULL DEFAULT true,
  content_hash  TEXT NOT NULL,
  cost_key      TEXT NOT NULL, -- e.g. 'ai_platform_license_annual_usd'
  cost_value    NUMERIC(14, 4) NOT NULL,
  unit          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_technology_cost_defaults_version
  ON pricing_technology_cost_defaults (COALESCE(tenant_key, '__global__'), version, cost_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_technology_cost_defaults_one_current
  ON pricing_technology_cost_defaults (COALESCE(tenant_key, '__global__'), cost_key)
  WHERE is_current;

ALTER TABLE pricing_technology_cost_defaults ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_technology_cost_defaults;
CREATE POLICY "service_role_full_access" ON pricing_technology_cost_defaults
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pricing_estimate_snapshots — the immutable snapshot SKELETON (brief §8.3).
-- See file header: append-only, no pricing_estimates FK yet, real
-- population logic arrives PR4-PR6.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_estimate_snapshots (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key                  TEXT NOT NULL,
  -- Soft reference to engagements.id (Move ≡ Program ≡ engagements row) —
  -- see file header for why this is not a hard FK in this independent
  -- pricing_* schema.
  move_id                     UUID NOT NULL,
  -- Nullable FK targets: PR2 creates the registries these point at
  -- (pricing_model_versions, pricing_taxonomy_versions) but none of them are
  -- populated with a real "this is what priced this snapshot" row until
  -- PR4-PR6 build the engine/workflow that actually produces a snapshot.
  model_version               INTEGER NULL REFERENCES pricing_model_versions (version),
  taxonomy_version            INTEGER NULL REFERENCES pricing_taxonomy_versions (version),
  rate_card_version_id        UUID NULL REFERENCES pricing_rate_cards (id),
  client_profile_version_id   UUID NULL REFERENCES pricing_client_profiles (id),
  -- sha256 fingerprint of the upstream scope inputs (Move charter/workstream
  -- selection/etc.) that produced this snapshot's totals — used to detect
  -- `stale_for_current_scope` when the upstream scope has since changed.
  upstream_scope_fingerprint  TEXT NOT NULL,
  totals                      JSONB NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN (
                                  'draft', 'approved', 'superseded', 'stale_for_current_scope'
                                )),
  approved_by                 TEXT NULL,
  approved_at                 TIMESTAMPTZ NULL,
  approval_rationale          TEXT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latest-snapshot-for-move lookup — the hot path once a Cost & Effort
-- workspace (PR5) needs "what is the current approved snapshot for this
-- Move". Mirrors source_artifact_acceptances' (artifact_id, accepted_at
-- DESC) index shape.
CREATE INDEX IF NOT EXISTS idx_pricing_estimate_snapshots_move
  ON pricing_estimate_snapshots (move_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_estimate_snapshots_tenant
  ON pricing_estimate_snapshots (tenant_key, created_at DESC);

ALTER TABLE pricing_estimate_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON pricing_estimate_snapshots;
CREATE POLICY "service_role_full_access" ON pricing_estimate_snapshots
  USING (true) WITH CHECK (true);
-- Append-only by convention (enforced at the application write layer, same
-- as source_artifact_acceptances): no UPDATE/DELETE path is exposed by any
-- PR2 code. A later, real-population PR (PR6) must preserve this — a
-- re-snapshot is always a new INSERT, never an UPDATE of an approved row.

COMMIT;
