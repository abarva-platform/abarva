-- AbarVa Three-Layer Data Model
-- Layer 1: Master Org Intelligence (permanent, governed)
-- Layer 2: Engagement Workspace (project-scoped, isolated)
-- Layer 3: AbarVa Intelligence / Transformation Genome (cross-client, anonymised)

-- ============================================================
-- LAYER 1: Master Org Intelligence
-- Approved org data: financials, technology inventory, leadership profiles, contracts
-- Immutable once approved — updated only via steward-approved promotion from Layer 2
-- ============================================================
CREATE TABLE IF NOT EXISTS org_master_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          TEXT NOT NULL,
  category        TEXT NOT NULL,  -- matches DataCategory enum
  sensitivity_tier INTEGER NOT NULL DEFAULT 1,  -- 1=standard, 2=sensitive, 3=restricted
  content         JSONB NOT NULL DEFAULT '{}',
  file_name       TEXT,
  file_size_bytes INTEGER,
  data_version    TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by     TEXT NOT NULL,
  approved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_master_data_org_id ON org_master_data(org_id);
CREATE INDEX IF NOT EXISTS idx_org_master_data_category ON org_master_data(category);
CREATE INDEX IF NOT EXISTS idx_org_master_data_org_category ON org_master_data(org_id, category);

-- ============================================================
-- LAYER 2: Engagement Workspace
-- Working data for active engagements: drafts, notes, negotiation strategies
-- Isolated per engagement — cross-engagement access prohibited
-- ============================================================
CREATE TABLE IF NOT EXISTS engagement_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   TEXT NOT NULL,
  org_id          TEXT NOT NULL,
  category        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'pending_promotion', 'promoted', 'rejected')),
  is_promotable   BOOLEAN NOT NULL DEFAULT false,  -- drafts/notes: false; approved roadmaps: true
  content         JSONB NOT NULL DEFAULT '{}',
  file_name       TEXT,
  file_size_bytes INTEGER,
  data_version    TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by     TEXT NOT NULL,
  promotion_requested_by TEXT,
  promotion_requested_at TIMESTAMPTZ,
  promotion_note  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_data_engagement_id ON engagement_data(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_data_org_id ON engagement_data(org_id);
CREATE INDEX IF NOT EXISTS idx_engagement_data_status ON engagement_data(status);

-- ============================================================
-- LAYER 3: AbarVa Intelligence / Transformation Genome
-- Patterns derived from real engagements, anonymised before storage
-- Never contains identifiable client data
-- Write-only via server-side functions, never via client
-- ============================================================
CREATE TABLE IF NOT EXISTS genome_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type    TEXT NOT NULL,  -- 'failure_pattern', 'success_pattern', 'vendor_performance', 'benchmark'
  vertical        TEXT NOT NULL,  -- 'healthcare', 'financial_services', 'retail', etc.
  sub_category    TEXT,
  data            JSONB NOT NULL DEFAULT '{}',
  source_count    INTEGER NOT NULL DEFAULT 1,  -- how many engagements this was derived from
  confidence      NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100 confidence score
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genome_patterns_type ON genome_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_genome_patterns_vertical ON genome_patterns(vertical);

-- ============================================================
-- AUDIT LOG
-- Every upload, view, promote, approve, revoke — stored for governance
-- ============================================================
CREATE TABLE IF NOT EXISTS data_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          TEXT NOT NULL,
  engagement_id   TEXT,
  user_id         TEXT NOT NULL,
  user_role       TEXT NOT NULL,
  action          TEXT NOT NULL,  -- 'upload', 'view', 'promote_request', 'approve', 'reject', 'revoke', 'access_grant'
  data_category   TEXT NOT NULL,
  data_record_id  UUID,
  layer           INTEGER,  -- 1, 2, or 3
  approved_by     TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON data_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON data_audit_log(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE org_master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE genome_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_log ENABLE ROW LEVEL SECURITY;

-- Idempotency guards: drop policies before recreating so re-runs (preview
-- branches across failed attempts) don't trip on "already exists".
DROP POLICY IF EXISTS "org_master_data_org_isolation" ON org_master_data;
DROP POLICY IF EXISTS "org_master_data_service_role_all" ON org_master_data;
DROP POLICY IF EXISTS "engagement_data_engagement_isolation" ON engagement_data;
DROP POLICY IF EXISTS "engagement_data_service_role_all" ON engagement_data;
DROP POLICY IF EXISTS "genome_patterns_read_all_authenticated" ON genome_patterns;
DROP POLICY IF EXISTS "audit_log_org_isolation" ON data_audit_log;

-- Layer 1: users see only their org's data
-- Sensitivity tier filtered by role (enforced at application layer via DATA_ACCESS_MATRIX)
CREATE POLICY "org_master_data_org_isolation"
  ON org_master_data FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

-- Maestro (service role) can see all orgs
CREATE POLICY "org_master_data_service_role_all"
  ON org_master_data FOR ALL
  USING (current_setting('app.current_role', true) = 'MAESTRO');

-- Layer 2: users see only engagements they are rostered on
CREATE POLICY "engagement_data_engagement_isolation"
  ON engagement_data FOR SELECT
  USING (
    engagement_id = ANY(
      string_to_array(current_setting('app.current_engagements', true), ',')
    )
  );

-- Maestro can see all engagement data
CREATE POLICY "engagement_data_service_role_all"
  ON engagement_data FOR ALL
  USING (current_setting('app.current_role', true) = 'MAESTRO');

-- Layer 3: read-only for all authenticated users, write-only via service role
CREATE POLICY "genome_patterns_read_all_authenticated"
  ON genome_patterns FOR SELECT
  USING (auth.role() = 'authenticated');

-- genome_patterns can only be written by service role (never client)
-- No INSERT/UPDATE/DELETE policy for authenticated users = blocked by default

-- Audit log: users see only their org's log
CREATE POLICY "audit_log_org_isolation"
  ON data_audit_log FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

-- ============================================================
-- HELPER: data_version tracking
-- Every org_master_data insert/update bumps a per-org version timestamp
-- Responses check their generation version against current — triggers refresh prompt
-- ============================================================
CREATE TABLE IF NOT EXISTS org_data_version (
  org_id          TEXT PRIMARY KEY,
  data_version    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION bump_org_data_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_data_version (org_id, data_version, updated_at)
  VALUES (NEW.org_id, now(), now())
  ON CONFLICT (org_id) DO UPDATE
    SET data_version = now(), updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bump_org_data_version_master ON org_master_data;
CREATE TRIGGER trigger_bump_org_data_version_master
  AFTER INSERT OR UPDATE ON org_master_data
  FOR EACH ROW EXECUTE FUNCTION bump_org_data_version();

DROP TRIGGER IF EXISTS trigger_bump_org_data_version_engagement ON engagement_data;
CREATE TRIGGER trigger_bump_org_data_version_engagement
  AFTER INSERT OR UPDATE ON engagement_data
  FOR EACH ROW EXECUTE FUNCTION bump_org_data_version();
