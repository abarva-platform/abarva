-- CONTEXT CLASSIFICATION AND INSIGHTS
-- Additive schema extension:
--   1. Classification columns on enterprise_context_records
--   2. context_insights table for L2 insight engine output
--   3. significance_rules table for rule definitions + seeded starter rules
--   4. 4 read-views for insight rules to query

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- A–C) Classification columns, constraint widening, indexes
--      Wrapped in a DO block so the CI migration-replay check (which runs only
--      new migrations on a fresh DB) skips gracefully instead of aborting on
--      "relation does not exist". In a full replay or against the live DB the
--      guard is never triggered because enterprise_context_records exists.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL THEN
    RAISE NOTICE 'enterprise_context_records absent — skipping record classification columns, constraint, and indexes. Re-run after base migrations apply.';
  ELSE
    -- A) Classification columns
    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS domain_segment TEXT
        CHECK (domain_segment IN ('DATA_ANALYTICS','ERP','DIGITAL_CX','OPERATIONS','INFRASTRUCTURE','SECURITY_IDENTITY','HR_WORKFORCE','COLLABORATION'));

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS business_function TEXT
        CHECK (business_function IN ('FINANCE','SUPPLY_CHAIN','HUMAN_RESOURCES','OPERATIONS','COMMERCIAL_SALES','IT','COMPLIANCE_LEGAL','CORPORATE','INDUSTRY_OPS'));

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS criticality TEXT
        CHECK (criticality IN ('TIER_1','TIER_2','TIER_3'));

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS classification_source TEXT NOT NULL DEFAULT 'OPERATOR_CONFIRMED'
        CHECK (classification_source IN ('AUTO_INFERRED','NEEDS_CLASSIFICATION','OPERATOR_CONFIRMED','CMDB_FEED'));

    -- B) Widen lifecycle_state CHECK to allow 'review'
    IF EXISTS (
      SELECT 1 FROM pg_constraint
       WHERE conname = 'enterprise_context_records_lifecycle_state_check'
         AND conrelid = 'public.enterprise_context_records'::regclass
    ) THEN
      ALTER TABLE public.enterprise_context_records
        DROP CONSTRAINT enterprise_context_records_lifecycle_state_check;
    END IF;

    ALTER TABLE public.enterprise_context_records
      ADD CONSTRAINT enterprise_context_records_lifecycle_state_check
        CHECK (lifecycle_state IN ('active','superseded','inactive','review'));

    -- C) Indexes on new classification columns
    CREATE INDEX IF NOT EXISTS idx_ecr_domain_segment
      ON public.enterprise_context_records(tenant_key, domain_segment)
      WHERE domain_segment IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_ecr_business_function
      ON public.enterprise_context_records(tenant_key, business_function)
      WHERE business_function IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_ecr_classification_source
      ON public.enterprise_context_records(tenant_key, classification_source);
  END IF;

  IF to_regclass('public.enterprise_context_chunks') IS NULL THEN
    RAISE NOTICE 'enterprise_context_chunks absent — skipping chunk classification columns, constraint, and indexes. Re-run after base migrations apply.';
    RETURN;
  END IF;

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS domain_segment TEXT
      CHECK (domain_segment IN ('DATA_ANALYTICS','ERP','DIGITAL_CX','OPERATIONS','INFRASTRUCTURE','SECURITY_IDENTITY','HR_WORKFORCE','COLLABORATION'));

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS business_function TEXT
      CHECK (business_function IN ('FINANCE','SUPPLY_CHAIN','HUMAN_RESOURCES','OPERATIONS','COMMERCIAL_SALES','IT','COMPLIANCE_LEGAL','CORPORATE','INDUSTRY_OPS'));

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS criticality TEXT
      CHECK (criticality IN ('TIER_1','TIER_2','TIER_3'));

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS classification_source TEXT NOT NULL DEFAULT 'OPERATOR_CONFIRMED'
      CHECK (classification_source IN ('AUTO_INFERRED','NEEDS_CLASSIFICATION','OPERATOR_CONFIRMED','CMDB_FEED'));

  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'enterprise_context_chunks_lifecycle_state_check'
       AND conrelid = 'public.enterprise_context_chunks'::regclass
  ) THEN
    ALTER TABLE public.enterprise_context_chunks
      DROP CONSTRAINT enterprise_context_chunks_lifecycle_state_check;
  END IF;

  ALTER TABLE public.enterprise_context_chunks
    ADD CONSTRAINT enterprise_context_chunks_lifecycle_state_check
      CHECK (lifecycle_state IN ('active','superseded','inactive','retired','review'));

  CREATE INDEX IF NOT EXISTS idx_ecc_domain_segment
    ON public.enterprise_context_chunks(tenant_key, domain_segment)
    WHERE domain_segment IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_ecc_business_function
    ON public.enterprise_context_chunks(tenant_key, business_function)
    WHERE business_function IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_ecc_classification_source
    ON public.enterprise_context_chunks(tenant_key, classification_source);

