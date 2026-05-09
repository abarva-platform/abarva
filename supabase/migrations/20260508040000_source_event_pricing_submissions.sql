-- Source · per-event vendor pricing submissions
--
-- Stores parsed vendor xlsx submissions for the d19 Pricing Workbook.
-- Each row represents one vendor's filled-in copy of the d19a template.
-- Multiple submissions per event are expected (one per vendor); revisions
-- supersede prior submissions via `superseded_by`.
--
-- Slice 2c.2 schema. The upload route parses the xlsx server-side using
-- ExcelJS and writes a structured row here. The d19c comparison renderer
-- reads from this table; demo-mode synthesis is only a fallback when
-- zero submissions exist.
--
-- Tenant scoping: client_key is denormalized for RLS speed (mirrors the
-- pattern from source_event_artifact_states). RLS uses
-- can_read_tenant_by_key().

BEGIN;

CREATE TABLE IF NOT EXISTS source_event_pricing_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id       UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  -- Denormalized for RLS performance (avoids a join per row check).
  tenant_key            TEXT NOT NULL,
  -- Vendor display name. Pulled from the Cover sheet's "Vendor name" cell
  -- on parse; user-overridable on the upload route.
  vendor_name           TEXT NOT NULL,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Clerk user id of whoever uploaded. Optional — admin imports may have
  -- no user context.
  uploaded_by_user_id   TEXT,
  -- Original filename for audit / debugging.
  uploaded_filename     TEXT,

  -- Parsed payload. Maps line item id → numeric unit price (USD).
  unit_prices_by_id     JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Optional per-line vendor notes (line item id → free-form string).
  vendor_notes_by_id    JSONB DEFAULT '{}'::jsonb,
  -- Free-form pricing notes (Sheet 5 of the template).
  pricing_notes         TEXT DEFAULT '',
  -- Structured assumption deviations the vendor flagged. Array of
  -- { assumptionKey, proposedAlternative, severity }.
  assumption_deviations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Parser status: 'parsed' (full success), 'partial' (some fields missing
  -- or unrecognized), 'failed' (parse aborted; row exists for audit).
  parse_status          TEXT NOT NULL DEFAULT 'parsed'
                        CHECK (parse_status IN ('parsed', 'partial', 'failed')),
  -- Array of { code, message } parser warnings — surfaced to the buyer
  -- in the UI when they review a submission.
  parse_warnings        JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Revision chain. When a vendor uploads a corrected file the prior row
  -- gets superseded_by set to the new row's id; queries filter out
  -- superseded rows by default.
  superseded_by         UUID REFERENCES source_event_pricing_submissions(id),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_event_pricing_submissions_event
  ON source_event_pricing_submissions (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_pricing_submissions_event_vendor
  ON source_event_pricing_submissions (source_event_id, vendor_name);
CREATE INDEX IF NOT EXISTS idx_source_event_pricing_submissions_tenant
  ON source_event_pricing_submissions (tenant_key);
-- Active (non-superseded) submissions per event — the comparison renderer's
-- hot path. Partial index keeps it small.
CREATE INDEX IF NOT EXISTS idx_source_event_pricing_submissions_active
  ON source_event_pricing_submissions (source_event_id, vendor_name)
  WHERE superseded_by IS NULL;

COMMENT ON TABLE source_event_pricing_submissions IS
  'Per-event vendor pricing submissions parsed from uploaded d19a xlsx '
  'files. Read by the d19c comparison renderer (Slice 2c.2+). One row per '
  'vendor submission; revisions chain via superseded_by.';

-- ── Row-level security ─────────────────────────────────────────────────────
ALTER TABLE source_event_pricing_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_pricing_submissions"
  ON source_event_pricing_submissions;
CREATE POLICY "service_role_all_source_event_pricing_submissions"
  ON source_event_pricing_submissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_pricing_submissions"
  ON source_event_pricing_submissions;
CREATE POLICY "authenticated_read_source_event_pricing_submissions"
  ON source_event_pricing_submissions
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_insert_source_event_pricing_submissions"
  ON source_event_pricing_submissions;
CREATE POLICY "authenticated_insert_source_event_pricing_submissions"
  ON source_event_pricing_submissions
  FOR INSERT TO authenticated
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_update_source_event_pricing_submissions"
  ON source_event_pricing_submissions;
CREATE POLICY "authenticated_update_source_event_pricing_submissions"
  ON source_event_pricing_submissions
  FOR UPDATE TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) )
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_delete_source_event_pricing_submissions"
  ON source_event_pricing_submissions;
CREATE POLICY "authenticated_delete_source_event_pricing_submissions"
  ON source_event_pricing_submissions
  FOR DELETE TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

COMMIT;
