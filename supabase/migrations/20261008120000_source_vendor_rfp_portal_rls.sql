-- Source — row-level security for the vendor RFP portal tables.
--
-- `20260925090000_source_vendor_rfp_portal.sql` creates four tables, each one
-- denormalising `tenant_key` with the comment "for RLS without a join per row
-- check", and then enables no row-level security and declares no policy. The
-- intent is in that comment; this file is the part that was missing. Four
-- migrations of the same vintage carry 1, 3, 2 and 3 enable statements, so the
-- omission was a gap and not a house convention.
--
-- WHAT THIS DOES AND DOES NOT FENCE. Read this before trusting it.
--
-- A competing vendor is not a Clerk user and has no database identity. Their
-- requests are served by the application over the write connection, which is
-- `service_role`. RLS therefore CANNOT be the fence that keeps one vendor out
-- of another vendor's row, because every vendor request arrives as the role
-- that policy below grants in full.
--
-- The vendor-to-vendor fence is in the application and stays there: every read
-- in `src/lib/source/vendor-portal/dao.ts` is bounded by a `vendor_id` taken
-- only from a verified session, or by a session-token hash joined to one
-- `source_event_id`, or - for sign-in alone, where no vendor is yet known - by
-- `(source_event_id, username)` with a password verification. That contract is
-- pinned by `dao-fence.test.ts`, which fails when a statement in that module
-- addresses a portal table without one of those bounds.
--
-- What RLS adds here is the OTHER direction, which today has no control at all:
-- an authenticated reader inside tenant A must not read tenant B's vendor
-- rows, credentials, activity or submissions. That is what the tenant policies
-- below do, and it is defence in depth rather than the primary fence.
--
-- Naming: these tables carry `tenant_key`; `source_events` carries
-- `client_key`. The existence check below joins the two deliberately, so a row
-- whose denormalised key disagrees with its event's key is readable by
-- neither tenant.

BEGIN;

-- ── source_event_vendors ─────────────────────────────────────────────────────
ALTER TABLE source_event_vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_vendors"
  ON source_event_vendors;
CREATE POLICY "service_role_full_source_event_vendors"
  ON source_event_vendors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Deliberately NOT granted to `authenticated`: the row carries `password_hash`
-- and `password_salt`. A tenant reader has no reason to select a credential,
-- and column-level grants are the wrong tool for a table whose every row is a
-- secret. Tenant-side reads of vendor identity belong on a view that excludes
-- those columns, which is a separate change.
DROP POLICY IF EXISTS "tenant_read_source_event_vendors"
  ON source_event_vendors;

-- ── source_event_vendor_sessions ─────────────────────────────────────────────
ALTER TABLE source_event_vendor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_vendor_sessions"
  ON source_event_vendor_sessions;
CREATE POLICY "service_role_full_source_event_vendor_sessions"
  ON source_event_vendor_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- No tenant policy. A session row is a bearer-token hash; nobody but the
-- application has a reason to read one.
DROP POLICY IF EXISTS "tenant_read_source_event_vendor_sessions"
  ON source_event_vendor_sessions;

-- ── source_event_vendor_events ───────────────────────────────────────────────
ALTER TABLE source_event_vendor_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_vendor_events"
  ON source_event_vendor_events;
CREATE POLICY "service_role_full_source_event_vendor_events"
  ON source_event_vendor_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- A policy's USING clause is evaluated with the CALLER's privileges, so a
-- subquery that reads another table requires the caller to hold SELECT on it.
-- The activity row reaches its event only through `source_event_vendors`, and
-- `authenticated` must never hold SELECT on that table because every row of it
-- is a credential. Without this helper the policy below is unsatisfiable: it
-- raises "permission denied for table source_event_vendors" for every
-- authenticated reader. That was found by running the migration against a
-- disposable database, not by reading it.
--
-- SECURITY DEFINER runs the check as this function's owner. It returns a
-- boolean and never a row, so it discloses nothing beyond the answer. The
-- search_path is pinned because a SECURITY DEFINER function without one is
-- hijackable by a caller-controlled schema.
CREATE OR REPLACE FUNCTION vendor_portal_activity_in_tenant(
  p_vendor_id UUID,
  p_tenant_key TEXT
) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM source_event_vendors v
    JOIN source_events se ON se.id = v.source_event_id
    WHERE v.id = p_vendor_id
      AND v.tenant_key = p_tenant_key
      AND se.client_key = p_tenant_key
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION vendor_portal_activity_in_tenant(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vendor_portal_activity_in_tenant(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION vendor_portal_activity_in_tenant(UUID, TEXT) TO service_role;

DROP POLICY IF EXISTS "tenant_read_source_event_vendor_events"
  ON source_event_vendor_events;
CREATE POLICY "tenant_read_source_event_vendor_events"
  ON source_event_vendor_events
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(tenant_key)
    AND vendor_portal_activity_in_tenant(
      source_event_vendor_events.vendor_id,
      source_event_vendor_events.tenant_key
    )
  );

GRANT SELECT ON source_event_vendor_events TO authenticated;

-- ── source_event_vendor_submissions ──────────────────────────────────────────
ALTER TABLE source_event_vendor_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_vendor_submissions"
  ON source_event_vendor_submissions;
CREATE POLICY "service_role_full_source_event_vendor_submissions"
  ON source_event_vendor_submissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "tenant_read_source_event_vendor_submissions"
  ON source_event_vendor_submissions;
CREATE POLICY "tenant_read_source_event_vendor_submissions"
  ON source_event_vendor_submissions
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(tenant_key)
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_vendor_submissions.source_event_id
        AND se.client_key = source_event_vendor_submissions.tenant_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_event_vendor_submissions TO authenticated;

GRANT SELECT, INSERT, UPDATE ON source_event_vendors TO service_role;
GRANT SELECT, INSERT, UPDATE ON source_event_vendor_sessions TO service_role;
GRANT SELECT, INSERT ON source_event_vendor_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON source_event_vendor_submissions TO service_role;

COMMIT;
