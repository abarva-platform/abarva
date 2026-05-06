-- Source substrate · Wave 5 (F-M1-205)
-- source_value_lines: per-line state tracking for the value ledger
--
-- Design templates T07 (Value Realization) and T11 (Source Value Ledger) require
-- per-line persistence in the 4-state lifecycle: projected → committed → measuring →
-- realized. The earlier value_ledger artifact_family (20260502122500) treats the
-- ledger as a document; this table adds the row-level state substrate that backs
-- the dossier truth #7 discipline: realized value requires owner + evidence per line.

-- ── source_value_lines ────────────────────────────────────────────────────────

CREATE TABLE source_value_lines (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id           UUID        NOT NULL,   -- references engagements(id); loose FK
  label                TEXT        NOT NULL,
  category             TEXT,
  value_state          TEXT        NOT NULL DEFAULT 'projected'
    CHECK (value_state IN ('projected', 'committed', 'measuring', 'realized')),
  projected_amount     NUMERIC(15,2),
  committed_amount     NUMERIC(15,2),
  realized_amount      NUMERIC(15,2),
  value_unit           TEXT        NOT NULL DEFAULT 'usd'
    CHECK (value_unit IN ('usd', 'fte_hours', 'percentage', 'other')),
  measurement_owner_id UUID,                   -- references persons(id); loose FK
  evidence_artifact_id UUID,                   -- references source_artifacts(id); loose FK
  notes                TEXT,
  sort_order           INT         NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_source_value_lines_program
  ON source_value_lines (program_id, sort_order);

CREATE INDEX idx_source_value_lines_state
  ON source_value_lines (program_id, value_state);

CREATE INDEX idx_source_value_lines_owner
  ON source_value_lines (measurement_owner_id)
  WHERE measurement_owner_id IS NOT NULL;

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_source_value_lines_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER source_value_lines_updated_at
  BEFORE UPDATE ON source_value_lines
  FOR EACH ROW EXECUTE FUNCTION touch_source_value_lines_updated_at();

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON TABLE source_value_lines IS
  'Per-line value tracking for sourcing programs. '
  'Each row is one value hypothesis tracked through 4 lifecycle states: '
  'projected → committed → measuring → realized. '
  'evidence_artifact_id links to the source_artifacts row that substantiates realized state.';

COMMENT ON COLUMN source_value_lines.value_state IS
  '4-state value lifecycle per dossier truth #7. '
  'projected: initial estimate; committed: vendor committed; '
  'measuring: KPIs live; realized: measurement confirmed.';

COMMENT ON COLUMN source_value_lines.projected_amount IS
  'Estimated value at projected state. USD default; see value_unit for currency/unit.';

COMMENT ON COLUMN source_value_lines.realized_amount IS
  'Confirmed value measurement. Required to transition to realized state.';

COMMENT ON COLUMN source_value_lines.measurement_owner_id IS
  'Person accountable for measuring and reporting realized value. '
  'Required by dossier truth #7 for realized state.';

COMMENT ON COLUMN source_value_lines.evidence_artifact_id IS
  'Source artifact that substantiates the realized measurement. '
  'Typically a value_realization report or audit document.';

-- ── Row-level security ────────────────────────────────────────────────────────
-- Tenant resolution: source_value_lines.program_id → engagements.client_id →
-- can_read_tenant_by_id(). Matches gate_criteria RLS pattern.

ALTER TABLE source_value_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_value_lines" ON source_value_lines;
CREATE POLICY "service_role_all_source_value_lines"
  ON source_value_lines FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tenant_read_source_value_lines" ON source_value_lines;
CREATE POLICY "tenant_read_source_value_lines"
  ON source_value_lines FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = source_value_lines.program_id
        AND can_read_tenant_by_id(e.client_id)
    )
  );

DROP POLICY IF EXISTS "program_initiator_write_source_value_lines" ON source_value_lines;
CREATE POLICY "program_initiator_write_source_value_lines"
  ON source_value_lines FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = source_value_lines.program_id
        AND can_read_tenant_by_id(e.client_id)
    )
    AND is_program_initiator()
  );

DROP POLICY IF EXISTS "program_initiator_update_source_value_lines" ON source_value_lines;
CREATE POLICY "program_initiator_update_source_value_lines"
  ON source_value_lines FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = source_value_lines.program_id
        AND can_read_tenant_by_id(e.client_id)
    )
    AND is_program_initiator()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = source_value_lines.program_id
        AND can_read_tenant_by_id(e.client_id)
    )
    AND is_program_initiator()
  );

NOTIFY pgrst, 'reload schema';
