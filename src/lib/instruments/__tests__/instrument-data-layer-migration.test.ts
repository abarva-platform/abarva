import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION = '20260523100000_instruments_data_layer.sql';
const migrationPath = path.join(process.cwd(), 'supabase/migrations', MIGRATION);

describe('P4 instrument data layer migration', () => {
  const sql = readFileSync(migrationPath, 'utf-8');

  it('does not trip the destructive migration guard', () => {
    expect(scanForDestructivePatterns(MIGRATION, sql)).toEqual([]);
  });

  it('creates versioned instrument tables with RLS', () => {
    for (const table of [
      'instrument_templates',
      'instrument_template_versions',
      'instrument_template_review_state',
      'instrument_template_audit',
    ]) {
      expect(sql).toContain(`public.${table}`);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain('CREATE TYPE instrument_format AS ENUM');
    expect(sql).toContain("'interactive_form'");
    expect(sql).toContain('client_id UUID REFERENCES public.clients(id)');
    expect(sql).not.toMatch(/\btenant_id\b/);
    expect(sql).not.toMatch(/\btenants\b/);
  });

  it('connects P2 discovery assignments to P4 templates', () => {
    expect(sql).toContain('discovery_instruments_instrument_template_id_fkey');
    expect(sql).toContain('REFERENCES public.instrument_templates(id)');
  });
});
