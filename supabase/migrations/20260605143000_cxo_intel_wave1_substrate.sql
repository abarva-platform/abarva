-- Lakeshore L02 · CXO Intel loader Wave 1 substrate
--
-- Adds tenant-scoped CIO/CFO bundle landing tables. Rows preserve the full CSV
-- payload as JSONB while keeping upload provenance, validation, approval, and
-- transaction-grain RLS explicit.

BEGIN;

CREATE TABLE IF NOT EXISTS cxo_intel_upload_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  holding_group_id UUID,
  holdco_tenant_key TEXT NOT NULL,
  bundle_key TEXT NOT NULL CHECK (bundle_key IN ('cio', 'cfo', 'coo', 'chro', 'gc')),
  source_files TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  initiated_by_user_id TEXT NOT NULL,
  approval_owner_role TEXT NOT NULL,
  data_steward_role TEXT NOT NULL,
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'validated'
    CHECK (status IN ('validated', 'awaiting_approval', 'approved', 'committed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  committed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cxo_intel_upload_events_tenant_bundle
  ON cxo_intel_upload_events (tenant_key, holdco_tenant_key, bundle_key, created_at DESC);

ALTER TABLE cxo_intel_upload_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cxo_intel_upload_events'
      AND policyname = 'cxo_intel_upload_events_read_transaction_grain'
  ) THEN
    CREATE POLICY cxo_intel_upload_events_read_transaction_grain
      ON cxo_intel_upload_events
      FOR SELECT
      USING (can_read_transaction_grain_by_key(tenant_key));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cxo_intel_upload_events'
      AND policyname = 'cxo_intel_upload_events_write_own_tenant'
  ) THEN
    CREATE POLICY cxo_intel_upload_events_write_own_tenant
      ON cxo_intel_upload_events
      FOR ALL
      USING (can_approve_holding_group_spawn_by_key(tenant_key))
      WITH CHECK (can_approve_holding_group_spawn_by_key(tenant_key));
  END IF;
END $$;

DO $$
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'cxo_intel_app_inventory',
    'cxo_intel_cloud_footprint',
    'cxo_intel_vendor_contracts',
    'cxo_intel_ai_roadmap',
    'cxo_intel_it_spend_allocation',
    'cxo_intel_risk_register',
    'cxo_intel_it_org',
    'cxo_intel_finance_systems',
    'cxo_intel_banking_relationships',
    'cxo_intel_audit_advisory',
    'cxo_intel_insurance_program',
    'cxo_intel_close_cycle',
    'cxo_intel_it_spend_ratios',
    'cxo_intel_tax_engagements'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        tenant_key TEXT NOT NULL,
        holding_group_id UUID,
        holdco_tenant_key TEXT NOT NULL,
        upload_id UUID NOT NULL REFERENCES cxo_intel_upload_events(id) ON DELETE CASCADE,
        bundle_key TEXT NOT NULL CHECK (bundle_key IN (''cio'', ''cfo'')),
        source_file TEXT NOT NULL,
        source_row_number INTEGER NOT NULL CHECK (source_row_number >= 1),
        source_row_hash TEXT NOT NULL,
        row_payload JSONB NOT NULL DEFAULT ''{}''::jsonb,
        validation_status TEXT NOT NULL DEFAULT ''green''
          CHECK (validation_status IN (''green'', ''amber'', ''red'')),
        approval_status TEXT NOT NULL DEFAULT ''awaiting_approval''
          CHECK (approval_status IN (''awaiting_approval'', ''approved'', ''rejected'')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (tenant_key, source_file, source_row_hash)
      )',
      table_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I (tenant_key, holdco_tenant_key, created_at DESC)',
      'idx_' || table_name || '_tenant',
      table_name
    );

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = table_name || '_read_transaction_grain'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT USING (can_read_transaction_grain_by_key(tenant_key))',
        table_name || '_read_transaction_grain',
        table_name
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = table_name || '_write_own_tenant'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (can_approve_holding_group_spawn_by_key(tenant_key)) WITH CHECK (can_approve_holding_group_spawn_by_key(tenant_key))',
        table_name || '_write_own_tenant',
        table_name
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON TABLE cxo_intel_upload_events IS
  'Tenant-scoped upload event ledger for CXO Intel bundle validation, approval, and commit evidence.';

NOTIFY pgrst, 'reload schema';

COMMIT;
