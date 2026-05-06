-- Phase 5 · Step 2 · Source tables — per-user read policies
--
-- Adds authenticated-role SELECT policies to all 13 Source tables.
-- Service-role policies are preserved (service_role bypasses RLS in
-- Supabase anyway; explicit policies here document the intent).
--
-- Pattern (text-key tables):
--   USING ( can_read_tenant_by_key(<col>) )
--   ↳ col = current_tenant_key() OR is_maestro()
--
-- Pattern (join-key table: source_event_approvals has no direct tenant col):
--   USING ( EXISTS (SELECT 1 FROM source_events se WHERE se.id = event_id
--                   AND can_read_tenant_by_key(se.client_key)) )
--
-- PREREQUISITE: 20260507100000_rls_role_helpers.sql must be applied first
-- (adds can_read_tenant_by_key helper and clients.tenant_key column).
--
-- Write policies (INSERT/UPDATE/DELETE) are handled separately in Step 5.
-- This migration is read-only to keep the rollout incremental and reversible.

BEGIN;

-- ── source_events ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_events" ON source_events;
CREATE POLICY "authenticated_read_source_events" ON source_events
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(client_key) );

GRANT SELECT ON source_events TO authenticated;


-- ── source_event_approvals ─────────────────────────────────────────────────
-- No direct tenant column; joins to parent source_events.
DROP POLICY IF EXISTS "authenticated_read_source_event_approvals" ON source_event_approvals;
CREATE POLICY "authenticated_read_source_event_approvals" ON source_event_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM source_events se
      WHERE se.id = source_event_approvals.event_id
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_event_approvals TO authenticated;


-- ── source_event_participants ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_event_participants" ON source_event_participants;
CREATE POLICY "authenticated_read_source_event_participants" ON source_event_participants
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(client_key) );

GRANT SELECT ON source_event_participants TO authenticated;


-- ── source_artifacts ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_artifacts" ON source_artifacts;
CREATE POLICY "authenticated_read_source_artifacts" ON source_artifacts
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(tenant_key)
    AND deleted_at IS NULL  -- soft-deleted artifacts not readable
  );

GRANT SELECT ON source_artifacts TO authenticated;


-- ── source_artifact_chunks ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_artifact_chunks" ON source_artifact_chunks;
CREATE POLICY "authenticated_read_source_artifact_chunks" ON source_artifact_chunks
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_artifact_chunks TO authenticated;


-- ── source_artifact_facts ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_artifact_facts" ON source_artifact_facts;
CREATE POLICY "authenticated_read_source_artifact_facts" ON source_artifact_facts
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_artifact_facts TO authenticated;


-- ── source_pricing_components ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_pricing_components" ON source_pricing_components;
CREATE POLICY "authenticated_read_source_pricing_components" ON source_pricing_components
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_pricing_components TO authenticated;


-- ── source_commercial_exceptions ──────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_commercial_exceptions" ON source_commercial_exceptions;
CREATE POLICY "authenticated_read_source_commercial_exceptions" ON source_commercial_exceptions
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_commercial_exceptions TO authenticated;


-- ── source_vendor_commitments ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_vendor_commitments" ON source_vendor_commitments;
CREATE POLICY "authenticated_read_source_vendor_commitments" ON source_vendor_commitments
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_vendor_commitments TO authenticated;


-- ── source_requirements ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_requirements" ON source_requirements;
CREATE POLICY "authenticated_read_source_requirements" ON source_requirements
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_requirements TO authenticated;


-- ── source_meeting_outcomes ───────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_meeting_outcomes" ON source_meeting_outcomes;
CREATE POLICY "authenticated_read_source_meeting_outcomes" ON source_meeting_outcomes
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_meeting_outcomes TO authenticated;


-- ── source_graph_edges ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_graph_edges" ON source_graph_edges;
CREATE POLICY "authenticated_read_source_graph_edges" ON source_graph_edges
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_graph_edges TO authenticated;


-- ── source_context_receipts ───────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_source_context_receipts" ON source_context_receipts;
CREATE POLICY "authenticated_read_source_context_receipts" ON source_context_receipts
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON source_context_receipts TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
