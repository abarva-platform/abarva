-- Phase 5 · Step 5 · Write policies (INSERT, UPDATE, DELETE)
--
-- Adds INSERT, UPDATE, DELETE policies for authenticated users. Writes are
-- stricter than reads — they require admin-level roles or ownership.
--
-- Write policy rules:
--   Source events/artifacts: tenant_admin or program_initiator (within tenant)
--   Admin tables: tenant_admin or maestro only
--   Tower/Intelligence: system-managed (service_role only; block authenticated writes)
--   source_event_approvals: tenant_admin only (approval is gated)
--
-- Design: Atlas/agent observations and Tower use_case data are written by
-- the agent orchestrator via service_role. Blocking authenticated writes
-- on these tables is correct and intentional. If a future client UI needs
-- to write them, add a scoped policy at that time.
--
-- PREREQUISITE: Steps 1-4 must be applied first.

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- SOURCE TABLES · INSERT/UPDATE/DELETE
-- ════════════════════════════════════════════════════════════════════════════

-- source_events: tenant_admin can write; program_initiator can create events
DROP POLICY IF EXISTS "authenticated_insert_source_events" ON source_events;
CREATE POLICY "authenticated_insert_source_events" ON source_events
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_key(client_key)
    AND is_program_initiator()
  );

DROP POLICY IF EXISTS "authenticated_update_source_events" ON source_events;
CREATE POLICY "authenticated_update_source_events" ON source_events
  FOR UPDATE TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND is_program_initiator()
  )
  WITH CHECK (
    can_read_tenant_by_key(client_key)
    AND is_program_initiator()
  );

-- DELETE blocked for all authenticated users; use lifecycle_state instead.
DROP POLICY IF EXISTS "block_delete_source_events" ON source_events;
CREATE POLICY "block_delete_source_events" ON source_events
  FOR DELETE TO authenticated
  USING (false);

GRANT INSERT, UPDATE ON source_events TO authenticated;


-- source_event_approvals: only tenant_admin can approve
DROP POLICY IF EXISTS "authenticated_insert_source_event_approvals" ON source_event_approvals;
CREATE POLICY "authenticated_insert_source_event_approvals" ON source_event_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM source_events se
      WHERE se.id = source_event_approvals.event_id
        AND can_read_tenant_by_key(se.client_key)
    )
    AND is_tenant_admin()
    AND approved_by_user_id = current_user_id()
  );

-- Approvals are immutable (no UPDATE/DELETE for authenticated).
DROP POLICY IF EXISTS "block_update_source_event_approvals" ON source_event_approvals;
CREATE POLICY "block_update_source_event_approvals" ON source_event_approvals
  FOR UPDATE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "block_delete_source_event_approvals" ON source_event_approvals;
CREATE POLICY "block_delete_source_event_approvals" ON source_event_approvals
  FOR DELETE TO authenticated
  USING (false);

GRANT INSERT ON source_event_approvals TO authenticated;


-- source_event_participants: tenant_admin can manage participants
DROP POLICY IF EXISTS "authenticated_insert_source_event_participants" ON source_event_participants;
CREATE POLICY "authenticated_insert_source_event_participants" ON source_event_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_key(client_key)
    AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "authenticated_update_source_event_participants" ON source_event_participants;
CREATE POLICY "authenticated_update_source_event_participants" ON source_event_participants
  FOR UPDATE TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_key(client_key)
    AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "authenticated_delete_source_event_participants" ON source_event_participants;
CREATE POLICY "authenticated_delete_source_event_participants" ON source_event_participants
  FOR DELETE TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON source_event_participants TO authenticated;


-- source_artifacts: program_initiator can upload; tenant_admin can manage all
DROP POLICY IF EXISTS "authenticated_insert_source_artifacts" ON source_artifacts;
CREATE POLICY "authenticated_insert_source_artifacts" ON source_artifacts
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_key(tenant_key)
    AND is_program_initiator()
    AND uploader_user_id = current_user_id()
  );

DROP POLICY IF EXISTS "authenticated_update_source_artifacts" ON source_artifacts;
CREATE POLICY "authenticated_update_source_artifacts" ON source_artifacts
  FOR UPDATE TO authenticated
  USING (
    can_read_tenant_by_key(tenant_key)
    AND is_program_initiator()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    can_read_tenant_by_key(tenant_key)
    AND is_program_initiator()
  );

-- Soft-delete only: authenticated users can set deleted_at but cannot hard-delete.
DROP POLICY IF EXISTS "block_hard_delete_source_artifacts" ON source_artifacts;
CREATE POLICY "block_hard_delete_source_artifacts" ON source_artifacts
  FOR DELETE TO authenticated
  USING (false);

GRANT INSERT, UPDATE ON source_artifacts TO authenticated;


