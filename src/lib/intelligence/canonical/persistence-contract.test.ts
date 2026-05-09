import { readFileSync } from 'node:fs';
import path from 'node:path';

import { CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS } from './industry-ai-pattern';
import {
  CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
  CANONICAL_PATTERN_DUPLICATE_RISKS,
  CANONICAL_PATTERN_PERSISTENCE_REQUIRED_FIELDS,
  CANONICAL_PATTERN_PERSISTED_FILTER_COLUMNS,
  CANONICAL_PATTERN_PERSISTED_PROVENANCE_COLUMNS,
  CANONICAL_PATTERN_VISIBILITY_SCOPES,
  sourceCrosswalkKeys,
  type PersistedCanonicalIndustryAIPatternRow,
} from './persistence-contract';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260513150000_canonical_industry_ai_patterns.sql',
);
const migration = readFileSync(migrationPath, 'utf8');
const migrationLower = migration.toLowerCase();

describe('canonical pattern persistence contract', () => {
  it('uses the canonical source-of-record table name', () => {
    expect(CANONICAL_INDUSTRY_AI_PATTERNS_TABLE).toBe('canonical_industry_ai_patterns');
    expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${CANONICAL_INDUSTRY_AI_PATTERNS_TABLE}`);
  });

  it('persists every required canonical field as a first-class column', () => {
    expect(CANONICAL_PATTERN_PERSISTENCE_REQUIRED_FIELDS).toEqual(
      CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS,
    );

    for (const field of CANONICAL_PATTERN_PERSISTENCE_REQUIRED_FIELDS) {
      expect(migrationLower).toContain(`${field.toLowerCase()} `);
    }
  });

  it('keeps retrieval filters and provenance fields indexed or first-class', () => {
    for (const column of CANONICAL_PATTERN_PERSISTED_FILTER_COLUMNS) {
      expect(migrationLower).toContain(column);
    }

    for (const column of CANONICAL_PATTERN_PERSISTED_PROVENANCE_COLUMNS) {
      expect(migrationLower).toContain(column);
    }

    expect(migrationLower).toContain('idx_canonical_ai_patterns_industry');
    expect(migrationLower).toContain('idx_canonical_ai_patterns_phases');
    expect(migrationLower).toContain('idx_canonical_ai_patterns_content_hash');
    expect(migrationLower).toContain('idx_canonical_ai_patterns_fts');
  });

  it('is additive and does not backfill or mutate existing corpus content', () => {
    expect(migrationLower).not.toMatch(/\binsert\s+into\b/);
    expect(migrationLower).not.toMatch(/\bupdate\s+(pattern_packs|genome_patterns|knowledge_sources|knowledge_chunks)\b/);
    expect(migrationLower).not.toMatch(/\bdelete\s+from\b/);
    expect(migrationLower).not.toMatch(/\btruncate\b/);
    expect(migrationLower).not.toMatch(/\bdrop\s+table\b/);
    expect(migrationLower).not.toMatch(/\balter\s+table\s+(?!canonical_industry_ai_patterns\b)/);
  });

  it('enforces read-only authenticated RLS and service-role writes', () => {
    expect(migrationLower).toContain('enable row level security');
    expect(migrationLower).toContain('service_role_all_canonical_industry_ai_patterns');
    expect(migrationLower).toContain('authenticated_read_canonical_industry_ai_patterns');
    expect(migrationLower).toContain('grant select on canonical_industry_ai_patterns to authenticated');
    expect(migrationLower).not.toContain('grant insert');
    expect(migrationLower).not.toContain('grant update');
    expect(migrationLower).not.toContain('grant delete');
  });

  it('supports global and tenant/private pattern visibility scopes', () => {
    expect(CANONICAL_PATTERN_VISIBILITY_SCOPES).toEqual(['global', 'tenant', 'private']);
    expect(CANONICAL_PATTERN_DUPLICATE_RISKS).toEqual(['low', 'medium', 'high']);
    expect(migrationLower).toContain("visibility_scope in ('global', 'tenant', 'private')");
    expect(migrationLower).toContain("duplicate_risk is null or duplicate_risk in ('low', 'medium', 'high')");
    expect(migrationLower).toContain("visibility_scope = 'global'");
    expect(migrationLower).toContain('can_read_tenant_by_key(tenant_key)');
    expect(migrationLower).toContain('can_read_tenant_by_id(client_id)');
  });

  it('auto-touches updated_at with the existing migration helper', () => {
    expect(migrationLower).toContain('canonical_industry_ai_patterns_set_updated_at');
    expect(migrationLower).toContain('execute function trigger_set_updated_at()');
  });

  it('preserves source crosswalk keys for duplicate-risk and provenance workflows', () => {
    const row = {
      source_crosswalk: [
        { source_system: 'pattern_seed', source_id: 'PAT-001', relationship: 'primary' },
        { source_system: 'genome_patterns', source_id: 'GP-001', relationship: 'related' },
      ],
    } as Pick<PersistedCanonicalIndustryAIPatternRow, 'source_crosswalk'>;

    expect(sourceCrosswalkKeys(row)).toEqual([
      'pattern_seed:PAT-001',
      'genome_patterns:GP-001',
    ]);
  });
});
