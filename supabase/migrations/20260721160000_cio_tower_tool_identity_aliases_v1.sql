-- CIO Tower tool identity aliases v1
--
-- The identity spine that links real tool telemetry to the funded program it
-- is evidence for. Without it, `tool::github-copilot` (from tower_ai_tool_usage)
-- and `program::copilot-productivity` (from the V3 program registry) read as
-- two unrelated Tower rows — the funded program shows usage=0 while its real
-- active-user telemetry orphans into a separate row. This table declares the
-- crosswalk, and also normalizes messy display-name variants ("GitHub Copilot"
-- vs "Copilot Enterprise" vs "Developer Productivity AI") onto one canonical
-- tool key so the mart never merges/dedups by display name.
--
-- Read by the facts -> mart assembler (src/lib/cio-tower/mart-projection).
-- Tenant-scoped; curated per tenant, never cross-tenant.

CREATE SCHEMA IF NOT EXISTS cio_tower;

CREATE TABLE IF NOT EXISTS cio_tower.tool_identity_aliases (
  alias_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  -- Canonical tool identity that tower_* telemetry facts also stamp.
  canonical_tool_key text NOT NULL,
  -- A raw/display-name variant seen in a source extract. The ingest side maps
  -- these onto canonical_tool_key; one canonical tool may have many aliases.
  alias text NOT NULL,
  vendor_name text,
  system_name text,
  -- The funded program this tool's telemetry rolls up into. NULL means the
  -- tool is known but not yet linked to a funded bet (stays a standalone
  -- portfolio row rather than being force-attached).
  program_code text,
  canonical_program_key text,
  -- Provenance of the mapping, so a curated link is distinguishable from an
  -- auto-proposed one that still needs human confirmation.
  source text NOT NULL DEFAULT 'curated'
    CHECK (source IN ('curated', 'ingested', 'abarva_proposed')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, canonical_tool_key, alias)
);

CREATE INDEX IF NOT EXISTS idx_cio_tower_tool_aliases_tenant_tool
  ON cio_tower.tool_identity_aliases (tenant_key, canonical_tool_key)
  WHERE active;

CREATE INDEX IF NOT EXISTS idx_cio_tower_tool_aliases_tenant_program
  ON cio_tower.tool_identity_aliases (tenant_key, canonical_program_key)
  WHERE active AND canonical_program_key IS NOT NULL;

-- Row-level security, matching the rest of the cio_tower schema. The projection
-- job writes via service_role (full access); authenticated reads are fenced to
-- the caller's own tenant, so one client can never see another client's tool→
-- program mappings. Stricter than the mart tables' permissive read on purpose:
-- this is tenant configuration data, not an already-tenant-filtered read model.
ALTER TABLE cio_tower.tool_identity_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON cio_tower.tool_identity_aliases;
CREATE POLICY svc_all ON cio_tower.tool_identity_aliases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON cio_tower.tool_identity_aliases;
CREATE POLICY auth_read ON cio_tower.tool_identity_aliases
  FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key));
