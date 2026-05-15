import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations');
const migration = readFileSync(
  join(MIGRATIONS_DIR, '20260513073000_public_rls_security_advisor_lockdown.sql'),
  'utf8',
);

const lockedTables = [
  'emergent_patterns',
  'founder_approval_requests',
  'intelligence_artifacts',
  'intelligence_thread_turns',
  'intelligence_threads',
  'invoices',
  'maestro_oversight_flags',
  'module_state_log',
  'org_data_version',
  'pattern_match_logs',
  'phase_snapshots',
  'portfolio_signals',
  'program_milestones',
  'program_modules',
  'program_origination_drafts',
  'program_risks',
  'program_threads',
  'program_work_items',
  'reasoning_alert_states',
  'reasoning_evidence_ingestions',
  'reasoning_mission_states',
  'reasoning_resolved_contradictions',
  'reasoning_telemetry_events',
  'schema_migrations',
  'team_memberships',
  'teams',
  'user_bookmarks',
  'user_pinned_signals',
];

describe('public RLS security advisor lockdown migration', () => {
  it('locks every table flagged by the live Security Advisor audit', () => {
    for (const table of lockedTables) {
      expect(migration).toContain(`'${table}'`);
    }
  });

  it('enables RLS and removes exposed Data API grants', () => {
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('REVOKE ALL ON TABLE public.%I FROM anon, authenticated');
    expect(migration).toContain('GRANT ALL ON TABLE public.%I TO service_role');
  });

  it('keeps server-side service-role access explicit', () => {
    expect(migration).toContain('CREATE POLICY %I ON public.%I FOR ALL TO service_role');
    expect(migration).toContain('USING (true) WITH CHECK (true)');
  });

  it('hardens future table defaults in public schema', () => {
    expect(migration).toContain('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated');
    expect(migration).toContain('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role');
  });
});