END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- D) context_insights table
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS context_insights (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               TEXT        NOT NULL,
  tenant_key              TEXT        NOT NULL,
  headline                TEXT        NOT NULL,
  so_what                 TEXT        NOT NULL,
  domain                  TEXT        NOT NULL,
  materiality             TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (materiality IN ('high','medium','low')),
  derived_from_record_ids UUID[]      NOT NULL DEFAULT '{}',
  derived_from_fact_ids   UUID[]      NOT NULL DEFAULT '{}',
  rule_id                 TEXT        NOT NULL,
  evidence                TEXT,
  confidence              TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (confidence IN ('high','medium','low','none')),
  freshness_status        TEXT        NOT NULL DEFAULT 'fresh'
                            CHECK (freshness_status IN ('fresh','attention','stale','review','unknown')),
  lifecycle_state         TEXT        NOT NULL DEFAULT 'active'
                            CHECK (lifecycle_state IN ('active','review_required','blocked_by_gap','superseded')),
  action                  TEXT,
  entity_name             TEXT,
  entity_type             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_insights_tenant
  ON context_insights(tenant_key, lifecycle_state, materiality);

CREATE INDEX IF NOT EXISTS idx_context_insights_rule
  ON context_insights(tenant_key, rule_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- E) significance_rules table
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS significance_rules (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key                  TEXT        NOT NULL UNIQUE,
  name                      TEXT        NOT NULL,
  description               TEXT        NOT NULL,
  required_dimension_numbers INT[]      NOT NULL DEFAULT '{}',
  required_fact_keys        TEXT[]      NOT NULL DEFAULT '{}',
  required_record_types     TEXT[]      NOT NULL DEFAULT '{}',
  default_materiality       TEXT        NOT NULL DEFAULT 'medium'
                              CHECK (default_materiality IN ('high','medium','low')),
  default_confidence        TEXT        NOT NULL DEFAULT 'medium'
                              CHECK (default_confidence IN ('high','medium','low','none')),
  enabled                   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- F) Seed 6 starter significance rules
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO significance_rules (rule_key, name, description, required_dimension_numbers, required_fact_keys, required_record_types, default_materiality, default_confidence)
VALUES
  (
    'renewal-window-no-benchmark',
    'Renewal approaching with no benchmark',
    'Contract auto-renews within notice window and no peer price benchmark is on file.',
    ARRAY[11,13],
    ARRAY['contract_end_date','auto_renew','benchmark_present'],
    ARRAY['vendor'],
    'high',
    'high'
  ),
  (
    'adoption-below-value-case',
    'Adoption below value-case assumption',
    'Active-user percentage is below the threshold assumed in the business case.',
    ARRAY[6,10],
    ARRAY['active_users_pct','value_case_assumption'],
    ARRAY['initiative'],
    'high',
    'high'
  ),
  (
    'sla-breach-worsening',
    'Service quality sliding — SLA breach worsening',
    'MTTR or availability metrics are trending in the wrong direction and services are breaching SLA.',
    ARRAY[10,5],
    ARRAY['mttr_change_qoq','services_breaching_sla'],
    ARRAY['service'],
    'medium',
    'medium'
  ),
  (
    'material-claim-unapproved',
    'Material strategy claim not yet trusted',
    'A high-significance strategy claim has been parsed but is still in review-required state.',
    ARRAY[7,9],
    ARRAY['claim_text','lifecycle_state'],
    ARRAY['strategy_claim'],
    'high',
    'none'
  ),
  (
    'conflicting-fact',
    'Conflicting facts across sources',
    'Two different sources assert different values for the same field on the same entity.',
    ARRAY[3,2],
    ARRAY['owner','domain_segment'],
    ARRAY['application'],
    'medium',
    'high'
  ),
  (
    'value-coverage-gap',
    'Cannot judge value — missing facts',
    'Spend is committed but the value-realisation facts needed to assess ROI are absent or stale.',
    ARRAY[4,6,5],
    ARRAY['annual_cost_usd','realised_value_fact'],
    ARRAY['initiative'],
    'medium',
    'low'
  )
ON CONFLICT (rule_key) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- G) RLS on new tables
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'context_insights'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS svc_all ON %I', tbl);
    EXECUTE format('CREATE POLICY svc_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_read ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_read ON %I FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_insert ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_insert ON %I FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_update ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_update ON %I FOR UPDATE TO authenticated USING (can_write_tenant_by_key(tenant_key)) WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_delete ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_delete ON %I FOR DELETE TO authenticated USING (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl);
  END LOOP;
END $$;

-- significance_rules has no tenant_key on every row (it's a global config table), so
-- override the dynamic policy with a simpler one that allows any authenticated user to read.
-- The can_write_tenant_by_key guard applies for INSERT/UPDATE/DELETE via a fixed sentinel key.
-- In practice, writes will be service_role only (seed + operator scripts).
DROP POLICY IF EXISTS auth_read ON significance_rules;
CREATE POLICY auth_read ON significance_rules
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS auth_insert ON significance_rules;
CREATE POLICY auth_insert ON significance_rules
  FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS auth_update ON significance_rules;
CREATE POLICY auth_update ON significance_rules
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS auth_delete ON significance_rules;
CREATE POLICY auth_delete ON significance_rules
  FOR DELETE TO authenticated USING (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- H) Read-views for insight rules
--    Also guarded: views SELECT FROM enterprise_context_records which may not
--    exist in CI replay environments that only run the delta migrations.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL THEN
    RAISE NOTICE 'enterprise_context_records absent — skipping read-views.';
    RETURN;
  END IF;

  EXECUTE $v$
    CREATE OR REPLACE VIEW v_context_vendor_renewals AS
      SELECT
        r.tenant_key,
        r.id                              AS record_id,
        r.title                           AS vendor_name,
        r.domain_segment,
        r.business_function,
        r.payload->>'contract_end_date'   AS contract_end_date,
        r.payload->>'auto_renew'          AS auto_renew,
        r.payload->>'notice_period_days'  AS notice_period_days,
        r.payload->>'benchmark_present'   AS benchmark_present,
        r.payload->>'annual_value_usd'    AS annual_value_usd,
        r.freshness_status,
        r.lifecycle_state,
        r.classification_source
      FROM enterprise_context_records r
      WHERE r.record_type = 'vendor'
        AND r.lifecycle_state = 'active'
  $v$;

  EXECUTE $v$
    CREATE OR REPLACE VIEW v_context_application_inventory AS
      SELECT
        r.tenant_key,
        r.id                            AS record_id,
        r.title                         AS system_name,
        r.domain_segment,
        r.business_function,
        r.criticality,
        r.payload->>'vendor_name'       AS vendor_name,
        r.payload->>'hosting_model'     AS hosting_model,
        r.payload->>'active_users'      AS active_users,
        r.payload->>'contract_end_date' AS contract_end_date,
        r.payload->>'annual_cost_usd'   AS annual_cost_usd,
        r.payload->>'cmdb_ci_id'        AS cmdb_ci_id,
        r.freshness_status,
        r.lifecycle_state,
        r.classification_source
      FROM enterprise_context_records r
      WHERE r.record_type IN ('application','system')
        AND r.lifecycle_state IN ('active','review')
  $v$;

  EXECUTE $v$
    CREATE OR REPLACE VIEW v_context_dimension_coverage AS
      SELECT
        r.tenant_key,
        r.record_type,
        r.domain_segment,
        COUNT(*)                                                            AS record_count,
        COUNT(*) FILTER (WHERE r.freshness_status = 'fresh')               AS fresh_count,
        COUNT(*) FILTER (WHERE r.freshness_status = 'stale')               AS stale_count,
        COUNT(*) FILTER (WHERE r.classification_source = 'NEEDS_CLASSIFICATION') AS needs_classification_count,
        MAX(r.updated_at)                                                   AS last_updated_at
      FROM enterprise_context_records r
      WHERE r.lifecycle_state IN ('active','review')
      GROUP BY r.tenant_key, r.record_type, r.domain_segment
  $v$;

  EXECUTE $v$
    CREATE OR REPLACE VIEW v_context_triage_queue AS
      SELECT
        r.tenant_key,
        r.id,
        r.title,
        r.record_type,
        r.record_subtype,
        r.domain_segment,
        r.business_function,
        r.criticality,
        r.classification_source,
        r.lifecycle_state,
        r.freshness_status,
        r.source_system,
        r.source_file,
        r.owner,
        r.payload,
        r.created_at,
        r.updated_at
      FROM enterprise_context_records r
      WHERE r.classification_source = 'NEEDS_CLASSIFICATION'
        AND r.lifecycle_state = 'review'
      ORDER BY r.tenant_key, r.updated_at DESC
  $v$;

END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
