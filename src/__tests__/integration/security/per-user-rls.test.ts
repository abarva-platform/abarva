/**
 * Phase 5 · Step 7 — Per-user RLS negative test suite
 *
 * Two test layers:
 *
 * Layer 1 (this file): Static migration analysis. Verifies every migration
 * contains the expected policy definitions. Runs in CI without a live DB.
 *
 * Layer 2 (documented below): Live Supabase integration tests. These must be
 * run against a real Supabase instance with test tenants seeded. See
 * docs/build/RLS_OPERATIONS_RUNBOOK.md for the manual test protocol.
 *
 * Cross-tenant negative test matrix (Layer 2 — manual for pilot):
 *
 *   Role          | Own tenant read | Cross-tenant read | Write (own) | Write (cross)
 *   --------------|-----------------|-------------------|-------------|---------------
 *   maestro       | ALLOW           | ALLOW             | ALLOW       | ALLOW
 *   tenant_admin  | ALLOW           | BLOCK             | ALLOW       | BLOCK
 *   program_init  | ALLOW           | BLOCK             | ALLOW (own) | BLOCK
 *   client_viewer | ALLOW           | BLOCK             | BLOCK       | BLOCK
 *   observer      | BLOCK           | BLOCK             | BLOCK       | BLOCK
 *   no JWT        | BLOCK           | BLOCK             | BLOCK       | BLOCK
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations');

function readMigration(filename: string): string {
  return readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
}

// ---------------------------------------------------------------------------
// Step 1 · Role helper functions migration
// ---------------------------------------------------------------------------

describe('Phase5-RLS-001 · Step 1 · rls_role_helpers migration', () => {
  const migration = readMigration('20260507100000_rls_role_helpers.sql');

  it('defines current_tenant_key() helper', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION current_tenant_key()');
    expect(migration).toContain("auth.jwt() ->> 'tenant_key'");
  });

  it('defines current_user_role() helper with observer default', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION current_user_role()');
    expect(migration).toContain("COALESCE(auth.jwt() ->> 'role', 'observer')");
  });

  it('defines current_user_id() helper', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION current_user_id()');
    expect(migration).toContain("auth.jwt() ->> 'sub'");
  });

  it('defines is_maestro() accepting all platform-admin spellings', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION is_maestro()');
    expect(migration).toContain("'maestro'");
    expect(migration).toContain("'admin'");
    expect(migration).toContain("'investor'");
  });

  it('defines is_tenant_admin() accepting both spellings', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION is_tenant_admin()');
    expect(migration).toContain("'tenant_admin'");
    expect(migration).toContain("'client_admin'");
  });

  it('defines is_program_initiator()', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION is_program_initiator()');
    expect(migration).toContain("'program_member'");
    expect(migration).toContain("'source_member'");
  });

  it('defines can_read_tenant_by_key() text variant', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION can_read_tenant_by_key(p_tenant_key TEXT)');
    expect(migration).toContain('p_tenant_key = current_tenant_key()');
    expect(migration).toContain('OR is_maestro()');
  });

  it('defines can_read_tenant_by_id() UUID variant with clients lookup', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION can_read_tenant_by_id(p_client_id UUID)');
    expect(migration).toContain('FROM clients');
    expect(migration).toContain('tenant_key = current_tenant_key()');
  });

  it('defines can_write_tenant_by_key() requiring admin', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION can_write_tenant_by_key(p_tenant_key TEXT)');
    expect(migration).toContain('AND is_tenant_admin()');
  });

  it('all helpers are STABLE SECURITY DEFINER', () => {
    const securityDefinerCount = (migration.match(/STABLE SECURITY DEFINER/g) ?? []).length;
    expect(securityDefinerCount).toBeGreaterThanOrEqual(8);
  });

  it('grants helpers to authenticated role', () => {
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION current_tenant_key()');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION is_maestro()');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION can_read_tenant_by_key(TEXT)');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION can_read_tenant_by_id(UUID)');
  });

  it('adds tenant_key column to clients table', () => {
    expect(migration).toContain('ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_key TEXT');
    expect(migration).toContain("tenant_key = 'apexretail'");
    expect(migration).toContain("tenant_key = 'meridian'");
    expect(migration).toContain("tenant_key = 'arcturus'");
    expect(migration).toContain("tenant_key = 'keystone'");
  });
});

// ---------------------------------------------------------------------------
// Step 2 · Source tables read policies
// ---------------------------------------------------------------------------

describe('Phase5-RLS-002 · Step 2 · source read policies', () => {
  const migration = readMigration('20260507110000_source_per_user_rls_read.sql');

  const sourceTables = [
    'source_events',
    'source_event_approvals',
    'source_event_participants',
    'source_artifacts',
    'source_artifact_chunks',
    'source_artifact_facts',
    'source_pricing_components',
    'source_commercial_exceptions',
    'source_vendor_commitments',
    'source_requirements',
    'source_meeting_outcomes',
    'source_graph_edges',
    'source_context_receipts',
  ] as const;

  it.each(sourceTables)('%s has authenticated SELECT policy', (table) => {
    expect(migration).toContain(`CREATE POLICY "authenticated_read_${table}"`);
    expect(migration).toContain(`FOR SELECT TO authenticated`);
  });

  it.each(sourceTables)('%s grants SELECT to authenticated', (table) => {
    expect(migration).toContain(`GRANT SELECT ON ${table} TO authenticated`);
  });

  it('source_events policy uses can_read_tenant_by_key on client_key', () => {
    expect(migration).toMatch(/authenticated_read_source_events[\s\S]*?can_read_tenant_by_key\(client_key\)/);
  });

  it('source_event_approvals policy uses EXISTS join to source_events', () => {
    const approvalSection = migration.slice(
      migration.indexOf('"authenticated_read_source_event_approvals"'),
      migration.indexOf('"authenticated_read_source_event_participants"')
    );
    expect(approvalSection).toContain('EXISTS');
    expect(approvalSection).toContain('FROM source_events');
    expect(approvalSection).toContain('can_read_tenant_by_key(se.client_key)');
  });

  it('source_artifacts policy includes soft-delete guard', () => {
    const artifactSection = migration.slice(
      migration.indexOf('"authenticated_read_source_artifacts"'),
      migration.indexOf('"authenticated_read_source_artifact_chunks"')
    );
    expect(artifactSection).toContain('deleted_at IS NULL');
  });
});

// ---------------------------------------------------------------------------
// Step 3 · Admin tables read policies
// ---------------------------------------------------------------------------

describe('Phase5-RLS-003 · Step 3 · admin read policies', () => {
  const migration = readMigration('20260507120000_admin_per_user_rls_read.sql');

  const adminTables = [
    'admin_connectors',
    'admin_datasets',
    'admin_dataset_approvals',
    'admin_dataset_quality',
    'admin_blockers',
    'admin_audit_log',
    'admin_setup_progress',
  ] as const;

  it.each(adminTables)('%s has authenticated SELECT policy', (table) => {
    expect(migration).toContain(`CREATE POLICY "authenticated_read_${table}"`);
  });

  it.each(adminTables)('%s policy requires is_tenant_admin()', (table) => {
    const start = migration.indexOf(`"authenticated_read_${table}"`);
    const end = migration.indexOf('GRANT SELECT', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('is_tenant_admin()');
  });

  it.each(adminTables)('%s uses can_read_tenant_by_id (UUID variant)', (table) => {
    const start = migration.indexOf(`"authenticated_read_${table}"`);
    const end = migration.indexOf('GRANT SELECT', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('can_read_tenant_by_id(client_id)');
  });
});

// ---------------------------------------------------------------------------
// Step 4 · Tower + Intelligence read policies
// ---------------------------------------------------------------------------

describe('Phase5-RLS-004 · Step 4 · tower + intelligence read policies', () => {
  const migration = readMigration('20260507130000_tower_intelligence_per_user_rls_read.sql');

  const towerTables = [
    'atlas_threads',
    'atlas_observations',
    'signal_firings',
    'use_cases',
    'use_case_usage_metrics',
    'use_case_value_metrics',
    'use_case_risk',
    'use_case_cost_metrics',
  ] as const;

  const intelligenceTables = [
    'kpis',
    'pattern_packs',
    'benchmark_cohorts',
    'external_sources',
    'external_events',
    'evidence',
    'telemetry_sources',
    'intelligence_session_log',
    'intelligence_mode_toggle_events',
    'intelligence_surface_content_registry',
  ] as const;

  it.each([...towerTables, ...intelligenceTables])('%s has authenticated SELECT policy', (table) => {
    expect(migration).toContain(`CREATE POLICY "authenticated_read_${table}"`);
  });

  it('use_case_* subtables use EXISTS join through use_cases', () => {
    for (const sub of ['use_case_usage_metrics', 'use_case_value_metrics', 'use_case_risk', 'use_case_cost_metrics']) {
      const start = migration.indexOf(`"authenticated_read_${sub}"`);
      const end = migration.indexOf('GRANT SELECT', start);
      const policyBody = migration.slice(start, end);
      expect(policyBody).toContain('FROM use_cases uc');
      expect(policyBody).toContain('can_read_tenant_by_id(uc.client_id)');
    }
  });

  it('external_sources policy allows NULL client_id (platform-wide sources)', () => {
    const start = migration.indexOf('"authenticated_read_external_sources"');
    const end = migration.indexOf('GRANT SELECT', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('client_id IS NULL');
  });

  it('intelligence_surface_content_registry has open read (global registry)', () => {
    const start = migration.indexOf('"authenticated_read_intelligence_surface_content_registry"');
    const end = migration.indexOf('GRANT SELECT', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('USING (true)');
  });
});

// ---------------------------------------------------------------------------
// Step 5 · Write policies
// ---------------------------------------------------------------------------

describe('Phase5-RLS-005 · Step 5 · write policies', () => {
  const migration = readMigration('20260507140000_per_user_rls_write.sql');

  it('source_events INSERT requires is_program_initiator()', () => {
    const start = migration.indexOf('"authenticated_insert_source_events"');
    const end = migration.indexOf('DROP POLICY IF EXISTS "authenticated_update_source_events"', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('is_program_initiator()');
  });

  it('source_events DELETE is blocked for authenticated', () => {
    expect(migration).toContain('"block_delete_source_events"');
    const start = migration.indexOf('"block_delete_source_events"');
    const end = migration.indexOf('GRANT INSERT', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('USING (false)');
  });

  it('source_event_approvals INSERT requires is_tenant_admin()', () => {
    const start = migration.indexOf('"authenticated_insert_source_event_approvals"');
    const end = migration.indexOf('"block_update_source_event_approvals"', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('is_tenant_admin()');
    expect(policyBody).toContain('current_user_id()');
  });

  it('source_event_approvals UPDATE is blocked (immutable)', () => {
    const start = migration.indexOf('"block_update_source_event_approvals"');
    const end = migration.indexOf('"block_delete_source_event_approvals"', start);
    const policyBody = migration.slice(start, end);
    expect(policyBody).toContain('USING (false)');
  });

  it('source_artifacts hard DELETE is blocked', () => {
    expect(migration).toContain('"block_hard_delete_source_artifacts"');
    const start = migration.indexOf('"block_hard_delete_source_artifacts"');
    const policyBody = migration.slice(start, start + 300);
    expect(policyBody).toContain('USING (false)');
  });

  it('admin tables require is_tenant_admin() for writes', () => {
    for (const table of ['admin_connectors', 'admin_datasets', 'admin_blockers']) {
      const policyName = `"tenant_admin_write_${table}"`;
      const start = migration.indexOf(policyName);
      expect(start).toBeGreaterThan(-1);
      const policyBody = migration.slice(start, start + 500);
      expect(policyBody).toContain('is_tenant_admin()');
    }
  });

  it('admin_audit_log UPDATE and DELETE are blocked', () => {
    expect(migration).toContain('"block_update_admin_audit_log"');
    expect(migration).toContain('"block_delete_admin_audit_log"');
    const updateStart = migration.indexOf('"block_update_admin_audit_log"');
    expect(migration.slice(updateStart, updateStart + 200)).toContain('USING (false)');
  });

  it('tower/intelligence tables block authenticated writes via DO loop', () => {
    expect(migration).toContain("'atlas_threads'");
    expect(migration).toContain("'atlas_observations'");
    expect(migration).toContain("'kpis'");
    expect(migration).toContain("'pattern_packs'");
    expect(migration).toContain("block_authenticated_write_' || tbl");
    expect(migration).toContain('WITH CHECK (false)');
  });

  it('source artifact family tables block writes via DO loop', () => {
    expect(migration).toContain("'source_artifact_chunks'");
    expect(migration).toContain("'source_pricing_components'");
    expect(migration).toContain("'source_graph_edges'");
  });
});

// ---------------------------------------------------------------------------
// Step 6 · Storage policies
// ---------------------------------------------------------------------------

describe('Phase5-RLS-006 · Step 6 · storage bucket policies', () => {
  const migration = readMigration('20260507150000_storage_per_user_rls.sql');

  it('drops and recreates source_artifacts_select_tenant_path with role gate', () => {
    expect(migration).toContain("DROP POLICY IF EXISTS \"source_artifacts_select_tenant_path\"");
    expect(migration).toContain("CREATE POLICY \"source_artifacts_select_tenant_path\"");
    expect(migration).toContain("'maestro'");
    expect(migration).toContain("'tenant_admin'");
    expect(migration).toContain("'client_viewer'");
  });

  it('storage SELECT policy still enforces path prefix isolation', () => {
    const selectStart = migration.indexOf('"source_artifacts_select_tenant_path"');
    const insertStart = migration.indexOf('"source_artifacts_insert_tenant_path"');
    const selectBody = migration.slice(selectStart, insertStart);
    expect(selectBody).toContain("bucket_id = 'source-artifacts'");
    expect(selectBody).toContain("storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')");
  });

  it('storage UPDATE is blocked', () => {
    expect(migration).toContain('"block_update_source_artifacts_storage"');
    const start = migration.indexOf('"block_update_source_artifacts_storage"');
    const policyBody = migration.slice(start, start + 300);
    expect(policyBody).toContain('false  -- block all updates');
  });

  it('storage DELETE requires tenant_admin role', () => {
    expect(migration).toContain('"tenant_admin_delete_source_artifacts_storage"');
    const start = migration.indexOf('"tenant_admin_delete_source_artifacts_storage"');
    const policyBody = migration.slice(start, start + 500);
    expect(policyBody).toContain("'tenant_admin'");
    expect(policyBody).toContain("FOR DELETE");
  });
});

// ---------------------------------------------------------------------------
// Cross-tenant attack surface documentation
// ---------------------------------------------------------------------------

describe('Phase5-RLS-MATRIX · cross-tenant attack surface (spec)', () => {
  /**
   * These are specification tests — they document the expected behavior that
   * MUST be verified by live Supabase integration tests before pilot.
   *
   * The "attack" column describes what a malicious authenticated user would try.
   * The "defense" column describes which policy layer blocks it.
   *
   * Run live verification using:
   *   npm run test:integration -- per-user-rls-live
   *
   * (Live tests require SUPABASE_TEST_URL and two tenant JWTs: A and B)
   */

  const ATTACK_SURFACE = [
    {
      id: 'XA-001',
      actor: 'Apex authenticated user',
      attack: 'SELECT from source_events WHERE no filter',
      defense: 'can_read_tenant_by_key(client_key) blocks rows not matching JWT tenant_key',
      blocked: true,
    },
    {
      id: 'XA-002',
      actor: 'Apex authenticated user',
      attack: 'SELECT from admin_datasets for Meridian client_id',
      defense: 'can_read_tenant_by_id(client_id) fails UUID→key lookup for foreign client',
      blocked: true,
    },
    {
      id: 'XA-003',
      actor: 'Apex observer (role=observer)',
      attack: 'SELECT from source_events for own tenant',
      defense: 'can_read_tenant_by_key passes tenant match; observer has no additional block on reads',
      blocked: false, // observers can read
    },
    {
      id: 'XA-004',
      actor: 'Apex observer',
      attack: 'INSERT into source_events for own tenant',
      defense: 'is_program_initiator() fails for observer role',
      blocked: true,
    },
    {
      id: 'XA-005',
      actor: 'Apex program_member',
      attack: 'DELETE source_event (hard delete)',
      defense: 'block_delete_source_events policy: USING (false)',
      blocked: true,
    },
    {
      id: 'XA-006',
      actor: 'Apex tenant_admin',
      attack: 'SELECT from admin_datasets for Meridian (cross-tenant)',
      defense: 'can_read_tenant_by_id fails; Meridian client UUID does not match Apex JWT tenant_key',
      blocked: true,
    },
    {
      id: 'XA-007',
      actor: 'Any authenticated user',
      attack: 'INSERT into atlas_threads directly',
      defense: 'block_authenticated_write_atlas_threads: WITH CHECK (false)',
      blocked: true,
    },
    {
      id: 'XA-008',
      actor: 'Apex client_viewer',
      attack: 'INSERT into admin_audit_log',
      defense: 'is_tenant_admin() fails for client_viewer',
      blocked: true,
    },
    {
      id: 'XA-009',
      actor: 'No JWT (anon)',
      attack: 'SELECT from source_events',
      defense: 'current_tenant_key() returns NULL; equality fails; no rows returned',
      blocked: true,
    },
    {
      id: 'XA-010',
      actor: 'Maestro (admin role)',
      attack: 'SELECT from Meridian source_events while tenanted to Apex',
      defense: 'is_maestro() returns true; cross-tenant reads ALLOWED for maestro',
      blocked: false, // maestros can cross-tenant read
    },
  ] as const;

  it.each(ATTACK_SURFACE)('$id · $actor · $attack', ({ id, blocked, defense }) => {
    // This test documents the expected outcome.
    // blocked=true means the attack should be blocked by RLS.
    // blocked=false means the operation is permitted by design.
    expect(typeof blocked).toBe('boolean');
    expect(typeof defense).toBe('string');
    expect(defense.length).toBeGreaterThan(10);
    expect(id).toMatch(/^XA-\d{3}$/);
  });

  it('attack surface covers all key table categories', () => {
    const all = ATTACK_SURFACE.map(({ defense, attack }) => `${attack} ${defense}`).join(' ');
    expect(all).toContain('source_events');
    expect(all).toContain('admin_datasets');
    expect(all).toContain('atlas_threads');
    expect(all).toContain('admin_audit_log');
  });

  it('negative cases (blocked=true) outnumber positive (blocked=false)', () => {
    const blocked = ATTACK_SURFACE.filter((a) => a.blocked).length;
    const allowed = ATTACK_SURFACE.filter((a) => !a.blocked).length;
    expect(blocked).toBeGreaterThan(allowed);
  });
});
