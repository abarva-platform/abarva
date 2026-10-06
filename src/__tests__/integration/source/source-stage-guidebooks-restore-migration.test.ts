import fs from 'node:fs';
import path from 'node:path';

import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION_FILE = path.resolve(
  process.cwd(),
  'supabase/migrations/20260905123000_source_stage_guidebooks_restore.sql',
);

function readMigration(): string {
  return fs.readFileSync(MIGRATION_FILE, 'utf8');
}

describe('Source stage guidebook restore migration', () => {
  it('restores the repository table expected by the app readback seam', () => {
    const sql = readMigration();

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS source_stage_guidebooks');
    expect(sql).toContain('stage_key         TEXT NOT NULL');
    expect(sql).toContain('client_key        TEXT');
    expect(sql).toContain('sections          JSONB NOT NULL DEFAULT');
    expect(sql).toContain('version           INTEGER NOT NULL DEFAULT 1');
    expect(sql).toContain('source_stage_guidebooks_status_chk');
  });

  it('keeps the lookup path indexed and prevents duplicate global defaults', () => {
    const sql = readMigration();

    expect(sql).toContain('source_stage_guidebooks_stage_idx');
    expect(sql).toContain('source_stage_guidebooks_unique_published_global_idx');
    expect(sql).toContain('WHERE client_key IS NULL');
  });

  it('restores tenant-safe read policies without allowing authenticated writes', () => {
    const sql = readMigration();

    expect(sql).toContain('ALTER TABLE source_stage_guidebooks ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('service_role_all_source_stage_guidebooks');
    expect(sql).toContain('authenticated_read_source_stage_guidebooks');
    expect(sql).toContain('client_key IS NULL OR can_read_tenant_by_key(client_key)');
    expect(sql).toContain('GRANT SELECT ON source_stage_guidebooks TO authenticated');
    expect(sql).toContain('GRANT ALL ON source_stage_guidebooks TO service_role');
    expect(sql).not.toContain('GRANT INSERT ON source_stage_guidebooks TO authenticated');
    expect(sql).not.toContain('GRANT UPDATE ON source_stage_guidebooks TO authenticated');
    expect(sql).not.toContain('GRANT DELETE ON source_stage_guidebooks TO authenticated');
  });

  it('seeds published global defaults for the repository verifier', () => {
    const sql = readMigration();

    expect(sql).toContain("'strategy'::text AS stage_key");
    expect(sql).toContain("'Strategy Gate Review'::text AS title");
    expect(sql).toContain("'rfp'");
    expect(sql).toContain("'RFP Readiness Review'");
    expect(sql).toContain("AND existing.status = 'published'");
    expect(sql).toContain('AND existing.version = 1');
  });

  it('reloads the PostgREST schema cache after restoring the object', () => {
    const sql = readMigration();

    expect(sql).toContain("NOTIFY pgrst, 'reload schema'");
  });

  it('does not contain destructive migration patterns', () => {
    const sql = readMigration();

    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
