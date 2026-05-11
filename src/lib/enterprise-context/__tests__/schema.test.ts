import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  ENTERPRISE_CONTEXT_COMMON_METADATA_COLUMNS,
  ENTERPRISE_CONTEXT_TABLES,
  normalizeEnterpriseContextTenantKey,
} from '../schema';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260514100000_enterprise_context_layer.sql',
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('enterprise context schema contract', () => {
  it('creates every canonical enterprise context table', () => {
    for (const table of ENTERPRISE_CONTEXT_TABLES) {
      expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('keeps required provenance columns available on persisted context records and facts', () => {
    const requiredTables = [
      'enterprise_context_records',
      'enterprise_context_facts',
      'enterprise_context_relationships',
      'enterprise_context_evidence',
      'enterprise_context_quality_issues',
      'enterprise_context_stewardship_tasks',
      'enterprise_context_snapshots',
      'enterprise_context_template_runs',
      'enterprise_context_chunk_queue',
    ];

    for (const table of requiredTables) {
      const tableBlock = extractCreateTableBlock(table);
      for (const column of ENTERPRISE_CONTEXT_COMMON_METADATA_COLUMNS) {
        expect(tableBlock).toContain(column);
      }
    }
  });

  it('enforces tenant-scoped uniqueness and active/superseded/inactive lifecycle states', () => {
    expect(migrationSql).toContain('UNIQUE (tenant_key, canonical_record_id)');
    expect(migrationSql).toContain('UNIQUE (tenant_key, source_system, source_record_id)');
    expect(migrationSql).toContain("lifecycle_state IN ('active','superseded','inactive')");
  });

  it('adds tenant RLS policies without weakening existing setup-data tables', () => {
    for (const table of ENTERPRISE_CONTEXT_TABLES) {
      expect(migrationSql).toContain(`ALTER TABLE %I ENABLE ROW LEVEL SECURITY`);
      expect(migrationSql).toContain(table);
    }

    expect(migrationSql).toContain('can_read_tenant_by_key(tenant_key)');
    expect(migrationSql).toContain('can_write_tenant_by_key(tenant_key)');
    expect(migrationSql).not.toContain('DROP TABLE data_inventory_records');
    expect(migrationSql).not.toContain('ALTER TABLE data_inventory_records');
  });

  it('normalizes historical tenant aliases to canonical client keys', () => {
    expect(normalizeEnterpriseContextTenantKey('meridian-health')).toBe('meridian');
    expect(normalizeEnterpriseContextTenantKey('apex-retail')).toBe('apexretail');
    expect(normalizeEnterpriseContextTenantKey('first-capital')).toBe('arcturus');
    expect(normalizeEnterpriseContextTenantKey('unknown')).toBeNull();
  });
});

function extractCreateTableBlock(table: string): string {
  const start = migrationSql.indexOf(`CREATE TABLE IF NOT EXISTS ${table}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = migrationSql.indexOf('CREATE TABLE IF NOT EXISTS', start + 1);
  return migrationSql.slice(start, next === -1 ? undefined : next);
}
