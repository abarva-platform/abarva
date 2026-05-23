import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION = '20260523050000_corpus_data_layer.sql';
const migrationPath = path.join(process.cwd(), 'supabase/migrations', MIGRATION);

describe('P1 corpus data layer migration', () => {
  const sql = readFileSync(migrationPath, 'utf-8');

  it('does not trip the destructive migration guard', () => {
    expect(scanForDestructivePatterns(MIGRATION, sql)).toEqual([]);
  });

  it('creates all corpus tables with client_id scoped private patterns', () => {
    for (const table of [
      'corpus_patterns',
      'corpus_pattern_versions',
      'corpus_pattern_content',
      'corpus_pattern_relationships',
      'corpus_review_state',
      'corpus_telemetry',
      'corpus_overlays',
      'client_private_patterns',
    ]) {
      expect(sql).toContain(`public.${table}`);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain('client_id UUID NOT NULL REFERENCES public.clients(id)');
    expect(sql).not.toMatch(/\btenant_id\b/);
    expect(sql).not.toMatch(/\btenants\b/);
  });

  it('grants global authenticated reads and client-private tenant isolation', () => {
    expect(sql).toContain('CREATE POLICY auth_read_corpus_patterns');
    expect(sql).toContain('ON public.corpus_patterns FOR SELECT TO authenticated USING (true)');
    expect(sql).toContain('CREATE POLICY auth_read_client_private_patterns');
    expect(sql).toContain('USING (can_read_tenant_by_id(client_id))');
    expect(sql).toContain('WITH CHECK (can_write_tenant_by_id(client_id))');
  });
});
