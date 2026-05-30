-- Tower · Program financials + vendor spend
--
-- Slice S9 (Oracle/SAP ERP ingest). Lands the schema the audit
-- (TOWER-MODULE-AUDIT-2026-05-22.md §4) called out as absent:
-- "Workday HCM / Oracle ERP / SAP / NetSuite — absent. No live ERP
-- read path." This migration is the *contract* — it does not pretend
-- there is a live extractor. Rows arrive via the CLI in
-- `src/scripts/tower/ingest-erp.ts` (CSV / XLSX extract from Oracle
-- GL/AP or SAP CO-PA, see README in public/templates/tower/erp/).
--
-- Two tables, both tenant-scoped, both linked to the Tower data-source
-- enum so provenance is preserved end-to-end.
--
-- Posture:
--   • client_id FK to clients, ON DELETE CASCADE.
--   • Service-role-only RLS (matches existing Tower tables in 022).
--   • Idempotency via natural-key uniques on (client_id, program_id,
--     period_start) for financials and (client_id, vendor_id) for
--     the vendor master. Re-running the CLI re-applies cleanly.
--   • Validators enforced at SQL: capex+opex ≤ actual, period dates
--     consistent, USD amounts non-negative.
--
-- Tower will surface confidential rollups behind redaction Layer 2
-- (see docs/architecture/ABARVA_DATA_PROTECTION_CONTROLS_2026-05-14.md).
-- Marker: dataClass = 'confidential' on the ingest registry entry.

BEGIN;

-- ── Vendor master ─────────────────────────────────────────────────────
-- Required FK target for tower_program_financials.vendor_id (when a
-- program ties to a specific vendor) and a standalone roll-up source
-- for "spend by vendor" lenses.
CREATE TABLE IF NOT EXISTS tower_vendor_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Natural key from the source ERP. Customer's own vendor master id.
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,

  -- Optional roll-up dimensions.
  cost_center TEXT,
  gl_account TEXT,

  -- Trailing-twelve-month vendor spend in USD. Optional — financials
  -- table is the source of truth, this is a cached lens.
  ttm_spend_usd NUMERIC(14,2),

  -- Provenance.
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  source_system TEXT CHECK (source_system IN ('oracle_gl_ap','sap_co_pa','manual_upload','other')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_vendor_spend_amount_nonneg
    CHECK (ttm_spend_usd IS NULL OR ttm_spend_usd >= 0),
  CONSTRAINT tower_vendor_spend_natural_key UNIQUE (client_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_tower_vendor_spend_client
  ON tower_vendor_spend(client_id);
CREATE INDEX IF NOT EXISTS idx_tower_vendor_spend_cost_center
  ON tower_vendor_spend(client_id, cost_center)
  WHERE cost_center IS NOT NULL;

DROP TRIGGER IF EXISTS tower_vendor_spend_set_updated_at ON tower_vendor_spend;
CREATE TRIGGER tower_vendor_spend_set_updated_at
  BEFORE UPDATE ON tower_vendor_spend
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Program financials ───────────────────────────────────────────────
-- One row per (program, period). Capex / opex split as separate columns
-- so Tower can render either lens without recomputing.
CREATE TABLE IF NOT EXISTS tower_program_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Customer's own program identifier (Oracle Project ID, SAP WBS,
  -- internal program code). Does not FK to engagements — ERP often
  -- carries programs that pre-date the AbarVa engagement row.
  program_id TEXT NOT NULL,

  -- Fiscal period the row covers. Half-open is fine — typical ERP
  -- extracts emit monthly buckets.
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Plan vs actual in USD. Nullable on plan side because some ERPs
  -- only carry actuals for in-flight programs.
  budget_usd NUMERIC(14,2),
  actual_usd NUMERIC(14,2),

  -- Capex / opex split.
  capex_usd NUMERIC(14,2),
  opex_usd NUMERIC(14,2),

  -- Optional vendor + roll-up dimensions for spend attribution.
  vendor_id TEXT,
  cost_center TEXT,
  gl_account TEXT,

  -- Provenance.
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  source_system TEXT CHECK (source_system IN ('oracle_gl_ap','sap_co_pa','manual_upload','other')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_pgm_fin_period_order
    CHECK (period_end >= period_start),
  CONSTRAINT tower_pgm_fin_budget_nonneg
    CHECK (budget_usd IS NULL OR budget_usd >= 0),
  CONSTRAINT tower_pgm_fin_actual_nonneg
    CHECK (actual_usd IS NULL OR actual_usd >= 0),
  CONSTRAINT tower_pgm_fin_capex_nonneg
    CHECK (capex_usd IS NULL OR capex_usd >= 0),
  CONSTRAINT tower_pgm_fin_opex_nonneg
    CHECK (opex_usd IS NULL OR opex_usd >= 0),
  -- Capex + opex cannot exceed actual (allow rounding wiggle 1 USD).
  CONSTRAINT tower_pgm_fin_capex_opex_bounded
    CHECK (
      actual_usd IS NULL
      OR capex_usd IS NULL
      OR opex_usd IS NULL
      OR (COALESCE(capex_usd, 0) + COALESCE(opex_usd, 0)) <= actual_usd + 1
    ),
  CONSTRAINT tower_pgm_fin_natural_key
    UNIQUE (client_id, program_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tower_pgm_fin_client
  ON tower_program_financials(client_id);
CREATE INDEX IF NOT EXISTS idx_tower_pgm_fin_program
  ON tower_program_financials(client_id, program_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_tower_pgm_fin_vendor
  ON tower_program_financials(client_id, vendor_id)
  WHERE vendor_id IS NOT NULL;

DROP TRIGGER IF EXISTS tower_program_financials_set_updated_at ON tower_program_financials;
CREATE TRIGGER tower_program_financials_set_updated_at
  BEFORE UPDATE ON tower_program_financials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
-- Service-role-only; consistent with the rest of the Tower data model
-- pending the per-user RLS rollout (Wave 5 in the audit follow-ups).
ALTER TABLE tower_vendor_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower_program_financials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tower_vendor_spend_service_role ON tower_vendor_spend;
CREATE POLICY tower_vendor_spend_service_role ON tower_vendor_spend
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS tower_program_financials_service_role ON tower_program_financials;
CREATE POLICY tower_program_financials_service_role ON tower_program_financials
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
