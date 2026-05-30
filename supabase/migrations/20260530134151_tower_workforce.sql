-- Tower ingest · Workday HCM workforce snapshot
--
-- Stores headcount/contractor/attrition rows pulled from a customer Workday
-- RAAS export (or our synthetic-pilot equivalent). The Tower workforce
-- aggregates (function mix, contractor ratio, attrition signals) read from
-- this table.
--
-- PII posture: this table holds workforce data classified as RESTRICTED in
-- the AbarVa data-class scheme. Synthetic-pilot rows use generator IDs
-- (EMP-NW-00001) only — no real names. For real customer ingests, Layer-2
-- redaction (name + email scrub) is required upstream before any row lands
-- here; this table is the boundary where restricted data becomes queryable.

BEGIN;

CREATE TABLE IF NOT EXISTS tower_workforce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- synthetic generator ID like EMP-NW-00001 or a hashed Workday worker ID
  -- after redaction. Never a raw Workday WID for real customer ingests.
  employee_id TEXT NOT NULL,
  function TEXT NOT NULL,
  sub_function TEXT,
  location TEXT,
  level TEXT,
  contractor_flag BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL,
  attrition_date DATE,
  attrition_reason TEXT,
  -- bookkeeping
  source_file_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Workday extract `as_of` date — what point in time this row represents.
  as_of_date DATE NOT NULL,
  data_class TEXT NOT NULL DEFAULT 'restricted'
    CHECK (data_class IN ('public','internal','confidential','restricted')),
  CONSTRAINT tower_workforce_attrition_ordering
    CHECK (attrition_date IS NULL OR attrition_date >= start_date),
  -- idempotency: re-running the same extract on the same as_of_date is a no-op.
  CONSTRAINT tower_workforce_unique_per_snapshot
    UNIQUE (client_id, employee_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_function
  ON tower_workforce(client_id, function);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_as_of
  ON tower_workforce(client_id, as_of_date DESC);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_attrition
  ON tower_workforce(client_id, attrition_date)
  WHERE attrition_date IS NOT NULL;

ALTER TABLE tower_workforce ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_workforce" ON tower_workforce;
CREATE POLICY "service_role_all_tower_workforce" ON tower_workforce
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE tower_workforce IS
  'Workday HCM workforce snapshot rows. data_class=restricted; PII must be redacted before insert (synthetic IDs only).';
COMMENT ON COLUMN tower_workforce.employee_id IS
  'Synthetic / redacted employee identifier. Never a raw Workday WID for real-customer ingests.';

NOTIFY pgrst, 'reload schema';

COMMIT;