-- source_context_receipts: program_initiator can insert (agent output persisted by user action)
DROP POLICY IF EXISTS "authenticated_insert_source_context_receipts" ON source_context_receipts;
CREATE POLICY "authenticated_insert_source_context_receipts" ON source_context_receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_key(tenant_key)
    AND is_program_initiator()
  );

-- Context receipts are immutable (append-only audit trail).
DROP POLICY IF EXISTS "block_update_source_context_receipts" ON source_context_receipts;
CREATE POLICY "block_update_source_context_receipts" ON source_context_receipts
  FOR UPDATE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "block_delete_source_context_receipts" ON source_context_receipts;
CREATE POLICY "block_delete_source_context_receipts" ON source_context_receipts
  FOR DELETE TO authenticated
  USING (false);

GRANT INSERT ON source_context_receipts TO authenticated;


-- source_artifact_chunks, _facts, _pricing_*, _commercial_*, _vendor_*, _requirements,
-- _meeting_outcomes, _graph_edges: parser pipeline writes only. Block authenticated writes.
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'source_artifact_chunks',
    'source_artifact_facts',
    'source_pricing_components',
    'source_commercial_exceptions',
    'source_vendor_commitments',
    'source_requirements',
    'source_meeting_outcomes',
    'source_graph_edges'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      'block_authenticated_write_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (false)',
      'block_authenticated_write_' || tbl, tbl
    );
  END LOOP;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- ADMIN TABLES · INSERT/UPDATE/DELETE · tenant_admin only
-- ════════════════════════════════════════════════════════════════════════════

-- admin_connectors
DROP POLICY IF EXISTS "tenant_admin_write_admin_connectors" ON admin_connectors;
CREATE POLICY "tenant_admin_write_admin_connectors" ON admin_connectors
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_connectors TO authenticated;


-- admin_datasets
DROP POLICY IF EXISTS "tenant_admin_write_admin_datasets" ON admin_datasets;
CREATE POLICY "tenant_admin_write_admin_datasets" ON admin_datasets
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_datasets TO authenticated;


-- admin_dataset_approvals
DROP POLICY IF EXISTS "tenant_admin_write_admin_dataset_approvals" ON admin_dataset_approvals;
CREATE POLICY "tenant_admin_write_admin_dataset_approvals" ON admin_dataset_approvals
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_dataset_approvals TO authenticated;


-- admin_dataset_quality
DROP POLICY IF EXISTS "tenant_admin_write_admin_dataset_quality" ON admin_dataset_quality;
CREATE POLICY "tenant_admin_write_admin_dataset_quality" ON admin_dataset_quality
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_dataset_quality TO authenticated;


-- admin_blockers
DROP POLICY IF EXISTS "tenant_admin_write_admin_blockers" ON admin_blockers;
CREATE POLICY "tenant_admin_write_admin_blockers" ON admin_blockers
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_blockers TO authenticated;


-- admin_audit_log: append-only; tenant_admin can insert but not update/delete
DROP POLICY IF EXISTS "tenant_admin_insert_admin_audit_log" ON admin_audit_log;
CREATE POLICY "tenant_admin_insert_admin_audit_log" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "block_update_admin_audit_log" ON admin_audit_log;
CREATE POLICY "block_update_admin_audit_log" ON admin_audit_log
  FOR UPDATE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "block_delete_admin_audit_log" ON admin_audit_log;
CREATE POLICY "block_delete_admin_audit_log" ON admin_audit_log
  FOR DELETE TO authenticated
  USING (false);

GRANT INSERT ON admin_audit_log TO authenticated;


-- admin_setup_progress: tenant_admin manages setup state
DROP POLICY IF EXISTS "tenant_admin_write_admin_setup_progress" ON admin_setup_progress;
CREATE POLICY "tenant_admin_write_admin_setup_progress" ON admin_setup_progress
  FOR ALL TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  )
  WITH CHECK (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT INSERT, UPDATE, DELETE ON admin_setup_progress TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- TOWER / INTELLIGENCE TABLES · block authenticated writes (system-managed)
-- ════════════════════════════════════════════════════════════════════════════
-- These tables are written exclusively by agent orchestrators via service_role.
-- Blocking authenticated writes is intentional and documented.

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'atlas_threads',
    'atlas_observations',
    'signal_firings',
    'use_cases',
    'use_case_usage_metrics',
    'use_case_value_metrics',
    'use_case_risk',
    'use_case_cost_metrics',
    'kpis',
    'pattern_packs',
    'benchmark_cohorts',
    'external_sources',
    'external_events',
    'evidence',
    'telemetry_sources',
    'intelligence_session_log',
    'intelligence_mode_toggle_events',
    'intelligence_surface_content_registry'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      'block_authenticated_write_' || tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (false)',
      'block_authenticated_write_' || tbl, tbl
    );
  END LOOP;
END $$;


NOTIFY pgrst, 'reload schema';

COMMIT;
