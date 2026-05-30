-- Tower · ServiceNow ITSM records · slice S6.
-- Persists incident / problem / change records ingested from ServiceNow ITSM
-- so Atlas + the Tower MTTR / P1 / P2 read models can observe a real source.

BEGIN;

CREATE TABLE IF NOT EXISTS tower_itsm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  record_number TEXT NOT NULL,
  record_type TEXT NOT NULL
    CHECK (record_type IN ('incident', 'problem', 'change')),
  priority TEXT NOT NULL
    CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  service TEXT NOT NULL,
  assignment_group TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  mttr_minutes INTEGER,
  change_success BOOLEAN,
  source TEXT NOT NULL DEFAULT 'servicenow_itsm',
  source_file_id TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_itsm_records_closed_after_opened
    CHECK (closed_at IS NULL OR closed_at >= opened_at),
  CONSTRAINT tower_itsm_records_mttr_nonneg
    CHECK (mttr_minutes IS NULL OR mttr_minutes >= 0),
  CONSTRAINT tower_itsm_records_change_success_scope
    CHECK (change_success IS NULL OR record_type = 'change')
);

-- One row per (tenant, record_number) — re-ingesting the same export is a no-op
-- by upsert-on-conflict.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tower_itsm_records_tenant_number
  ON tower_itsm_records (tenant_key, record_number);

CREATE INDEX IF NOT EXISTS idx_tower_itsm_records_tenant_opened
  ON tower_itsm_records (tenant_key, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_tower_itsm_records_tenant_service_priority
  ON tower_itsm_records (tenant_key, service, priority);

CREATE INDEX IF NOT EXISTS idx_tower_itsm_records_tenant_type
  ON tower_itsm_records (tenant_key, record_type);

ALTER TABLE tower_itsm_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_itsm_records" ON tower_itsm_records;
CREATE POLICY "service_role_all_tower_itsm_records" ON tower_itsm_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
