-- source_stage_guidebooks · facilitator guide content for each Source stage
-- transition workshop/conversation.
--
-- One row = one stage's guidebook: purpose, agenda, facilitator talking points,
-- and a decision-capture worksheet for the working session that moves an event
-- through this stage's gate. Global by default (client_key NULL); a
-- tenant-specific override is a future extension, not built here.
--
-- This is a Source-native, parallel system -- it does not share tables, API
-- routes, or admin UI with the Moves workshop system (src/lib/workshops/,
-- source_workshop_templates does not exist). That system's content model
-- (template/asset split, review/approve/publish lifecycle) informed this
-- table's shape, but nothing here reads or writes Moves' tables.
--
-- TS mirror: src/lib/source/stage-guidebooks/types.ts.
--
-- RLS follows the source_event_facts convention: service_role full access +
-- authenticated read, with a global-or-tenant-scoped read policy (a NULL
-- client_key row is the shared default guidebook for that stage, readable by
-- any authenticated user; a non-null client_key row is a tenant override,
-- gated by can_read_tenant_by_key).

CREATE TABLE IF NOT EXISTS source_stage_guidebooks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One of the 11 canonical Source stage keys (src/lib/source/constants.ts).
  stage_key         TEXT NOT NULL,
  -- NULL = global default guidebook for this stage. Non-null = tenant override.
  client_key        TEXT,
  title             TEXT NOT NULL,
  purpose           TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  -- 'draft' | 'published'. Only published guidebooks render in the product UI.
  status            TEXT NOT NULL DEFAULT 'draft',
  -- Ordered content blocks: [{ type, title, body, timeBoxMinutes }].
  -- type in ('purpose','agenda','facilitator_brief','worksheet',
  -- 'decision_capture','pre_mortem') -- enforced app-side (TS union), not by a
  -- DB constraint, so new section types don't require a migration.
  sections          JSONB NOT NULL DEFAULT '[]'::jsonb,
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT,
  updated_by        TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT source_stage_guidebooks_status_chk
    CHECK (status IN ('draft', 'published'))
);

-- Lookup path: render the published guidebook for (stage_key, tenant-or-global).
CREATE INDEX IF NOT EXISTS source_stage_guidebooks_stage_idx
  ON source_stage_guidebooks (stage_key, client_key, status);

ALTER TABLE source_stage_guidebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_stage_guidebooks"
  ON source_stage_guidebooks;
CREATE POLICY "service_role_all_source_stage_guidebooks"
  ON source_stage_guidebooks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_stage_guidebooks"
  ON source_stage_guidebooks;
CREATE POLICY "authenticated_read_source_stage_guidebooks"
  ON source_stage_guidebooks
  FOR SELECT TO authenticated
  USING (client_key IS NULL OR can_read_tenant_by_key(client_key));

GRANT SELECT ON source_stage_guidebooks TO authenticated;

COMMENT ON TABLE source_stage_guidebooks IS
  'Facilitator guide content for each Source stage-transition workshop/conversation. Source-native, parallel to (not shared with) the Moves workshop system. Global by default (client_key NULL). TS mirror src/lib/source/stage-guidebooks/types.ts.';
