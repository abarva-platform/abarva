-- access_requests · inbound private-preview lead capture from the public marketing landing page.
--
-- Stores "Request access" form submissions from the signed-out landing page
-- (name, work email, company, role, company size, industry, org type, optional
-- initiative). These are inbound marketing leads, NOT client/tenant data, so there
-- is no tenant scoping. Inserts come from the public POST /api/request-access route
-- using the service-role write client; RLS denies everyone else by default.

CREATE TABLE IF NOT EXISTS access_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  company       TEXT NOT NULL,
  role          TEXT,
  company_size  TEXT,
  industry      TEXT,
  org_type      TEXT,        -- 'enterprise' (industry buyer) | 'si' (system integrator / advisory)
  initiative    TEXT,
  source        TEXT NOT NULL DEFAULT 'private-preview-landing',
  status        TEXT NOT NULL DEFAULT 'new',
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS access_requests_created_idx ON access_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS access_requests_email_idx   ON access_requests (email);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Only the service-role write client (the API route) may read/write. RLS denies
-- anon/authenticated by default — there is no permissive policy for them.
DROP POLICY IF EXISTS "service_role_all_access_requests" ON access_requests;
CREATE POLICY "service_role_all_access_requests"
  ON access_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE access_requests IS 'Inbound private-preview access requests from the public marketing landing page (leads, not tenant data).';
