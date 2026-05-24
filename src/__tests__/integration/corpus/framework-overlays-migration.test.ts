import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION = '20260523182000_framework_overlays.sql';
const migrationPath = path.join(process.cwd(), 'supabase/migrations', MIGRATION);

describe('legacy cutover framework overlays migration', () => {
  const sql = readFileSync(migrationPath, 'utf-8');

  it('does not trip the destructive migration guard', () => {
    expect(scanForDestructivePatterns(MIGRATION, sql)).toEqual([]);
  });

  it('creates DB-backed framework overlays with clients/client_id convention', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.framework_overlays');
    expect(sql).toContain('client_id UUID REFERENCES public.clients(id)');
    expect(sql).toContain('vertical_key TEXT NOT NULL');
    expect(sql).toContain('function_key TEXT NOT NULL');
    expect(sql).toContain('framework_jsonb JSONB NOT NULL');
    expect(sql).toContain('ALTER TABLE public.framework_overlays ENABLE ROW LEVEL SECURITY');
    expect(sql).not.toMatch(/\btenant_id\b/);
    expect(sql).not.toMatch(/\btenants\b/);
  });

  it('separates global overlays from client-scoped overlays under RLS', () => {
    expect(sql).toContain('client_id IS NULL OR can_read_tenant_by_id(client_id)');
    expect(sql).toContain('client_id IS NULL OR can_write_tenant_by_id(client_id)');
    expect(sql).toContain('coalesce(client_id::text, \'global\')');
    expect(sql).toContain('idx_framework_overlays_lookup');
  });
});
